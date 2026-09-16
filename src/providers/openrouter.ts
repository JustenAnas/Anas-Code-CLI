import OpenAI from "openai";
import type {
  BaseProvider,
  Message,
  ProviderResponse,
  ToolCall,
} from "./base.js";

const TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "read_file",
      description: "Read the contents of a file",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "The file path to read",
          },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "write_file",
      description: "Write or create a file with the given content",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "The file path to write",
          },
          content: {
            type: "string",
            description: "The content to write",
          },
        },
        required: ["path", "content"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "bash",
      description: "Run a terminal command",
      parameters: {
        type: "object",
        properties: {
          command: {
            type: "string",
            description: "The command to run",
          },
        },
        required: ["command"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "glob",
      description: "Find files matching a glob pattern",
      parameters: {
        type: "object",
        properties: {
          pattern: {
            type: "string",
            description: "The file pattern to match",
          },
        },
        required: ["pattern"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_dir",
      description: "List files and folders in a directory",
      input_schema: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "The file path to list",
          },
        },
        required: ["path"],
      },
    },
  },
];

export class OpenRouterProvider implements BaseProvider {
  name = "openrouter";
  private client: OpenAI;
  private model: string;

  constructor(
    apiKey: string,
    // model = "meta-llama/llama-3.1-8b-instruct",
    // model = "google/gemma-4-26b-a4b-it:free",
       model = "nvidia/nemotron-3-super-120b-a12b:free"
  ) {
    this.client = new OpenAI({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
    });

    this.model = model;
  }

  private formatMessages(messages: Message[]) {
    return messages.map((message) => {
      if (message.role === "tool") {
        return {
          role: "tool" as const,
          content: message.content,
          tool_call_id: message.toolCallId!,
        };
      }

      if (message.role === "assistant" && message.toolCall) {
        return {
          role: "assistant" as const,
          content: message.content || null,
          tool_calls: [
            {
              id: message.toolCall.id!,
              type: "function" as const,
              function: {
                name: message.toolCall.name,
                arguments: JSON.stringify(message.toolCall.input),
              },
            },
          ],
        };
      }

      return {
        role: message.role,
        content: message.content,
      };
    });
  }

  async sendMessage(
    messages: Message[],
    systemPrompt?: string,
  ): Promise<ProviderResponse> {
    const formattedMessages = this.formatMessages(messages);

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: systemPrompt
        ? [{ role: "system", content: systemPrompt }, ...formattedMessages]
        : formattedMessages,
      tools: TOOLS,
      parallel_tool_calls: false,
    });

    const message = response.choices[0].message;

    let toolCall: ToolCall | undefined;

    if (message.tool_calls?.[0]?.type === "function") {
      const call = message.tool_calls[0];

      try {
        toolCall = {
          id: call.id,
          name: call.function.name,
          input: JSON.parse(call.function.arguments),
        };
      } catch {}
    }

    return {
      content: message.content ?? "",
      toolCall,
      inputTokens: response.usage?.prompt_tokens,
      outputTokens: response.usage?.completion_tokens,
    };
  }

  async streamMessage(
    messages: Message[],
    onChunk: (chunk: string) => void,
    systemPrompt?: string,
  ): Promise<ProviderResponse> {
    let fullContent = "";
    let toolName = "";
    let toolArguments = "";
    let toolId = "";

    // Holds possible old text-based tool-call content.
    let pendingText = "";
    let hidingToolText = false;

    const formattedMessages = this.formatMessages(messages);

    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: systemPrompt
        ? [{ role: "system", content: systemPrompt }, ...formattedMessages]
        : formattedMessages,
      tools: TOOLS,
      parallel_tool_calls: false,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;

      // Native structured tool call.
      const nativeToolCall = delta?.tool_calls?.[0];

      if (nativeToolCall) {
        if (nativeToolCall.id) {
          toolId += nativeToolCall.id;
        }

        if (nativeToolCall.function?.name) {
          toolName += nativeToolCall.function.name;
        }

        if (nativeToolCall.function?.arguments) {
          toolArguments += nativeToolCall.function.arguments;
        }

        // Never display native tool-call data.
        continue;
      }

      const text = delta?.content ?? "";

      if (!text) {
        continue;
      }

      fullContent += text;

      pendingText += text;

      // If we have entered an old text-based tool call,
      // keep everything hidden until it ends.
      if (hidingToolText) {
        const endIndex = pendingText.indexOf("</tool_call>");

        if (endIndex !== -1) {
          pendingText = pendingText.slice(
            endIndex + "</tool_call>".length,
          );

          hidingToolText = false;
        } else {
          pendingText = "";
          continue;
        }
      }

      // Detect the beginning of the old text-based format.
      const toolStart = pendingText.indexOf("<tool_call>");

      if (toolStart !== -1) {
        const beforeTool = pendingText.slice(0, toolStart);

        if (beforeTool) {
          onChunk(beforeTool);
        }

        pendingText = pendingText.slice(
          toolStart + "<tool_call>".length,
        );

        hidingToolText = true;

        const endIndex = pendingText.indexOf("</tool_call>");

        if (endIndex !== -1) {
          pendingText = pendingText.slice(
            endIndex + "</tool_call>".length,
          );

          hidingToolText = false;
        } else {
          pendingText = "";
          continue;
        }
      }

      // Keep a tiny buffer only when the text could be the beginning
      // of "<tool_call>".
      const prefix = "<tool_call";

      if (
        !hidingToolText &&
        prefix.startsWith(pendingText) &&
        pendingText.length < prefix.length
      ) {
        continue;
      }

      if (!hidingToolText && pendingText) {
        onChunk(pendingText);
        pendingText = "";
      }
    }

    // Flush remaining normal text.
    if (!hidingToolText && pendingText) {
      onChunk(pendingText);
    }

    let toolCall: ToolCall | undefined;

    if (toolName && toolArguments) {
      try {
        toolCall = {
          id: toolId,
          name: toolName,
          input: JSON.parse(toolArguments),
        };
      } catch {}
    }

    return {
      content: fullContent,
      toolCall,
    };
  }
}