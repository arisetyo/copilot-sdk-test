import { CopilotClient, defineTool } from "@github/copilot-sdk";

/**
 * Field options for form validation.
 * Must match the schema in register.js
 */
const fieldOptions = {
  institutions: ["Industry", "Academia", "Health services", "Government"],
  roles: {
    Industry: ["Management", "R&D", "QA", "Production"],
    Academia: ["Professor", "Researcher", "Lecturer", "Graduate Student"],
    "Health services": ["Physician", "Nurse", "Pharmacist", "Allied Health"],
    Government: ["Policy", "Research", "Regulatory", "Administration"],
  },
  positions: {
    Industry: ["Executive", "Manager", "Staff"],
    Academia: ["Senior", "Junior", "Postdoc"],
    "Health services": ["Senior", "Junior", "Resident"],
    Government: ["Senior", "Mid-level", "Junior"],
  },
  accommodations: [1, 2, 3, 4], // Valid package IDs
};

/**
 * Accommodation packages data.
 * Used by the custom tool handler.
 */
const accommodations = [
  {
    packageId: 1,
    name: "Budget",
    description: "Basic room with shared facilities",
    cost: "$50/night",
    amenities: ["WiFi", "Shared bathroom"],
  },
  {
    packageId: 2,
    name: "Standard",
    description: "Private room with ensuite bathroom",
    cost: "$80/night",
    amenities: ["WiFi", "Private bathroom", "TV"],
  },
  {
    packageId: 3,
    name: "Business",
    description: "Premium room with workspace",
    cost: "$120/night",
    amenities: ["WiFi", "Private bathroom", "TV", "Desk", "Mini fridge"],
  },
  {
    packageId: 4,
    name: "Premium",
    description: "Luxury suite with full amenities",
    cost: "$180/night",
    amenities: ["WiFi", "Private bathroom", "TV", "Desk", "Mini fridge", "Room service", "Balcony"],
  },
];

/**
 * System prompt for the form-filling agent.
 * Defines strict behavior and output format.
 */
const FORM_ASSIST_SYSTEM_PROMPT = `You are a JSON-only form extraction bot. You MUST respond with ONLY a JSON object, no other text.

EXTRACT these fields from user input:
- full_name: person's name
- email: email address  
- city: city name
- institution: MUST be exactly one of "Industry", "Academia", "Health services", "Government"
- role: based on institution:
  * Industry: Management, R&D, QA, Production
  * Academia: Professor, Researcher, Lecturer, Graduate Student
  * Health services: Physician, Nurse, Pharmacist, Allied Health
  * Government: Policy, Research, Regulatory, Administration
- position: based on institution:
  * Industry: Executive, Manager, Staff
  * Academia: Senior, Junior, Postdoc
  * Health services: Senior, Junior, Resident
  * Government: Senior, Mid-level, Junior
- accommodation: package ID (1=Budget $50, 2=Standard $80, 3=Business $120, 4=Premium $180)

ACCOMMODATION TOOL:
If the user asks about accommodations, packages, rooms, or budget options, use the get_accommodations tool to get available packages, then recommend based on their needs.

RESPOND WITH THIS EXACT JSON FORMAT:
{"fields":{"full_name":null,"email":null,"city":null,"institution":null,"role":null,"position":null,"accommodation":null},"message":"your message here"}

RULES:
1. Output ONLY valid JSON, nothing else - no markdown, no explanation
2. Use null for unknown fields
3. In "message", briefly say what you filled and ask for missing required fields (email, position)
4. If user asks unrelated questions, set all fields to null and politely redirect them in message
5. When recommending accommodation, set the accommodation field to the package ID (1-4)

Example input: "I'm John Smith, a nurse in Jakarta"
Example output: {"fields":{"full_name":"John Smith","email":null,"city":"Jakarta","institution":"Health services","role":"Nurse","position":null,"accommodation":null},"message":"Got it! I've filled in your name, city, institution and role. What's your email address and position level?"}

Example with accommodation: "I need a room with a workspace under $150"
Example output: {"fields":{"full_name":null,"email":null,"city":null,"institution":null,"role":null,"position":null,"accommodation":3},"message":"I recommend the Business package at $120/night - it includes a workspace with desk, mini fridge, and all the essentials!"}`;

/**
 * Custom tool definition for fetching accommodation packages.
 * The agent can call this tool when the user asks about accommodations.
 */
const getAccommodationsTool = defineTool("get_accommodations", {
  description: "Get available accommodation packages with pricing and amenities. Call this when the user asks about rooms, packages, accommodation options, or budget for staying.",
  parameters: {
    type: "object",
    properties: {},
    required: [],
  },
  handler: async () => {
    return accommodations;
  },
});

