export const DEFAULT_OLLAMA_HOST = "http://127.0.0.1:11434";
export const DEFAULT_OLLAMA_MODEL = "gpt-oss:120b-cloud";
// export const DEFAULT_OLLAMA_MODEL = "qwen3-coder:480b-cloud";

export interface CliConfig {
  host: string;
  model: string;
}

export function readConfig(options: Partial<CliConfig>): CliConfig {
  return {
    host: normalizeHost(options.host ?? process.env.OLLAMA_HOST ?? DEFAULT_OLLAMA_HOST),
    model: options.model ?? process.env.CGM_OLLAMA_MODEL ?? DEFAULT_OLLAMA_MODEL,
  };
}

function normalizeHost(host: string): string {
  return host.replace(/\/+$/, "");
}
