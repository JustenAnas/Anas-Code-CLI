import {
  GoogleGenerativeAI,
  SchemaType,
  type Tool,
} from "@google/generative-ai";

import {
  ProviderError,
  type BaseProvider,
  type Message,
  type ProviderResponse,
  type ToolCall,
} from "./base.js";

const TOOLS: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "read_file",
        description: "Read the contents of a file",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            path: {
              type: SchemaType.STRING,
              description: "The file path to read",
            },
          },
          required: ["path"],
        },
      },
      {
        name: "write_file",
        description: "Write or create a file",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            path: {
              type: SchemaType.STRING,
              description: "The file path to write",
            },
            content: {
              type: SchemaType.STRING,
              description: "The content to write",
            },
          },
          required: ["path", "content"],
        },
      },
      {
        name: "bash",
        description: "Run a terminal command",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            command: {
              type: SchemaType.STRING,
              description: "The command to run",
            },
          },
          required: ["command"],
        },
      },
      {
        name: "glob",
        description: "Find files matching a glob pattern",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            pattern: {
              type: SchemaType.STRING,
              description: "The file pattern to search for",
            },
          },
          required: ["pattern"],
        },
      },
      {
        name: "list_dir",
        description: "List files and folders in a directory",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            path: {
              type: SchemaType.STRING,
              description: "The directory path to list",
            },
          },
          required: ["path"],
        },
      },
      {
        name: "edit_file",
        description: "Replace exact text in a file",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            path: {
              type: SchemaType.STRING,
              description: "The file path to edit",
            },
            oldStr: {
              type: SchemaType.STRING,
              description: "Exact text to replace",
            },
            newStr: {
              type: SchemaType.STRING,
              description: "Replacement text",
            },
          },
          required: ["path", "oldStr", "newStr"],
        },
      },
      {
        name: "git",
        description: "Inspect Git repository state",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            action: {
              type: SchemaType.STRING,
              format: "enum",
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
          "Search project file contents for text, symbols, functions, classes, variables, or imports. Use instead of terminal commands for content searches.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            query: {
              type: SchemaType.STRING,
              description: "Text to search for inside project files",
            },
          },
          required: ["query"],
        },
      },
    ],
  },
];

export class GeminiProvider implements BaseProvider {
  name = "gemini";

  private client: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey: string, model = "gemini-3.6-flash") {
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = model;
  }

  private buildHistory(messages: Message[]): any[] {
    const history: any[] = [];

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];

      if (message.role === "user") {
        history.push({
          role: "user",
          parts: [{ text: message.content }],
        });
        continue;
      }

      if (message.role === "assistant") {
        const calls =
          message.toolCalls ?? (message.toolCall ? [message.toolCall] : []);

        if (calls.length > 0) {
          history.push({
            role: "model",
            parts: calls.map((call) => ({
              functionCall: {
                name: call.name,
                args: call.input,
              },
            })),
          });
        } else if (message.content) {
          history.push({
            role: "model",
            parts: [{ text: message.content }],
          });
        }

        continue;
      }

      if (message.role === "tool") {
        // Gemini expects function responses, not plain-text tool messages.
        history.push({
          role: "user",
          parts: [
            {
              functionResponse: {
                name: this.findToolName(messages, i),
                response: { result: message.content },
              },
            },
          ],
        });
      }
    }

    return history;
  }

  private findToolName(messages: Message[], toolIndex: number): string {
    const toolMessage = messages[toolIndex];

    if (toolMessage.role !== "tool") return "unknown_tool";

    // Prefer the assistant's recorded call ID/name when available.
    for (let i = toolIndex - 1; i >= 0; i--) {
      const previous = messages[i];

      if (previous.role !== "assistant") continue;

      const calls =
        previous.toolCalls ?? (previous.toolCall ? [previous.toolCall] : []);

      const matching = calls.find((call) => call.id === toolMessage.toolCallId);

      if (matching) return matching.name;

      break;
    }

    return "unknown_tool";
  }

  private toToolCalls(calls: any[] | undefined): ToolCall[] {
    return (calls ?? []).map((call) => ({
      id: `${call.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: call.name,
      input: call.args ?? {},
    }));
  }

  private handleError(error: unknown): never {
    const message = error instanceof Error ? error.message : String(error);
    const statusMatch = message.match(
      /\b(400|401|403|404|408|429|500|502|503|504)\b/,
    );
    const status = statusMatch ? Number(statusMatch[1]) : undefined;

    if (status === 401 || status === 403) {
      throw new ProviderError(
        "Invalid Gemini API key or API access denied.",
        status,
        false,
      );
    }

    if (status === 429) {
      throw new ProviderError("Gemini rate limit exceeded.", 429, true);
    }

    if (status === 400) {
      throw new ProviderError(`Gemini request error: ${message}`, 400, false);
    }

    if (status && status >= 500) {
      throw new ProviderError(
        `Gemini API error (${status}): ${message}`,
        status,
        true,
      );
    }

    throw new ProviderError(
      `Gemini provider error: ${message}`,
      status,
      status === undefined || status === 408,
    );
  }

  async sendMessage(
    messages: Message[],
    systemPrompt?: string,
  ): Promise<ProviderResponse> {
    try {
      const model = this.client.getGenerativeModel({
        model: this.model,
        ...(systemPrompt ? { systemInstruction: systemPrompt } : {}),
        tools: TOOLS,
      });

      const lastMessage = messages[messages.length - 1];

      if (!lastMessage || lastMessage.role !== "user") {
        throw new ProviderError("Gemini expected a user message.", 400, false);
      }

      const history = this.buildHistory(messages.slice(0, -1));
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(lastMessage.content);
      const response = result.response;

      const toolCalls = this.toToolCalls(response.functionCalls());

      return {
        content: response.text(),
        ...(toolCalls.length ? { toolCall: toolCalls[0], toolCalls } : {}),
        inputTokens: response.usageMetadata?.promptTokenCount,
        outputTokens: response.usageMetadata?.candidatesTokenCount,
      };
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      this.handleError(error);
    }
  }

  async streamMessage(
    messages: Message[],
    onChunk: (chunk: string) => void,
    systemPrompt?: string,
  ): Promise<ProviderResponse> {
    try {
      const model = this.client.getGenerativeModel({
        model: this.model,
        ...(systemPrompt ? { systemInstruction: systemPrompt } : {}),
        tools: TOOLS,
      });

      const lastMessage = messages[messages.length - 1];

      if (!lastMessage || lastMessage.role !== "user") {
        throw new ProviderError("Gemini expected a user message.", 400, false);
      }

      const history = this.buildHistory(messages.slice(0, -1));
      const chat = model.startChat({ history });

      const result = await chat.sendMessageStream(lastMessage.content);

      let fullContent = "";
      let latestResponse: any;

      for await (const chunk of result.stream) {
        latestResponse = chunk;

        const text = chunk.text();

        if (text) {
          fullContent += text;
          onChunk(text);
        }
      }

      const response = await result.response;
      const toolCalls = this.toToolCalls(response.functionCalls());

      return {
        content: fullContent,
        ...(toolCalls.length ? { toolCall: toolCalls[0], toolCalls } : {}),
        inputTokens: response.usageMetadata?.promptTokenCount,
        outputTokens: response.usageMetadata?.candidatesTokenCount,
      };
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      this.handleError(error);
    }
  }
}
