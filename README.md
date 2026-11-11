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

Environment variables:

```sh
OPENROUTER_API_KEY=your-key cgm
CGM_OPENROUTER_MODEL=cohere/north-mini-code:free cgm
CGM_MAX_DIFF_BYTES=200000 cgm
```

You can save or replace the shared API key with:

```sh
cgm set api "your-key"
```

This writes `OPENROUTER_API_KEY` to `~/.config/commit-generator/.env`, so it works from any project. The file is created with user only permissions.

Default model: `cohere/north-mini-code:free`.
Default detailed diff limit: `120000` bytes. Generated lockfile diffs are summarized instead of sent in full.

## Development

```sh
OPENROUTER_API_KEY=your-key npm run dev -- --print
npm run lint
npm run build
npm run check
```

## OpenRouter

Set your API key before running the CLI:

```sh
export OPENROUTER_API_KEY=your-key
cgm
```

OpenRouter model names use the `author/model` format. You can override the
default with `--model` or `CGM_OPENROUTER_MODEL`.
