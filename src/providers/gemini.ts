
import {
  GoogleGenerativeAI,
  SchemaType,
  type Tool,
} from "@google/generative-ai";

import type {
  BaseProvider,
  Message,
  ProviderResponse,
  ToolCall,
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
              description: "The terminal command to run",
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
    ],
  },
];

export class GeminiProvider implements BaseProvider {
  name = "gemini";
  private client: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = "gemini-3.6-flash";
  }

  private buildHistory(messages: Message[]) {
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
        if (message.toolCall) {
          history.push({
            role: "model",
            parts: [
              {
                functionCall: {
                  name: message.toolCall.name,
                  args: message.toolCall.input,
                },
              },
            ],
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
        history.push({
          role: "user",
          parts: [
            {
              text: `Tool result:\n${message.content}`,
            },
          ],
        });
      }
    }

    return history;
  }

  async sendMessage(
    messages: Message[],
    systemPrompt?: string,
  ): Promise<ProviderResponse> {
    const geminiModel = this.client.getGenerativeModel({
      model: this.model,
      systemInstruction: systemPrompt,
      tools: TOOLS,
    });

    const lastMessage = messages[messages.length - 1];
    const history = this.buildHistory(messages.slice(0, -1));

    const chat = geminiModel.startChat({
      history,
    });

    const result = await chat.sendMessage(lastMessage.content);

    const functionCalls = result.response.functionCalls();

    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];

      const toolCall: ToolCall = {
        id: `${call.name}-${Date.now()}`,
        name: call.name,
        input: call.args as Record<string, string>,
      };

      return {
        content: "",
        toolCall,
      };
    }

    return {
      content: result.response.text(),
    };
  }

  async streamMessage(
    messages: Message[],
    onChunk: (chunk: string) => void,
    systemPrompt?: string,
  ): Promise<ProviderResponse> {
    const geminiModel = this.client.getGenerativeModel({
      model: this.model,
      systemInstruction: systemPrompt,
      tools: TOOLS,
    });

    const lastMessage = messages[messages.length - 1];
    const history = this.buildHistory(messages.slice(0, -1));

    const MAX_RETRIES = 5;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const chat = geminiModel.startChat({
          history,
        });

        const result = await chat.sendMessageStream(lastMessage.content);

        let fullContent = "";
        let toolCall: ToolCall | undefined;

        for await (const chunk of result.stream) {
          const functionCalls = chunk.functionCalls();

          if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];

            toolCall = {
              id: `${call.name}-${Date.now()}`,
              name: call.name,
              input: call.args as Record<string, string>,
            };

            continue;
          }

          const text = chunk.text();

          if (text) {
            fullContent += text;
          }
        }

        if (fullContent) {
          onChunk(fullContent);
        }

        return {
          content: fullContent,
          toolCall,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        const isRetryable =
          errorMessage.includes("503") ||
          errorMessage.includes("429") ||
          errorMessage.includes("Service Unavailable") ||
          errorMessage.includes("high demand");

        if (!isRetryable || attempt === MAX_RETRIES) {
          throw new Error(
            "Too many broke people using your AI. This fault is not from our side — blame your AI, not us.",
          );
        }

        const delay = 2000 * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw new Error(
      "Too many broke people using your AI. This fault is not from our side — blame your AI, not us.",
    );
  }
}
 
