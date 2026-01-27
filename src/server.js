/**
 * Main Fastify server configuration
 * 
 * This server demonstrates AI-assisted form filling using the GitHub Copilot SDK.
 * It serves both a traditional form and an AI-powered agentic form.
 */

import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyView from '@fastify/view';
import fastifyFormbody from '@fastify/formbody';
import ejs from 'ejs';
import path from 'path';
import { fileURLToPath } from 'url';

import registerRoutes from './routes/register.js';
import aiRoutes from './routes/ai.js';

// ES module compatibility: recreate __dirname since it's not available in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({
  logger: true
});

// Register plugins
await fastify.register(fastifyFormbody);

// Serve static files (CSS, JS) from the public directory
await fastify.register(fastifyStatic, {
  root: path.join(__dirname, '../public'),
  prefix: '/public/'
});

// Configure EJS as the templating engine
await fastify.register(fastifyView, {
  engine: { ejs },
  root: path.join(__dirname, '../views')
});

// Register routes
await fastify.register(registerRoutes);
await fastify.register(aiRoutes);

/**
 * Start the Fastify server
 * Listens on port 3000 by default
 */
const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
    console.log('Server running at http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
