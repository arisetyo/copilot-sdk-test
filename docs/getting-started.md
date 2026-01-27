# Step 1: Install the SDK

First, create a new directory and initialize your project:

```
mkdir copilot-demo && cd copilot-demo
npm init -y --init-type module
```

Then install the SDK and TypeScript runner:

```
npm install @github/copilot-sdk tsx
```

# Step 2: Send Your First Message
Create a new file and add the following code. This is the simplest way to use the SDK—about 5 lines of code.

Create index.ts:
```
import { CopilotClient } from "@github/copilot-sdk";

const client = new CopilotClient();
const session = await client.createSession({ model: "gpt-4.1" });

const response = await session.sendAndWait({ prompt: "What is 2 + 2?" });
console.log(response?.data.content);

await client.stop();
process.exit(0);
```

Run it:
```
npx tsx index.ts
```

You should see:
```
4
```
Congratulations! You just built your first Copilot-powered app.

# Step 3: Add Streaming Responses

Right now, you wait for the complete response before seeing anything. Let's make it interactive by streaming the response as it's generated.

Update index.ts:

```
import { CopilotClient, SessionEvent } from "@github/copilot-sdk";

const client = new CopilotClient();
const session = await client.createSession({
    model: "gpt-4.1",
    streaming: true,
});

// Listen for response chunks
session.on((event: SessionEvent) => {
    if (event.type === "assistant.message_delta") {
        process.stdout.write(event.data.deltaContent);
    }
    if (event.type === "session.idle") {
        console.log(); // New line when done
    }
});

await session.sendAndWait({ prompt: "Tell me a short joke" });

await client.stop();
process.exit(0);
```

Run the code again. You'll see the response appear word by word.

# Step 4: Add a Custom Tool

Now for the powerful part. Let's give Copilot the ability to call your code by defining a custom tool. We'll create a simple weather lookup tool.

Update index.ts:
```
import { CopilotClient, defineTool, SessionEvent } from "@github/copilot-sdk";

// Define a tool that Copilot can call
const getWeather = defineTool("get_weather", {
    description: "Get the current weather for a city",
    parameters: {
        type: "object",
        properties: {
            city: { type: "string", description: "The city name" },
        },
        required: ["city"],
    },
    handler: async (args: { city: string }) => {
        const { city } = args;
        // In a real app, you'd call a weather API here
        const conditions = ["sunny", "cloudy", "rainy", "partly cloudy"];
        const temp = Math.floor(Math.random() * 30) + 50;
        const condition = conditions[Math.floor(Math.random() * conditions.length)];
        return { city, temperature: `${temp}°F`, condition };
    },
});

const client = new CopilotClient();
const session = await client.createSession({
    model: "gpt-4.1",
    streaming: true,
    tools: [getWeather],
});

session.on((event: SessionEvent) => {
    if (event.type === "assistant.message_delta") {
        process.stdout.write(event.data.deltaContent);
    }
});

await session.sendAndWait({
    prompt: "What's the weather like in Seattle and Tokyo?",
});

await client.stop();
process.exit(0);
```

Run it and you'll see Copilot call your tool to get weather data, then respond with the results!

# Step 5: Build an Interactive Assistant

Let's put it all together into a useful interactive assistant:

```
import { CopilotClient, defineTool, SessionEvent } from "@github/copilot-sdk";
import * as readline from "readline";

const getWeather = defineTool("get_weather", {
    description: "Get the current weather for a city",
    parameters: {
        type: "object",
        properties: {
            city: { type: "string", description: "The city name" },
        },
        required: ["city"],
    },
    handler: async ({ city }) => {
        const conditions = ["sunny", "cloudy", "rainy", "partly cloudy"];
        const temp = Math.floor(Math.random() * 30) + 50;
        const condition = conditions[Math.floor(Math.random() * conditions.length)];
        return { city, temperature: `${temp}°F`, condition };
    },
});

const client = new CopilotClient();
const session = await client.createSession({
    model: "gpt-4.1",
    streaming: true,
    tools: [getWeather],
});

session.on((event: SessionEvent) => {
    if (event.type === "assistant.message_delta") {
        process.stdout.write(event.data.deltaContent);
    }
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

console.log("🌤️  Weather Assistant (type 'exit' to quit)");
console.log("   Try: 'What's the weather in Paris?'\n");

const prompt = () => {
    rl.question("You: ", async (input) => {
        if (input.toLowerCase() === "exit") {
            await client.stop();
            rl.close();
            return;
        }

        process.stdout.write("Assistant: ");
        await session.sendAndWait({ prompt: input });
        console.log("\n");
        prompt();
    });
};

prompt();
```

Run with:

```
npx tsx weather-assistant.ts
```
Example session:

```
🌤️  Weather Assistant (type 'exit' to quit)
   Try: 'What's the weather in Paris?' or 'Compare weather in NYC and LA'

You: What's the weather in Seattle?
Assistant: Let me check the weather for Seattle...
It's currently 62°F and cloudy in Seattle.

You: How about Tokyo and London?
Assistant: I'll check both cities for you:
- Tokyo: 75°F and sunny
- London: 58°F and rainy

You: exit
```
You've built an assistant with a custom tool that Copilot can call!

# How Tools Work
When you define a tool, you're telling Copilot:

- What the tool does (description)
- What parameters it needs (schema)
- What code to run (handler)
Copilot decides when to call your tool based on the user's question. When it does:

- Copilot sends a tool call request with the parameters
- The SDK runs your handler function
- The result is sent back to Copilot
- Copilot incorporates the result into its response

# What's Next?
Now that you've got the basics, here are more powerful features to explore:

## Connect to MCP Servers
MCP (Model Context Protocol) servers provide pre-built tools. Connect to GitHub's MCP server to give Copilot access to repositories, issues, and pull requests:

```
const session = await client.createSession({
    mcpServers: {
        github: {
            type: "http",
            url: "https://api.githubcopilot.com/mcp/",
        },
    },
});
```

📖 Full MCP documentation → - Learn about local vs remote servers, all configuration options, and troubleshooting.

## Create Custom Agents
Define specialized AI personas for specific tasks:
```
const session = await client.createSession({
    customAgents: [{
        name: "pr-reviewer",
        displayName: "PR Reviewer",
        description: "Reviews pull requests for best practices",
        prompt: "You are an expert code reviewer. Focus on security, performance, and maintainability.",
    }],
});
```

## Customize the System Message
Control the AI's behavior and personality:
```
const session = await client.createSession({
    systemMessage: {
        content: "You are a helpful assistant for our engineering team. Always be concise.",
    },
});
```