/**
 * Validates AI-extracted fields against allowed options.
 * Returns sanitized fields with invalid values set to null.
 *
 * @param {object} fields - The fields extracted by AI
 * @returns {object} - Validated and sanitized fields
 */
function validateFields(fields) {
  const validated = {
    full_name: null,
    email: null,
    city: null,
    institution: null,
    role: null,
    position: null,
    accommodation: null,
  };

  if (!fields || typeof fields !== "object") {
    return validated;
  }

  // Validate simple string fields
  if (typeof fields.full_name === "string" && fields.full_name.trim()) {
    validated.full_name = fields.full_name.trim();
  }
  if (typeof fields.email === "string" && fields.email.trim()) {
    validated.email = fields.email.trim();
  }
  if (typeof fields.city === "string" && fields.city.trim()) {
    validated.city = fields.city.trim();
  }

  // Validate institution against allowed values
  if (
    typeof fields.institution === "string" &&
    fieldOptions.institutions.includes(fields.institution)
  ) {
    validated.institution = fields.institution;

    // Validate role based on institution
    const allowedRoles = fieldOptions.roles[validated.institution] || [];
    if (typeof fields.role === "string" && allowedRoles.includes(fields.role)) {
      validated.role = fields.role;
    }

    // Validate position based on institution
    const allowedPositions = fieldOptions.positions[validated.institution] || [];
    if (typeof fields.position === "string" && allowedPositions.includes(fields.position)) {
      validated.position = fields.position;
    }
  }

  // Validate accommodation against allowed package IDs
  const accommodationId = typeof fields.accommodation === "string" 
    ? parseInt(fields.accommodation, 10) 
    : fields.accommodation;
  if (typeof accommodationId === "number" && fieldOptions.accommodations.includes(accommodationId)) {
    validated.accommodation = accommodationId;
  }

  return validated;
}

/**
 * Parses JSON from AI response, handling markdown code blocks.
 *
 * @param {string} text - The AI response text
 * @returns {object|null} - Parsed JSON or null if invalid
 */
