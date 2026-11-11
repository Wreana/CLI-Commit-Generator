# Commit Generator

CLI for generating Conventional Commit messages from staged Git changes with OpenRouter.

## Requirements

- Node.js 20 or newer (tested on 20, 22, 24 and 26)
- Git
- An OpenRouter API key

## Install

```sh
npm install
npm run build
npm install -g .
```

## Usage

Stage your changes, then run:

```sh
cgm
```

The CLI reads `git diff --staged`, asks OpenRouter for one Conventional Commit message, then lets you commit, edit the message, or cancel.

Useful options:

```sh
cgm --model openai/gpt-oss-20b
cgm --base-url https://openrouter.ai/api/v1
cgm --print
cgm --yes
```

Environment variables for optional settings:

```sh
CGM_OPENROUTER_MODEL=cohere/north-mini-code:free cgm
CGM_MAX_DIFF_BYTES=200000 cgm
```

You can save or replace the shared API key with:

```sh
cgm set api "your-key"
```

This updates the hardcoded `OPENROUTER_API_KEY` value in the ignored
`src/local-config.ts`, runs
`npm run check`, and reinstalls the updated CLI globally.

Default model: `cohere/north-mini-code:free`.
Default detailed diff limit: `120000` bytes. Generated lockfile diffs are summarized instead of sent in full.

## API key setup

This CLI uses [OpenRouter](https://openrouter.ai/) by default. Create an
OpenRouter API key, not an OpenAI Platform key, unless you are also changing
the CLI base URL and configuration yourself.

### 1. Create an OpenRouter key

1. Sign in to [OpenRouter](https://openrouter.ai/).
2. Open your account menu and choose **Keys** (or open the API keys page from
   the dashboard).
3. Select **Create key**.
4. Enter a descriptive value in **Name**, such as `commit-generator`.
5. Choose an **Expiration**. A short expiration is recommended for temporary
   or shared environments. Choose **No expiration** only when you understand
   the security risk.
6. Set a **Credit limit**. You can choose **Custom amount** and enter a small
   limit, such as `1`, to prevent unexpected spending. Requests are rejected
   after the limit is reached until you increase it.
7. Select **Create**.

The key is shown in a confirmation dialog only after it is created. Copy it
immediately and save it in a password manager or another secure location. The
full key cannot be displayed again later. If you lose it, revoke it and create
a new key.

### 2. Save the key for this CLI

The recommended method is the built in configuration command:

```sh
cgm set api "sk-or-v1-your-key"
```

This updates the hardcoded `OPENROUTER_API_KEY` value in the ignored
`src/local-config.ts`, then runs the checks and reinstalls the global package
automatically. Keep the local file private and revoke the key if it is exposed.

### 3. Verify the setup

Stage at least one change and run:

```sh
git add README.md
cgm --print
```

The command should print one Conventional Commit message generated from the
staged diff. If it reports that the API key is missing, run `cgm set api
"sk-or-v1-your-key"` again and allow the check and global reinstall to finish.

### OpenAI Platform keys
s
An OpenAI Platform key usually starts with `sk-`, while an OpenRouter key
usually starts with `sk-or-v1-`. This project defaults to OpenRouter and sends
requests to `https://openrouter.ai/api/v1`, so an OpenAI Platform key will not
work with the default configuration. Use an OpenRouter key for the setup above.

## Development

```sh
npm run dev -- --print
npm run lint
npm run build
npm run check
```

## OpenRouter

Set your API key before running the CLI:

```sh
cgm set api "sk-or-v1-your-key"
cgm
```

OpenRouter model names use the `author/model` format. You can override the
default with `--model` or `CGM_OPENROUTER_MODEL`.
