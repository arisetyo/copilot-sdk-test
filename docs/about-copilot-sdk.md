# Build an agent into any app with the GitHub Copilot SDK

> Now in technical preview, the GitHub Copilot SDK can plan, invoke tools, edit files, and run commands as a programmable layer you can use in any application.

Mario Rodriguez · @mariorod
_January 22, 2026 | Updated January 23, 2026_

Building agentic workflows from scratch is hard. 

You have to manage context across turns, orchestrate tools and commands, route between models, integrate MCP servers, and think through permissions, safety boundaries, and failure modes. Even before you reach your actual product logic, you’ve already built a small platform. 

GitHub Copilot SDK (now in technical preview) removes that burden. It allows you to take the same Copilot agentic core that powers GitHub Copilot CLI and embed it in any application.  

This gives you programmatic access to the same production-tested execution loop that powers GitHub Copilot CLI. That means instead of wiring your own planner, tool loop, and runtime, you can embed that agentic loop directly into your application and build on top of it for any use case. 

You also get Copilot CLI’s support for multiple AI models, custom tool definitions, MCP server integration, GitHub authentication, and real-time streaming.

## How to get started

We’re starting with support for Node.js, Python, Go, and .NET. You can use your existing GitHub Copilot subscription or bring your own key.  

The github/copilot-sdk repository includes:  

- Setup instructions 
- Starter examples 
- SDK references for each supported language 

A good first step is to define a single task like updating files, running a command, or generating a structured output and letting Copilot plan and execute steps while your application supplies domain-specific tools and constraints. 

Here’s a short code snippet to preview how you can call the SDK in TypeScript: 

```
import { CopilotClient } from "@github/copilot-sdk"; 

const client = new CopilotClient(); 
await client.start(); 
const session = await client.createSession({ 
    model: "gpt-5", 
}); 
 
await session.send({ prompt: "Hello, world!" });
```

Visit github/copilot-sdk to start building.

## What’s new in GitHub Copilot CLI

Copilot CLI lets you plan projects or features, modify files, run commands, use custom agents, delegate tasks to the cloud, and more, all without leaving your terminal. 

Since we first introduced it, we’ve been expanding Copilot’s agentic workflows so it: 

- Works the way you do with persistent memory, infinite sessions, and intelligent compaction. 
- Helps you think with explore, plan, and review workflows where you can choose which model you want at each step. 
- Executes on your behalf with custom agents, agent skills, full MCP support, and async task delegation.

## How does the SDK build on top of Copilot CLI? 

The SDK takes the agentic power of Copilot CLI (the planning, tool use, and multi-turn execution loop) and makes it available in your favorite programming language. This makes it possible to integrate Copilot into any environment. You can build GUIs that use AI workflows, create personal tools that level up your productivity, or run custom internal agents in your enterprise workflows.  

Our teams have already used it to build things like:

- YouTube chapter generators 
- Custom GUIs for their agents 
- Speech-to-command workflows to run apps on their desktops 
- Games where you can compete with AI 
- Summarizing tools 
- And more!

Think of the Copilot SDK as an execution platform that lets you reuse the same agentic loop behind the Copilot CLI, while GitHub handles authentication, model management, MCP servers, custom agents, and chat sessions plus streaming. That means you are in control of what gets built on top of those building blocks.