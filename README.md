# Commit Generator

CLI for generating Conventional Commit messages from staged Git changes with Ollama.

## Requirements

- Node.js 20 or newer (tested on 20, 22, 24 and 26)
- Git
- Ollama running at `http://127.0.0.1:11434`

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

The CLI reads `git diff --staged`, asks Ollama for one Conventional Commit message, then lets you commit, edit the message, or cancel.

Useful options:

```sh
cgm --model deepseek-r1:8b
cgm --host http://127.0.0.1:11434
cgm --print
cgm --yes
```

Environment variables:

```sh
CGM_OLLAMA_MODEL=deepseek-r1:8b cgm
OLLAMA_HOST=http://127.0.0.1:11434 cgm
CGM_MAX_DIFF_BYTES=200000 cgm
```

Default model: `qwen3-coder:480b-cloud`.
Default detailed diff limit: `120000` bytes. Generated lockfile diffs are summarized instead of sent in full.

## Development

```sh
npm run dev -- --print
npm run lint
npm run build
npm run check
```

## Ollama

Start Ollama before running the CLI:

```sh
ollama serve
```

Pull or run the model you want to use:

```sh
ollama run qwen3-coder:480b-cloud
```
