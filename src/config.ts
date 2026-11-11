import {
  chmodSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

export const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
export const DEFAULT_OPENROUTER_MODEL = "cohere/north-mini-code:free";

export interface CliConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export function readConfig(options: Partial<CliConfig>): CliConfig {
  const sharedEnv = readEnvFile(getSharedEnvPath());
  const projectEnv = readEnvFile(resolve(process.cwd(), ".env"));

  return {
    baseUrl: normalizeBaseUrl(
      options.baseUrl ??
        (process.env.OPENROUTER_BASE_URL ||
          sharedEnv.OPENROUTER_BASE_URL ||
          projectEnv.OPENROUTER_BASE_URL ||
          DEFAULT_OPENROUTER_BASE_URL),
    ),
    apiKey:
      options.apiKey ??
      (process.env.OPENROUTER_API_KEY ||
        sharedEnv.OPENROUTER_API_KEY ||
        projectEnv.OPENROUTER_API_KEY ||
        ""),
    model:
      options.model ??
      (process.env.CGM_OPENROUTER_MODEL ||
        sharedEnv.CGM_OPENROUTER_MODEL ||
        projectEnv.CGM_OPENROUTER_MODEL ||
        DEFAULT_OPENROUTER_MODEL),
  };
}

export function saveApiKey(apiKey: string): string {
  const value = apiKey.trim();
  if (!value) {
    throw new Error("The API key cannot be empty.");
  }

  const envPath = getSharedEnvPath();
  mkdirSync(resolve(envPath, ".."), { recursive: true, mode: 0o700 });
  let contents = "";

  try {
    contents = readFileSync(envPath, "utf8");
  } catch (error) {
    if (!isMissingFileError(error)) {
      throw error;
    }
  }

  const keyLine = `OPENROUTER_API_KEY=${value}`;
  const keyPattern = /^\s*OPENROUTER_API_KEY\s*=.*$/m;

  if (keyPattern.test(contents)) {
    contents = contents.replace(keyPattern, keyLine);
  } else {
    contents = `${contents.replace(/\s*$/, "")}${contents.trim() ? "\n" : ""}${keyLine}\n`;
  }

  writeFileSync(envPath, contents, { encoding: "utf8", mode: 0o600 });
  chmodSync(envPath, 0o600);
  return envPath;
}

function getSharedEnvPath(): string {
  const configHome = process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
  return join(configHome, "commit-generator", ".env");
}

function readEnvFile(envPath: string): Record<string, string> {
  try {
    const contents = readFileSync(envPath, "utf8");
    const env: Record<string, string> = {};

    for (const line of contents.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match) {
        continue;
      }

      env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
    }

    return env;
  } catch (error) {
    if (isMissingFileError(error)) {
      return {};
    }
    throw error;
  }
}

function isMissingFileError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    error.code === "ENOENT"
  );
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}
