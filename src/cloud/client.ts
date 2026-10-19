
import { config } from "../config/user-config.js";
import { getCloudApiUrl } from "../commands/cloud-auth.js";
import type { ToolCall } from "../providers/base.js";

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
    return getCloudApiUrl();
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
      throw new Error(
        "Not logged in to ANAS Cloud. Run: anas login",
      );
    }

    let response: Response;

    try {
      response = await fetch(`${this.apiUrl}${path}`, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
          ...(options.body
            ? { "Content-Type": "application/json" }
            : {}),
        },
      });
    } catch {
      throw new Error(
        `Cannot connect to ANAS Cloud at ${this.apiUrl}. ` +
          "Check the website server and network.",
      );
    }

    if (response.status === 401) {
      config.delete("cloudToken");
      config.delete("cloudEmail");

      throw new Error(
        "Your ANAS Cloud login expired. Run: anas login",
      );
    }

    const result = (await response
      .json()
      .catch(() => null)) as (T & { error?: string }) | null;

    if (!response.ok) {
      throw new Error(
        result?.error ??
          `ANAS Cloud request failed (${response.status})`,
      );
    }

    if (result === null) {
      throw new Error(
        "ANAS Cloud returned an invalid or empty JSON response.",
      );
    }

    return result;
  }

  async listSessions(): Promise<CloudSession[]> {
    const result = await this.request<{
      sessions: CloudSession[];
    }>("/api/cloud/sessions");

    return result.sessions;
  }

  async saveSession(input: {
    localSessionId: string;
    title?: string;
    workingDirectory?: string | null;
  }): Promise<CloudSession> {
    const result = await this.request<{
      session: CloudSession;
    }>("/api/cloud/sessions", {
      method: "POST",
      body: JSON.stringify(input),
    });

    return result.session;
  }

  async listMessages(
    localSessionId: string,
  ): Promise<CloudMessage[]> {
    const result = await this.request<{
      messages: CloudMessage[];
    }>(
      `/api/cloud/sessions/${encodeURIComponent(
        localSessionId,
      )}/messages`,
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
    const result = await this.request<{
      message: CloudMessage;
    }>(
      `/api/cloud/sessions/${encodeURIComponent(
        localSessionId,
      )}/messages`,
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );

    return result.message;
  }

  async listMemories(): Promise<CloudMemory[]> {
    const result = await this.request<{
      memories: CloudMemory[];
    }>("/api/cloud/memory");

    return result.memories;
  }

  async saveMemory(
    key: string,
    content: string,
  ): Promise<CloudMemory> {
    const result = await this.request<{
      memory: CloudMemory;
    }>("/api/cloud/memory", {
      method: "PUT",
      body: JSON.stringify({ key, content }),
    });

    return result.memory;
  }

  async deleteMemory(key: string): Promise<void> {
    await this.request<{ success: boolean }>(
      `/api/cloud/memory?key=${encodeURIComponent(key)}`,
      {
        method: "DELETE",
      },
    );
  }

  // Check whether the logged-in user has a saved provider API key.
  // The actual API key is never returned.
  async hasProviderKey(provider: string): Promise<boolean> {
    const result = await this.request<{
      provider: string;
      exists: boolean;
    }>(
      `/api/cli/provider-keys?provider=${encodeURIComponent(provider)}`,
    );

    return result.exists;
  }

  // Encrypt and save a provider API key through the ANAS backend.
  // Encryption happens on the server, not inside the CLI.
  async saveProviderKey(
    provider: string,
    apiKey: string,
  ): Promise<void> {
    await this.request<{ success: boolean }>(
      "/api/cli/provider-keys",
      {
        method: "PUT",
        body: JSON.stringify({
          provider,
          apiKey,
        }),
      },
    );
  }

  // Delete a saved provider API key for the logged-in user.
  async deleteProviderKey(provider: string): Promise<void> {
    await this.request<{ success: boolean }>(
      `/api/cli/provider-keys?provider=${encodeURIComponent(provider)}`,
      {
        method: "DELETE",
      },
    );
  }
}

export const cloudClient = new CloudClient();
