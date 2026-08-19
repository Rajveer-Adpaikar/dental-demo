# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Dental clinic **demo website** project. Currently just an empty shell — no code exists yet. Work happens here only when the user asks to build or modify the demo site.

## Starting a session here

- This repo is **not a git repository**.
- Framework/agent instructions for the WAT architecture live in `C:\Users\thera\OneDrive\Desktop\CLAUDE.md` (parent directory) and are loaded automatically — read them there, don't duplicate them here.
- Files are served from OneDrive; paths contain spaces (`Demo Website`) — quote paths in shell commands.

## When code exists

- It's a static demo site (HTML/CSS/JS expected). No build step, no package manager, no tests unless one is added.
- Run it by opening the HTML file in a browser or serving the folder, e.g. `python -m http.server`.
- Check whether the user wants the thing built at all before scaffolding pages or structure — this is a demo, keep it minimal until asked for more.

## Conventions

- User communicates via Telegram MCP channel when remote: react 👀 first, do the work, always reply via `mcp__plugin_telegram_telegram__reply`.
- For local (terminal) sessions: work in the transcript normally.