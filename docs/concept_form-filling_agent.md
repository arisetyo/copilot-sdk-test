# Concept: Form-Filling Agent
The goal is to take natural language like _"I'm Dr. Sarah Chen, a researcher at Stanford University in Palo Alto"__ and extract structured form data:

## How it works

### 1. System Prompt (Guardrail)

Tells the AI: "You are a form-filling assistant. Extract ONLY these fields. Return JSON. Return null for unknown values. Refuse non-form requests."

### 2. Schema Constraint

- Define allowed values: institution must be one of ["Industry", "Academia", "Health services", "Government"]
- AI can only output fields that match our form schema

### 3. Two-Part Response

- The AI returns structured JSON for form fields
- Optionally includes a message to the user (e.g., "I've filled what I could. What's your email?")

### 4. Endpoint Flow

```
User prompt + current form state
       ↓
System prompt + schema injected
       ↓
Copilot SDK (streaming or not)
       ↓
Parse JSON from response
       ↓
Return { fields: {...}, message: "..." }
       ↓
Frontend updates form + shows message
```

### 5. Validation Layer

- Backend validates AI output against allowed values
- Strips any unexpected fields
- Ensures type safety

## Key Guardrails:

### Risk
1. AI becomes chatbot
2. Hallucinated values
3. Wrong field types
4. User confusion

### Mitigation
1. System prompt restricts to form-filling only
2. Validate against fieldOptions schema
3. Backend enforces schema before returning
4. AI explains what it filled + asks for missing info

## Implementation Plan:
1. **Create `/ai/assist` endpoint** — Takes prompt, returns { fields, message }
2. **System prompt** — Strict instructions + JSON schema
3. **Validation** — Check AI output against allowed options
4. **Frontend integration** — Call endpoint, update form fields, show AI message