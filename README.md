# Copilot SDK Test: AI-Assisted Registration Form

A demonstration project showcasing how the GitHub Copilot SDK can enhance web forms with natural language assistance while maintaining strict guardrails.

## Overview

This project implements a registration form where users can either fill fields manually or use an AI agent to auto-populate fields from natural language descriptions.

**Key Principle**: The AI is constrained strictly to form completion—it's not a general chatbot.

## Tech Stack

- **Backend**: Fastify (Node.js with ES modules)
- **Frontend**: HTML, HTMX for seamless interactions, EJS templates
- **AI**: GitHub Copilot SDK (Agent-based)

## How It Works

1. User describes themselves in natural language (e.g., "I'm a biomedical researcher from Bandung working at a private hospital")
2. AI agent interprets the description and maps it to form fields
3. Form fields are auto-populated with suggestions
4. User reviews, edits, and submits

## Guardrails

- **Strict schema**: AI can only output predefined form fields
- **No auto-submit**: User always has final control
- **Narrow system prompt**: AI refuses requests outside form assistance
- **Null for unknowns**: AI returns `null` instead of guessing

## Architecture

```
HTML Form → HTMX POST → Fastify Route → Copilot Agent → JSON Response → Updated Fields
```

The agent operates with a strict JSON schema defining allowed fields (name, email, country, institution, role, etc.) and returns only structured data—no free text explanations.

## Security

- Rate-limited AI endpoint
- No AI output accepted without user confirmation
- Visual indicators for AI-suggested values
- Validation against strict schema

## Getting Started

```bash
# Install dependencies
npm install

# Start the server
npm start
```

See [docs/plan.md](docs/plan.md) for detailed architecture and design decisions.

## Log

### 28-01-2026

AI-Assisted Registration Form using GitHub Copilot SDK

✅ **Phase 1** - Foundation
- Fastify server with EJS templates
- Traditional form with conditional dropdowns
- Agentic form UI with two-column layout
- Custom CSS with gradient, frosted glass effects

✅ **Phase 2** - Copilot SDK Integration
- `/ai/hello` - Simple test endpoint
- `/ai/stream` - SSE streaming responses
- `/ai/assist` - Form-filling agent with:
  - Strict JSON-only system prompt
  - Field validation against schema
  - SSE streaming for real-time feedback

✅ **Guardrails**
- AI constrained to form-filling only
- Server-side validation of AI output
- User reviews before submission
- `null` for unknown values (no guessing)

✅ **Frontend**
- Alpine.js for reactive state
- Streaming chat UI with markdown rendering
- Auto-populated form fields with "AI" badges

The project demonstrates how to embed Copilot's agentic capabilities into a web app while keeping tight control over what the AI can do. 🎉