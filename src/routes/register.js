/**
 * Registration Routes
 * 
 * Handles both traditional form submission and AI-assisted (agentic) form filling.
 * The field options define the valid values for conditional dropdowns.
 */

/**
 * Field options configuration
 * 
 * These options enforce the schema defined in docs/plan.md:
 * - institutions: The four allowed institution types
 * - roles: Role options that depend on the selected institution
 * - positions: Position options that depend on the selected institution
 * 
 * This same schema will be used by the Copilot agent to ensure
 * AI suggestions match the allowed field values.
 */
const fieldOptions = {
  institutions: ['Industry', 'Academia', 'Health services', 'Government'],
  roles: {
    Industry: ['Management', 'R&D', 'QA', 'Production'],
    Academia: ['Professor', 'Researcher', 'Lecturer', 'Graduate Student'],
    'Health services': ['Physician', 'Nurse', 'Pharmacist', 'Allied Health'],
    Government: ['Policy', 'Research', 'Regulatory', 'Administration']
  },
  positions: {
    Industry: ['Executive', 'Manager', 'Staff'],
    Academia: ['Senior', 'Junior', 'Postdoc'],
    'Health services': ['Senior', 'Junior', 'Resident'],
    Government: ['Senior', 'Mid-level', 'Junior']
  }
};

export default async function registerRoutes(fastify) {
  /**
   * Home page - shows links to both form types
   */
  fastify.get('/', async (request, reply) => {
    return reply.view('index.ejs');
  });

  /**
   * Traditional registration form
   * Users manually fill in all fields with conditional dropdowns
   */
  fastify.get('/traditional-form', async (request, reply) => {
    return reply.view('register.ejs', { fieldOptions });
  });

  /**
   * Agentic registration form
   * Users can describe themselves in natural language and let AI fill the form
   */
  fastify.get('/agentic-form', async (request, reply) => {
    return reply.view('agentic.ejs', { fieldOptions });
  });

  /**
   * Handle traditional form submission
   * Receives form data via HTMX POST and returns an HTML confirmation
   */
  fastify.post('/register', async (request, reply) => {
    const formData = request.body;
    
    // Log the received data (for debugging)
    fastify.log.info({ formData }, 'Registration form submitted');
    
    // Return success message as HTML partial for HTMX
    return reply
      .type('text/html')
      .send(`
        <div class="success-message">
          <h3>Registration Successful!</h3>
          <p>Thank you, <strong>${formData.full_name}</strong>. Your registration has been received.</p>
          <pre>${JSON.stringify(formData, null, 2)}</pre>
        </div>
      `);
  });

  /**
   * API endpoint to get roles/positions for a given institution
   * Used by the frontend to dynamically update conditional dropdowns
   * 
   * @param {string} institution - The selected institution type
   * @returns {Object} Object containing roles and positions arrays
   */
  fastify.get('/api/options/:institution', async (request, reply) => {
    const { institution } = request.params;
    
    return {
      roles: fieldOptions.roles[institution] || [],
      positions: fieldOptions.positions[institution] || []
    };
  });
}

