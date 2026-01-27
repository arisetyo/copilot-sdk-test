import { CopilotClient } from "@github/copilot-sdk";

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
}