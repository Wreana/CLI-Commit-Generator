import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { OPENROUTER_API_KEY } from "./local-config.js";

export const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
export const DEFAULT_OPENROUTER_MODEL = "cohere/north-mini-code:free";

export interface CliConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export function readConfig(): CliConfig {
  return {
    baseUrl: normalizeBaseUrl(DEFAULT_OPENROUTER_BASE_URL),
    apiKey: OPENROUTER_API_KEY,
    model: DEFAULT_OPENROUTER_MODEL,
  };
}

export function saveApiKey(apiKey: string): void {
  const value = apiKey.trim();
  if (!value) {
    throw new Error("The API key cannot be empty.");
  }

  const configPath = getLocalConfigPath();
  const contents = readFileSync(configPath, "utf8");
  const keyPattern = /export const OPENROUTER_API_KEY = "(?:[^"\\]|\\.)*";/;
  const updatedContents = contents.replace(
    keyPattern,
    `export const OPENROUTER_API_KEY = ${JSON.stringify(value)};`,
  );

  if (updatedContents === contents) {
    throw new Error(`Could not find OPENROUTER_API_KEY in ${configPath}.`);
  }

  writeFileSync(configPath, updatedContents, "utf8");
  refreshInstallation();
}

function getLocalConfigPath(): string {
  return resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../src/local-config.ts",
  );
}

function refreshInstallation(): void {
  const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

  console.log("Running npm run check...");
  execFileSync("npm", ["run", "check"], {
    cwd: packageRoot,
    stdio: "inherit",
  });

  console.log("Installing the updated CLI globally...");
  execFileSync("npm", ["install", "-g", "."], {
    cwd: packageRoot,
    stdio: "inherit",
  });
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}
