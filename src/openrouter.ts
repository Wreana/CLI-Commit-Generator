export interface GenerateCommitMessageOptions {
  baseUrl: string;
  apiKey: string;
  model: string;
  prompt: string;
}

interface OpenRouterChatResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
}

export async function generateCommitMessage({
  baseUrl,
  apiKey,
  model,
  prompt,
}: GenerateCommitMessageOptions): Promise<string> {
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set.");
  }

  const response = await postChatCompletion(baseUrl, apiKey, model, prompt);

  if (!response.ok) {
    const detail = await readOpenRouterError(response);
    throw new Error(
      `OpenRouter API error (${response.status} ${response.statusText}): ${detail}`,
    );
  }

  const data = (await response.json()) as OpenRouterChatResponse;
  const content = data.choices?.[0]?.message?.content;
  const message = sanitizeCommitMessage(
    typeof content === "string"
      ? content
      : (content
          ?.filter(
            (part) => part.type === "text" && typeof part.text === "string",
          )
          .map((part) => part.text)
          .join(" ") ?? ""),
  );

  if (!message) {
    throw new Error("OpenRouter returned an empty commit message.");
  }

  return message;
}

async function postChatCompletion(
  baseUrl: string,
  apiKey: string,
  model: string,
  prompt: string,
): Promise<Response> {
  try {
    return await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        stream: false,
      }),
    });
  } catch (error) {
    throw new Error(
      `Could not connect to OpenRouter at ${baseUrl}: ${formatError(error)}`,
    );
  }
}

async function readOpenRouterError(response: Response): Promise<string> {
  const fallback = response.statusText || `HTTP ${response.status}`;

  try {
    const body = await response.text();
    if (!body.trim()) {
      return fallback;
    }

    try {
      const parsed = JSON.parse(body) as {
        error?: { message?: unknown } | unknown;
        message?: unknown;
      };

      if (
        parsed.error &&
        typeof parsed.error === "object" &&
        "message" in parsed.error &&
        typeof parsed.error.message === "string"
      ) {
        return parsed.error.message;
      }
      if (typeof parsed.error === "string") {
        return parsed.error;
      }
      if (typeof parsed.message === "string") {
        return parsed.message;
      }
    } catch {
      return body.trim();
    }

    return body.trim();
  } catch {
    return fallback;
  }
}

function sanitizeCommitMessage(value: string): string {
  return (
    value
      .trim()
      .replace(/^```(?:\w+)?/, "")
      .replace(/```$/, "")
      .trim()
      .replace(/^["'`]|["'`]$/g, "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean) ?? ""
  );
}

function formatError(error: unknown): string {
  if (!(error instanceof Error)) {
    return String(error);
  }

  const cause = "cause" in error ? error.cause : undefined;
  if (cause instanceof Error) {
    return `${error.message} (${cause.message})`;
  }

  return error.message;
}
