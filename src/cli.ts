#!/usr/bin/env node
import { createInterface } from "node:readline/promises";
import { Command } from "commander";
import inquirer from "inquirer";
import { readConfig, saveApiKey } from "./config.js";
import { commit, getStagedChanges } from "./git.js";
import { generateCommitMessage } from "./openrouter.js";
import { buildCommitPrompt } from "./prompt.js";

const DEFAULT_MAX_DIFF_BYTES = 120_000;

interface CliOptions {
  baseUrl?: string;
  model?: string;
  yes?: boolean;
  print?: boolean;
}

const program = new Command()
  .name("cgm")
  .description(
    "Generate a Conventional Commit message from staged Git changes.",
  )
  .option("-m, --model <name>", "OpenRouter model name")
  .option("--base-url <url>", "OpenRouter API base URL")
  .option("-y, --yes", "commit with the generated message without prompting")
  .option("--print", "print the generated message without committing")
  .showHelpAfterError()
  .action(() => undefined);

let commandHandled = false;

program
  .command("set")
  .description("Save CLI settings")
  .command("api <apiKey>")
  .description("Save or replace the shared OpenRouter API key")
  .action((apiKey: string) => {
    saveApiKey(apiKey);
    commandHandled = true;
    console.log("OpenRouter API key updated and CLI reinstalled globally.");
  });

try {
  await program.parseAsync();
  if (!commandHandled) {
    await run(program.opts<CliOptions>());
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exitCode = 1;
}

async function run(options: CliOptions): Promise<void> {
  const changes = await getStagedChanges();
  if (!changes.summary.trim()) {
    console.log("No staged changes found.");
    return;
  }

  const config = readConfig();
  console.log(`Generating commit message with ${config.model}...`);

  const suggestion = await generateCommitMessage({
    baseUrl: config.baseUrl,
    apiKey: config.apiKey,
    model: config.model,
    prompt: buildCommitPrompt(changes.summary, truncateDiff(changes.diff)),
  });

  if (options.print) {
    console.log(suggestion);
    return;
  }

  const message = options.yes ? suggestion : await confirmMessage(suggestion);
  if (!message) {
    console.log("Commit cancelled.");
    return;
  }

  await commit(message);
  console.log(`Commit created: ${message}`);
}

function truncateDiff(diff: string): string {
  const maxBytes = Number(
    process.env.CGM_MAX_DIFF_BYTES ?? DEFAULT_MAX_DIFF_BYTES,
  );
  const limit =
    Number.isFinite(maxBytes) && maxBytes > 0
      ? maxBytes
      : DEFAULT_MAX_DIFF_BYTES;
  const bytes = Buffer.byteLength(diff);

  if (bytes <= limit) {
    return diff;
  }

  return `${diff.slice(0, limit)}

[Diff truncated from ${bytes} bytes to ${limit} bytes. Increase CGM_MAX_DIFF_BYTES to send more context.]`;
}

async function confirmMessage(suggestion: string): Promise<string | undefined> {
  console.log(`\nSuggested commit:\n${suggestion}\n`);

  const { action } = await inquirer.prompt<{ action: string }>([
    {
      type: "list",
      name: "action",
      message: "Use this commit message?",
      choices: ["Commit", "Edit", "Cancel"],
    },
  ]);

  if (action === "Cancel") {
    return undefined;
  }

  if (action === "Edit") {
    return editCommitMessage(suggestion);
  }

  return suggestion;
}

interface CommitParts {
  type: string;
  scope: string;
  summary: string;
}

async function editCommitMessage(suggestion: string): Promise<string> {
  const parts = parseCommitMessage(suggestion);

  const type = await promptRequiredEditableLine("Type", parts.type);
  const scope = await promptEditableLine("Scope", parts.scope);
  const summary = await promptRequiredEditableLine("Summary", parts.summary);

  return formatCommitMessage({ type, scope, summary });
}

function parseCommitMessage(message: string): CommitParts {
  const match = message.trim().match(/^(\w+)(?:\(([^)]+)\))?:\s*(.+)$/);

  if (!match) {
    return {
      type: "chore",
      scope: "",
      summary: message.trim(),
    };
  }

  return {
    type: match[1],
    scope: match[2] ?? "",
    summary: match[3],
  };
}

function formatCommitMessage({ type, scope, summary }: CommitParts): string {
  if (scope) {
    return `${type}(${scope}): ${summary}`;
  }

  return `${type}: ${summary}`;
}

async function promptRequiredEditableLine(
  label: string,
  defaultValue: string,
): Promise<string> {
  while (true) {
    const answer = await promptEditableLine(label, defaultValue);

    if (answer) {
      return answer;
    }

    console.log(`${label} is required.`);
  }
}

async function promptEditableLine(
  label: string,
  defaultValue: string,
): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const answerPromise = rl.question(`${label}: `);
    rl.write(defaultValue);
    return (await answerPromise).trim();
  } finally {
    rl.close();
  }
}
