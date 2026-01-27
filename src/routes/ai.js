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
}