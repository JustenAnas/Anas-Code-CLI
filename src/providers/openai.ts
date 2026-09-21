import OpenAI from "openai";
import {
  ProviderError,
  type BaseProvider,
  type Message,
  type ProviderResponse,
  type ToolCall,
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
          path: { type: "string", description: "The file path to read" },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "write_file",
      description: "Write or create a file",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "The file path to write" },
          content: { type: "string", description: "The content to write" },
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
          command: { type: "string", description: "The command to run" },
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
            description: "The file pattern to search for",
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
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "The directory path to list" },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "edit_file",
      description: "Edit a specific part of a file by replacing exact text",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "The file path to edit" },
          oldStr: {
            type: "string",
            description: "The exact text to find and replace",
          },
          newStr: {
            type: "string",
            description: "The new text to replace it with",
          },
        },
        required: ["path", "oldStr", "newStr"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "git",
      description: "Inspect Git repository state",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["status", "diff", "log", "branch"],
            description: "The Git action to perform",
          },
        },
        required: ["action"],
      },
    },
  },
];

export class OpenAIProvider implements BaseProvider {
  name = "openai";
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
    this.model = "gpt-4o";
  }

  private buildMessages(messages: Message[], systemPrompt?: string): any[] {
    const result: any[] = [];

    if (systemPrompt) {
      result.push({ role: "system", content: systemPrompt });
    }

    for (const message of messages) {
      if (message.role === "user") {
        result.push({ role: "user", content: message.content });
      }

      if (message.role === "assistant") {
        if (message.toolCall) {
          result.push({
            role: "assistant",
            content: message.content || null,
            tool_calls: [
              {
                id: message.toolCall.id,
                type: "function",
                function: {
                  name: message.toolCall.name,
                  arguments: JSON.stringify(message.toolCall.input),
                },
              },
            ],
          });
        } else {
          result.push({ role: "assistant", content: message.content });
        }
      }

      if (message.role === "tool") {
        result.push({
          role: "tool",
          tool_call_id: message.toolCallId,
          content: message.content,
        });
      }
    }

    return result;
  }

  async sendMessage(
    messages: Message[],
    systemPrompt?: string,
  ): Promise<ProviderResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: this.buildMessages(messages, systemPrompt),
        tools: TOOLS,
      });

      const message = response.choices[0].message;
      const toolCall = message.tool_calls?.[0];

      if (toolCall && toolCall.type === "function") {
        return {
          content: message.content ?? "",
          toolCall: {
            id: toolCall.id,
            name: toolCall.function.name,
            input: JSON.parse(toolCall.function.arguments || "{}"),
          },
          inputTokens: response.usage?.prompt_tokens,
          outputTokens: response.usage?.completion_tokens,
        };
      }

      return {
        content: message.content ?? "",
        inputTokens: response.usage?.prompt_tokens,
        outputTokens: response.usage?.completion_tokens,
      };
    } catch (error) {
  if (error instanceof OpenAI.APIError) {
    if (error.status === 401) {
      throw new ProviderError(
        "Invalid OpenAI API key.",
        401,
        false,
      );
    }

    if (error.status === 429) {
      throw new ProviderError(
        "OpenAI rate limit exceeded.",
        429,
        true,
      );
    }

    if (error.status === 400) {
      throw new ProviderError(
        `OpenAI request error: ${error.message}`,
        400,
        false,
      );
    }

    if (error.status === 500) {
      throw new ProviderError(
        `OpenAI API error (500): ${error.message}`,
        500,
        true,
      );
    }

    throw new ProviderError(
      `OpenAI API error (${error.status}): ${error.message}`,
      error.status,
      false,
    );
  }

  throw new ProviderError(
    `Network or connection error: ${
      error instanceof Error ? error.message : String(error)
    }`,
    undefined,
    true,
  );
}
  }

  async streamMessage(
    messages: Message[],
    onChunk: (chunk: string) => void,
    systemPrompt?: string,
  ): Promise<ProviderResponse> {
    try {
      let fullContent = "";
      let toolCallId = "";
      let toolCallName = "";
      let toolCallArguments = "";

      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: this.buildMessages(messages, systemPrompt),
        tools: TOOLS,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        const text = delta?.content ?? "";

        if (text) {
          fullContent += text;
          onChunk(text);
        }

        const toolCall = delta?.tool_calls?.[0];

        if (toolCall) {
          if (toolCall.id) toolCallId = toolCall.id;
          if (toolCall.function?.name) toolCallName = toolCall.function.name;
          if (toolCall.function?.arguments) {
            toolCallArguments += toolCall.function.arguments;
          }
        }
      }

      if (toolCallName) {
        let parsedInput: Record<string, string> = {};

        try {
          parsedInput = JSON.parse(toolCallArguments || "{}");
        } catch {
          parsedInput = {};
        }

        const toolCall: ToolCall = {
          id: toolCallId,
          name: toolCallName,
          input: parsedInput,
        };

        return { content: fullContent, toolCall };
      }

      return { content: fullContent };
    } catch (error) {
  if (error instanceof OpenAI.APIError) {
    if (error.status === 401) {
      throw new ProviderError(
        "Invalid OpenAI API key.",
        401,
        false,
      );
    }

    if (error.status === 429) {
      throw new ProviderError(
        "OpenAI rate limit exceeded.",
        429,
        true,
      );
    }

    if (error.status === 400) {
      throw new ProviderError(
        `OpenAI request error: ${error.message}`,
        400,
        false,
      );
    }

    if (error.status === 500) {
      throw new ProviderError(
        `OpenAI API error (500): ${error.message}`,
        500,
        true,
      );
    }

    throw new ProviderError(
      `OpenAI API error (${error.status}): ${error.message}`,
      error.status,
      false,
    );
  }

  throw new ProviderError(
    `Network or connection error: ${
      error instanceof Error ? error.message : String(error)
    }`,
    undefined,
    true,
  );
}
  }
}
