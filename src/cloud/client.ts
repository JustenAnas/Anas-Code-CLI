import { config } from "../config/user-config.js";
import type { ToolCall } from "../providers/base.js";

const DEFAULT_API_URL = "http://localhost:3000";

export type CloudSession = {
  id: string;
  localSessionId: string;
  title: string;
  workingDirectory: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CloudMessage = {
  localMessageId: string;
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;
  toolCall?: ToolCall;
  toolCalls?: ToolCall[];
  createdAt: string;
};

export type CloudMemory = {
  key: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export class CloudClient {
  private get token(): string | undefined {
    return config.get("cloudToken");
  }

  private get apiUrl(): string {
    return (
      process.env.ANAS_CLOUD_URL || DEFAULT_API_URL
    ).replace(/\/+$/, "");
  }

  get isLoggedIn(): boolean {
    return Boolean(this.token);
  }

  async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = this.token;

    if (!token) {
      throw new Error("Not logged in to ANAS Cloud. Run: anas-cli login");
    }

    let response: Response;

    try {
      response = await fetch(`${this.apiUrl}${path}`, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
          ...(options.body ? { "Content-Type": "application/json" } : {}),
        },
      });
    } catch {
      throw new Error(
        "Cannot connect to ANAS Cloud. Check the website server and network.",
      );
    }

    if (response.status === 401) {
      config.delete("cloudToken");
      config.delete("cloudEmail");
      throw new Error("Your ANAS Cloud login expired. Run: anas-cli login");
    }

    const result = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    if (!response.ok) {
      throw new Error(
        result?.error ?? `ANAS Cloud request failed (${response.status})`,
      );
    }

    return result as T;
  }

  async listSessions(): Promise<CloudSession[]> {
    const result = await this.request<{ sessions: CloudSession[] }>(
      "/api/cloud/sessions",
    );

    return result.sessions;
  }

  async saveSession(input: {
    localSessionId: string;
    title?: string;
    workingDirectory?: string | null;
  }): Promise<CloudSession> {
    const result = await this.request<{ session: CloudSession }>(
      "/api/cloud/sessions",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );

    return result.session;
  }

  async listMessages(localSessionId: string): Promise<CloudMessage[]> {
    const result = await this.request<{ messages: CloudMessage[] }>(
      `/api/cloud/sessions/${encodeURIComponent(localSessionId)}/messages`,
    );

    return result.messages;
  }

  async saveMessage(
    localSessionId: string,
    input: {
      localMessageId: string;
      role: CloudMessage["role"];
      content: string;
      toolCallId?: string;
      toolCall?: ToolCall;
      toolCalls?: ToolCall[];
    },
  ): Promise<CloudMessage> {
    const result = await this.request<{ message: CloudMessage }>(
      `/api/cloud/sessions/${encodeURIComponent(localSessionId)}/messages`,
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );

    return result.message;
  }

  async listMemories(): Promise<CloudMemory[]> {
    const result = await this.request<{ memories: CloudMemory[] }>(
      "/api/cloud/memory",
    );

    return result.memories;
  }

  async saveMemory(key: string, content: string): Promise<CloudMemory> {
    const result = await this.request<{ memory: CloudMemory }>(
      "/api/cloud/memory",
      {
        method: "PUT",
        body: JSON.stringify({ key, content }),
      },
    );

    return result.memory;
  }

  async deleteMemory(key: string): Promise<void> {
    await this.request<{ success: boolean }>(
      `/api/cloud/memory?key=${encodeURIComponent(key)}`,
      { method: "DELETE" },
    );
  }
}

export const cloudClient = new CloudClient();