function parseJsonResponse(text) {
  if (!text) return null;

  // Try to extract JSON from markdown code block
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = codeBlockMatch ? codeBlockMatch[1].trim() : text.trim();

  try {
    return JSON.parse(jsonStr);
  } catch {
    // Try to find JSON object in the text
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Fastify routes for Copilot SDK experimentation.
 *
 * Phase 2 (hello world): expose a simple JSON API you can hit from Postman.
 *
 * Notes:
 * - The Copilot SDK talks to a Copilot CLI "server mode" process under the hood (JSON-RPC).
 * - We start a single CopilotClient for the lifetime of the Fastify process and create a
 *   new session per request.
 */
export default async function aiRoutes(fastify) {
  /**
   * Long-lived Copilot SDK client.
   *
   * Why keep it around?
   * - Starting the underlying Copilot CLI server can be relatively expensive.
   * - Reusing the client avoids process churn across requests.
   */
  const copilot = new CopilotClient();

  // Start the SDK client (spawns / connects to the Copilot CLI server).
  await copilot.start();

  /**
   * Ensure we stop the Copilot client when Fastify shuts down.
   * This prevents orphaned CLI server processes.
   */
  fastify.addHook("onClose", async () => {
    await copilot.stop();
  });

  /**
   * POST /ai/hello
   *
   * Simple hello-world endpoint using Copilot SDK.
   * Accepts a prompt and returns the AI-generated answer.
   */
  fastify.post(
    "/ai/hello",
    {
      schema: {
        description: "Hello-world Copilot SDK endpoint. Send a prompt, get text back.",
        tags: ["ai"],
        body: {
          type: "object",
          additionalProperties: false,
          required: ["prompt"],
          properties: {
            prompt: { type: "string", minLength: 1 },
            /**
             * Optional model override.
             * Example: "gpt-5" (depends on what your Copilot CLI exposes).
             */
            model: { type: "string", minLength: 1 },
          },
        },
        response: {
          200: {
            type: "object",
            additionalProperties: false,
            properties: {
              ok: { type: "boolean" },
              prompt: { type: "string" },
              answer: { anyOf: [{ type: "string" }, { type: "null" }] },
            },
            required: ["ok", "prompt", "answer"],
          },
        },
      },
    },
    /**
     * POST /ai/hello
     *
     * Uses sendAndWait() to get the complete response.
     * Per SDK docs: access the answer via response.data.content
     */
    async (request) => {
      const { prompt, model } = request.body;

      const session = await copilot.createSession(
        model
          ? {
              model,
            }
          : undefined,
      );

      // Use sendAndWait() per the SDK documentation
      const response = await session.sendAndWait({ prompt });

      // Extract the answer from response.data.content (per SDK docs)
      const answer = response?.data?.content ?? null;

      return {
        ok: true,
        prompt,
        answer,
      };
    },
  );

  /**
   * POST /ai/stream
   *
   * SSE streaming endpoint for real-time AI responses.
   * Creates a session with streaming enabled and sends delta events to the client.
   *
   * SSE Event Format:
   * - event: delta     -> partial text chunk
   * - event: done      -> stream complete
   * - event: error     -> error occurred
   */
  fastify.post(
    "/ai/stream",
    {
      schema: {
        description: "Streaming AI endpoint using Server-Sent Events",
        tags: ["ai"],
        body: {
          type: "object",
          additionalProperties: false,
          required: ["prompt"],
          properties: {
            prompt: { type: "string", minLength: 1 },
            model: { type: "string", minLength: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      const { prompt, model } = request.body;

      // Set SSE headers
      reply.raw.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });

      /**
       * Helper to send SSE events
       * @param {string} event - Event name (delta, done, error)
       * @param {string} data - Event data (JSON string)
       */
      const sendEvent = (event, data) => {
        reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      };

      try {
        // Create session with streaming enabled
        const session = await copilot.createSession({
          ...(model && { model }),
          streaming: true,
        });

        /**
         * Listen for streaming events using the SDK's event callback.
         * Per docs: session.on((event: SessionEvent) => { ... })
         * Event types:
         * - "assistant.message_delta" -> event.data.deltaContent
         * - "session.idle" -> response complete
         */
        session.on((event) => {
          fastify.log.info({ eventType: event?.type }, "SDK event received");

          if (event?.type === "assistant.message_delta" && event?.data?.deltaContent) {
            sendEvent("delta", { text: event.data.deltaContent });
          }
        });

        // Send the prompt and wait for completion
        await session.sendAndWait({ prompt });

        // Signal stream complete
        sendEvent("done", { success: true });
      } catch (err) {
        sendEvent("error", { message: err.message || "Unknown error" });
      } finally {
        reply.raw.end();
      }
    },
  );

  /**
   * POST /ai/assist
   *
   * Form-filling agent endpoint.
   * Takes a user message and current form state, returns extracted fields + message.
   * Uses streaming to show the AI "thinking" then parses the final JSON.
   */
  fastify.post(
    "/ai/assist",
    {
      schema: {
        description: "AI form-filling assistant with streaming response",
        tags: ["ai"],
        body: {
          type: "object",
          additionalProperties: false,
          required: ["prompt"],
          properties: {
            prompt: { type: "string", minLength: 1 },
            currentForm: {
              type: "object",
              description: "Current form field values",
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { prompt, currentForm } = request.body;

      // Set SSE headers for streaming
      reply.raw.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });

      const sendEvent = (event, data) => {
        reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      };

      try {
        // Build context-aware prompt
        const contextPrompt = currentForm
          ? `Current form state: ${JSON.stringify(currentForm)}\n\nUser says: ${prompt}`
          : prompt;

        // Create session with system message and custom tools (per SDK docs)
        const session = await copilot.createSession({
          streaming: true,
          systemMessage: {
            content: FORM_ASSIST_SYSTEM_PROMPT,
          },
          tools: [getAccommodationsTool],
        });

        let fullResponse = "";

        // Stream the response
        session.on((event) => {
          if (event?.type === "assistant.message_delta" && event?.data?.deltaContent) {
            fullResponse += event.data.deltaContent;
            // Send raw chunks for "thinking" display
            sendEvent("delta", { text: event.data.deltaContent });
          }
          // Log tool calls for debugging
          if (event?.type === "tool.call") {
            fastify.log.info({ tool: event.data }, "Tool called by agent");
            sendEvent("tool_call", { name: event.data?.name || "unknown" });
          }
        });

        await session.sendAndWait({ prompt: contextPrompt });

        // Parse the JSON response
        const parsed = parseJsonResponse(fullResponse);

        if (parsed && parsed.fields) {
          // Validate fields against schema
          const validatedFields = validateFields(parsed.fields);
          const message = parsed.message || "I've updated the form based on your input.";

          sendEvent("result", {
            fields: validatedFields,
            message,
          });
        } else {
          // AI didn't return valid JSON - send the raw response as message
          sendEvent("result", {
            fields: null,
            message: fullResponse.trim() || "I couldn't understand that. Please describe yourself for the registration form.",
          });
        }

        sendEvent("done", { success: true });
      } catch (err) {
        fastify.log.error({ err }, "AI assist error");
        sendEvent("error", { message: err.message || "Unknown error" });
      } finally {
        reply.raw.end();
      }
    },
  );
}