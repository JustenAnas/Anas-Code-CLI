import Anthropic from "@anthropic-ai/sdk";
import type { Tool } from "@anthropic-ai/sdk/resources/messages";
import {
  ProviderError,
  type BaseProvider,
  type Message,
  type ProviderResponse,
  type ToolCall,
} from "./base.js";

const TOOLS: Tool[] = [
  {
    name: "read_file",
    description: "Read the contents of a file",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "The file path to read" },
      },
      required: ["path"],
    },
  },
  {
    name: "write_file",
    description: "Write or create a file",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "The file path to write" },
        content: { type: "string", description: "The content to write" },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "bash",
    description: "Run a terminal command",
    input_schema: {
      type: "object",
      properties: {
        command: { type: "string", description: "The command to run" },
      },
      required: ["command"],
    },
  },
  {
    name: "glob",
    description: "Find files matching a glob pattern",
    input_schema: {
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
  {
    name: "list_dir",
    description: "List files and folders in a directory",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "The directory path to list" },
      },
      required: ["path"],
    },
  },
  {
    name: "edit_file",
    description: "Edit a specific part of a file by replacing exact text",
    input_schema: {
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
  {
    name: "git",
    description: "Inspect Git repository state",
    input_schema: {
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
  {
    name: "search_code",
    description:
      "Search project file contents for text, symbols, functions, classes, variables, or imports. Use instead of bash, grep, or findstr for content searches.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The text to search for inside project files",
        },
      },
      required: ["query"],
    },
  },
];

export class ClaudeProvider implements BaseProvider {
  name = "claude";

  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model = "claude-sonnet-4-5") {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  
async verifyApiKey(): Promise<void> {
  try {
    // A minimal request to verify that Claude accepts the API key.
    await this.client.messages.create({
      model: this.model,
      max_tokens: 1,
      messages: [
        {
          role: "user",
          content: "Hi",
        },
      ],
    });
  } catch (error) {
    this.handleError(error);
  }
}


  private buildMessages(
    messages: Message[],
    systemPrompt?: string,
  ): { system?: string; messages: any[] } {
    const result: any[] = [];

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];

      if (message.role === "user") {
        result.push({
          role: "user",
          content: message.content,
        });
      }

      if (message.role === "assistant") {
        const toolCalls =
          message.toolCalls ?? (message.toolCall ? [message.toolCall] : []);

        if (toolCalls.length > 0) {
          const content: any[] = [];

          if (message.content) {
            content.push({
              type: "text",
              text: message.content,
            });
          }

          for (const toolCall of toolCalls) {
            content.push({
              type: "tool_use",
              id: toolCall.id,
              name: toolCall.name,
              input: toolCall.input,
            });
          }

          result.push({
            role: "assistant",
            content,
          });
        } else {
          result.push({
            role: "assistant",
            content: message.content,
          });
        }
      }

      if (message.role === "tool") {
        // Anthropic expects tool results inside user messages.
        // Combine consecutive tool results into one user message.
        const toolResults: any[] = [];

        while (i < messages.length && messages[i].role === "tool") {
          const toolMessage = messages[i];

          if (toolMessage.role === "tool") {
            toolResults.push({
              type: "tool_result",
              tool_use_id: toolMessage.toolCallId,
              content: toolMessage.content,
            });
          }

          i++;
        }

        i--;

        result.push({
          role: "user",
          content: toolResults,
        });
      }
    }

    return {
      system: systemPrompt || undefined,
      messages: result,
    };
  }

  private handleError(error: unknown): never {
    if (error instanceof Anthropic.APIError) {
      const status = error.status;

      if (status === 401) {
        throw new ProviderError("Invalid Claude API key.", 401, false);
      }

      if (status === 403) {
        throw new ProviderError(
          `Claude API access denied: ${error.message}`,
          403,
          false,
        );
      }

      if (status === 429) {
        throw new ProviderError("Claude rate limit exceeded.", 429, true);
      }

      if (status === 400) {
        throw new ProviderError(
          `Claude request error: ${error.message}`,
          400,
          false,
        );
      }

      if ([408, 409, 500, 502, 503, 529].includes(status)) {
        throw new ProviderError(
          `Claude API error (${status}): ${error.message}`,
          status,
          true,
        );
      }

      throw new ProviderError(
        `Claude API error (${status}): ${error.message}`,
        status,
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

  private extractToolCalls(content: any[]): ToolCall[] {
    return content
      .filter((block) => block.type === "tool_use")
      .map((block) => ({
        id: block.id,
        name: block.name,
        input: block.input,
      }));
  }

  async sendMessage(
    messages: Message[],
    systemPrompt?: string,
  ): Promise<ProviderResponse> {
    try {
      const built = this.buildMessages(messages, systemPrompt);

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 8096,
        ...(built.system ? { system: built.system } : {}),
        messages: built.messages,
        tools: TOOLS,
      });

      const content = response.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("");

      const toolCalls = this.extractToolCalls(response.content);

      return {
        content,
        ...(toolCalls.length > 0 ? { toolCall: toolCalls[0], toolCalls } : {}),
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async streamMessage(
    messages: Message[],
    onChunk: (chunk: string) => void,
    systemPrompt?: string,
  ): Promise<ProviderResponse> {
    try {
      const built = this.buildMessages(messages, systemPrompt);

      const stream = this.client.messages.stream({
        model: this.model,
        max_tokens: 8096,
        ...(built.system ? { system: built.system } : {}),
        messages: built.messages,
        tools: TOOLS,
      });

      let fullContent = "";
      let inputTokens = 0;
      let outputTokens = 0;

      const toolCallsByIndex = new Map<
        number,
        { id: string; name: string; arguments: string }
      >();

      for await (const chunk of stream) {
        if (chunk.type === "message_start") {
          inputTokens = chunk.message.usage.input_tokens;
        }

        if (chunk.type === "message_delta") {
          outputTokens = chunk.usage.output_tokens;
        }

        if (chunk.type === "content_block_start") {
          if (chunk.content_block.type === "tool_use") {
            toolCallsByIndex.set(chunk.index, {
              id: chunk.content_block.id,
              name: chunk.content_block.name,
              arguments: "",
            });
          }
        }

        if (chunk.type === "content_block_delta") {
          if (chunk.delta.type === "text_delta") {
            fullContent += chunk.delta.text;
            onChunk(chunk.delta.text);
          }

          if (chunk.delta.type === "input_json_delta") {
            const existing = toolCallsByIndex.get(chunk.index);

            if (existing) {
              existing.arguments += chunk.delta.partial_json;
            }
          }
        }
      }

      const toolCalls: ToolCall[] = [...toolCallsByIndex.values()].map(
        (call) => ({
          id: call.id,
          name: call.name,
          input: JSON.parse(call.arguments || "{}"),
        }),
      );

      return {
        content: fullContent,
        ...(toolCalls.length > 0 ? { toolCall: toolCalls[0], toolCalls } : {}),
        inputTokens,
        outputTokens,
      };
    } catch (error) {
      this.handleError(error);
    }
  }
}
