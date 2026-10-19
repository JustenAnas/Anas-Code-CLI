
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

const REQUEST_TIMEOUT_MS = 30_000;

export class CloudRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly retryAfter?: string,
  ) {
    super(message);
    this.name = "CloudRequestError";
  }
}

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

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    const onAbort = () => controller.abort();

    if (options.signal?.aborted) {
      controller.abort();
    } else {
      options.signal?.addEventListener("abort", onAbort, {
        once: true,
      });
    }

    try {
      let response: Response;

      try {
        response = await fetch(`${this.apiUrl}${path}`, {
          ...options,
          signal: controller.signal,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${token}`,
            ...(options.body
              ? { "Content-Type": "application/json" }
              : {}),
          },
        });
      } catch (error) {
        if (controller.signal.aborted) {
          if (options.signal?.aborted) {
            throw new Error(
              "ANAS Cloud request was cancelled.",
            );
          }

          throw new Error(
            "ANAS Cloud request timed out after 30 seconds.",
          );
        }

        throw new Error(
          `Cannot connect to ANAS Cloud at ${this.apiUrl}. ` +
            "Check the website server and network.",
          { cause: error },
        );
      }

      if (response.status === 401) {
        config.delete("cloudToken");
        config.delete("cloudEmail");

        throw new CloudRequestError(
          "Your ANAS Cloud login expired. Run: anas login",
          401,
        );
      }

      let result: (T & { error?: string }) | null;

      try {
        result = (await response.json()) as T & {
          error?: string;
        };
      } catch {
        result = null;
      }

      if (!response.ok) {
        const retryAfter =
          response.headers.get("Retry-After") ?? undefined;

        const message =
          result?.error ??
          `ANAS Cloud request failed (${response.status})`;

        throw new CloudRequestError(
          response.status === 429 && retryAfter
            ? `${message}. Retry after ${retryAfter} seconds.`
            : message,
          response.status,
          retryAfter,
        );
      }

      if (result === null) {
        throw new Error(
          "ANAS Cloud returned an invalid or empty JSON response.",
        );
      }

      return result;
    } finally {
      clearTimeout(timeout);

      options.signal?.removeEventListener(
        "abort",
        onAbort,
      );
    }
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

  async hasProviderKey(provider: string): Promise<boolean> {
    const result = await this.request<{
      provider: string;
      exists: boolean;
    }>(
      `/api/cli/provider-keys?provider=${encodeURIComponent(provider)}`,
    );

    return result.exists;
  }

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
