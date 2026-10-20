
import type {
  BaseProvider,
  Message,
  ProviderResponse,
  ToolCall,
} from "./base.js";
import { ProviderError } from "./base.js";
import { config } from "../config/user-config.js";

const TOOLS = [
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Read the contents of a file in the workspace.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string" },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "write_file",
      description: "Create or overwrite a file in the workspace.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string" },
          content: { type: "string" },
        },
        required: ["path", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "edit_file",
      description: "Replace exact text in an existing file.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string" },
          old_string: { type: "string" },
          new_string: { type: "string" },
        },
        required: ["path", "old_string", "new_string"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "bash",
      description: "Execute a Windows CMD command in the workspace.",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string" },
        },
        required: ["command"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "glob",
      description: "Find files matching a glob pattern.",
      parameters: {
        type: "object",
        properties: {
          pattern: { type: "string" },
        },
        required: ["pattern"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_dir",
      description: "List files and directories in the workspace.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string" },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_code",
      description: "Search for text in workspace files.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "git",
      description: "Inspect Git status, diff, or log.",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string" },
        },
        required: ["command"],
      },
    },
  },
];

function toApiMessages(messages: Message[], systemPrompt?: string) {
  const result: Record<string, unknown>[] = [];

  if (systemPrompt) {
    result.push({
      role: "system",
      content: systemPrompt,
    });
  }

  for (const message of messages) {
    if (message.role === "tool") {
      result.push({
        role: "tool",
        tool_call_id: message.toolCallId,
        content: message.content,
      });
      continue;
    }

    if (message.role === "assistant") {
      const calls = message.toolCalls ??
        (message.toolCall ? [message.toolCall] : []);

      result.push({
        role: "assistant",
        content: message.content,
        ...(calls.length
          ? {
              tool_calls: calls.map((call) => ({
                id: call.id,
                type: "function",
                function: {
                  name: call.name,
                  arguments: JSON.stringify(call.input),
                },
              })),
            }
          : {}),
      });
      continue;
    }

    result.push({
      role: "user",
      content: message.content,
    });
  }

  return result;
}

function parseToolCalls(value: unknown): ToolCall[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (call): call is ToolCall =>
      typeof call === "object" &&
      call !== null &&
      typeof call.name === "string" &&
      typeof call.input === "object" &&
      call.input !== null &&
      !Array.isArray(call.input),
  );
}

export class CloudOpenAIProvider implements BaseProvider {
  readonly name: string;

  constructor(
    private readonly cloudProvider:
      | "openai"
      | "gemini"
      | "openrouter"
      | "groq" = "openai",
    private readonly useOwnKey = false,
  ) {
    this.name = cloudProvider;
  }

  private get apiUrl(): string {
    return (
      process.env.ANAS_CLOUD_API_URL ??
      "https://anas-cli.vercel.app"
    ).replace(/\/$/, "");
  }

  private get token(): string {
    const token = config.get("cloudToken");

    if (!token) {
      throw new ProviderError(
        "ANAS Cloud login required. Run anas-cli wakeup.",
        401,
      );
    }

    return token;
  }

  private async request(
    messages: Message[],
    systemPrompt: string | undefined,
    stream: boolean,
  ): Promise<Response> {
    const response = await fetch(
      `${this.apiUrl}/api/cli/provider-chat`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
                   provider: this.cloudProvider,
          useOwnKey: this.useOwnKey,
          messages: toApiMessages(messages, systemPrompt),
          tools: TOOLS,
          stream,
        }),
      },
    );

    if (!response.ok) {
      let message = `Cloud request failed (${response.status})`;

      try {
        const body = (await response.json()) as {
          error?: string;
        };
        message = body.error ?? message;
      } catch {
        // Keep the HTTP error message.
      }

      throw new ProviderError(
        message,
        response.status,
        response.status === 429 ||
          response.status >= 500,
      );
    }

    return response;
  }

  async sendMessage(
    messages: Message[],
    systemPrompt?: string,
  ): Promise<ProviderResponse> {
    const response = await this.request(
      messages,
      systemPrompt,
      false,
    );

    const body = (await response.json()) as {
      content?: string;
      toolCalls?: ToolCall[];
      inputTokens?: number;
      outputTokens?: number;
    };

    const toolCalls = parseToolCalls(body.toolCalls);

    return {
      content: body.content ?? "",
      toolCalls,
      toolCall: toolCalls[0],
      inputTokens: body.inputTokens,
      outputTokens: body.outputTokens,
    };
  }

  async streamMessage(
    messages: Message[],
    onChunk: (chunk: string) => void,
    systemPrompt?: string,
  ): Promise<ProviderResponse> {
    const response = await this.request(
      messages,
      systemPrompt,
      true,
    );

    if (!response.body) {
      throw new ProviderError(
        "Cloud response stream is empty.",
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = "";
    let content = "";
    let toolCalls: ToolCall[] = [];
    let inputTokens = 0;
    let outputTokens = 0;
    let completed = false;

    const handleEvent = (block: string) => {
      let event = "";
      let data = "";

      for (const line of block.split("\n")) {
        if (line.startsWith("event:")) {
          event = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          data += line.slice(5).trimStart();
        }
      }

      if (!data) return;

      const payload = JSON.parse(data) as Record<string, unknown>;

      if (event === "text") {
        const chunk = String(payload.content ?? "");
        content += chunk;
        onChunk(chunk);
      } else if (event === "tool_calls") {
        toolCalls = parseToolCalls(payload.toolCalls);
      } else if (event === "usage") {
        inputTokens = Number(payload.inputTokens ?? 0);
        outputTokens = Number(payload.outputTokens ?? 0);
      } else if (event === "error") {
        throw new ProviderError(
          String(payload.error ?? "Cloud streaming failed"),
        );
      } else if (event === "done") {
        completed = true;
      }
    };

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        buffer = buffer.replace(/\r\n/g, "\n");

        let boundary: number;

        while ((boundary = buffer.indexOf("\n\n")) !== -1) {
          const block = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);

          handleEvent(block);
        }
      }

      buffer += decoder.decode();

      if (buffer.trim()) {
        handleEvent(buffer);
      }

      if (!completed) {
        throw new ProviderError(
          "Cloud stream ended before completion.",
        );
      }
    } finally {
      reader.releaseLock();
    }

    return {
      content,
      toolCalls,
      toolCall: toolCalls[0],
      inputTokens,
      outputTokens,
    };
  }
}
