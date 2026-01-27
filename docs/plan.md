# Planning Document: GitHub Copilot SDK Agent for Registration Form

## 1. Goal & Scope

Build an AI-assisted registration experience where users can either:

* Fill the form manually (traditional UX), or
* Use a natural-language prompt to let an AI agent help complete the form

The AI **must be constrained strictly to the registration process** and must not act as a general-purpose chatbot.

Tech stack:

* Backend: Fastify (Node.js)
* Frontend: HTML + HTMX
* AI: GitHub Copilot SDK (Agent-based)

---

## 2. User Experience Overview

### 2.1 Page Layout

* Registration form with ~10 required fields (e.g. name, email, password, country, institution, role, etc.)
* A single "AI Assist" text area:

  * Placeholder: "Describe yourself and I’ll help fill the form"
* Button: **"Ask AI"**

### 2.2 Interaction Flow

1. User types a prompt (e.g. "I’m a biomedical researcher from Bandung working at a private hospital")
2. HTMX sends the prompt + current form state to the backend
3. Copilot Agent:

   * Interprets user intent
   * Maps intent → form fields
   * Returns structured field updates
4. Frontend updates relevant inputs
5. User reviews, edits, and submits manually

---

## 3. Architecture Overview

```
[HTML Form]
   |
   | (HTMX POST)
   v
[Fastify Route: /ai/register-assist]
   |
   | (Copilot SDK Agent)
   v
[Structured JSON Response]
   |
   | (HTMX swap / JS)
   v
[Updated Form Fields]
```

---

## 4. Copilot SDK Design

### 4.1 Agent Type

* Single-purpose **Form Assistance Agent**
* Stateless or minimally stateful (per-request context)

### 4.2 System Prompt (Core Guardrail)

The agent system prompt should:

* Define role:

  * "You are an assistant that helps users complete a registration form"
* Explicitly forbid:

  * General Q&A
  * Advice unrelated to form fields
  * Any actions outside field suggestion

Example intent (conceptual):

> You may only output structured data for the registration form fields provided. If the user asks anything unrelated, politely refuse.

---

## 5. Data Contract (Critical)

### 5.1 Allowed Fields Schema

Define a strict schema the agent can output:

```json
{
  "full_name": "string | null",
  "email": "string | null",
  "city": "string | null",
  "institution": "Industry | Academia | Health services | Government | null",
  "role": "string | null (conditional on institution)",
  "position": "string | null (conditional on institution)"
}
```

**Conditional Field Rules:**

* **`institution`**: Must be one of: "Industry", "Academia", "Health services", "Government"
* **`role`** (conditional on institution):
  * Industry: "Management", "R&D", "QA", "Production", etc.
  * Academia: "Professor", "Researcher", "Lecturer", "Graduate Student", etc.
  * Health services: "Physician", "Nurse", "Pharmacist", "Allied Health", etc.
  * Government: "Policy", "Research", "Regulatory", "Administration", etc.
* **`position`** (conditional on institution):
  * Industry: "Executive", "Manager", "Staff"
  * Academia: "Senior", "Junior", "Postdoc"
  * Health services: "Senior", "Junior", "Resident"
  * Government: "Senior", "Mid-level", "Junior"

### 5.2 Output Rules

* Only keys from the schema allowed
* Missing or unknown info → `null`
* No free text explanations in the response

This acts as a **hard guardrail**.

---

## 6. Fastify Backend Plan

### 6.1 Endpoint

`POST /ai/register-assist`

Payload:

```json
{
  "prompt": "user text",
  "current_form": { "...existing values" }
}
```

### 6.2 Backend Responsibilities

* Validate input
* Inject schema + system prompt
* Call Copilot SDK agent
* Validate AI output against schema
* Strip any unexpected fields

### 6.3 Security Considerations

* Never auto-submit the form
* Never accept AI output without user confirmation
* Rate-limit AI endpoint

---

## 7. Frontend + HTMX Plan

### 7.1 HTMX Trigger

* `hx-post="/ai/register-assist"`
* `hx-target="#form-fields"`
* `hx-swap="none"` (manual JS update preferred)

### 7.2 Applying AI Output

* Parse JSON response
* For each non-null field:

  * Update corresponding input value
  * Highlight field as "AI-suggested"

### 7.3 UX Safeguards

* Visual indicator: "AI suggestion"
* Undo / clear AI-filled fields
* User always has final control

---

## 8. Handling Conditional Fields (>20 inputs case)

Strategy:

* Backend sends **current visible fields only** to agent
* Agent only fills fields relevant to current form state
* Repeatable interaction loop:

  * User prompt → partial fill → new fields appear → next prompt

This keeps complexity manageable and avoids overfilling.

---

## 9. Guardrails Summary

| Risk                 | Mitigation                        |
| -------------------- | --------------------------------- |
| AI acts like chatbot | Narrow system prompt              |
| Hallucinated fields  | Strict JSON schema                |
| Wrong assumptions    | `null` for unknown values         |
| Over-automation      | No auto-submit                    |
| Prompt injection     | Ignore instructions outside scope |

---

## 10. Future Enhancements (Optional)

* Field-level confidence scores
* Inline clarification questions (one at a time)
* Localization (Bahasa / English)
* Analytics: which fields users struggle with most

---

## 11. Learning Path (Suggested Next Steps)

1. Minimal Copilot SDK agent (CLI / local)
2. Hardcode schema + system prompt
3. Integrate with Fastify route
4. Add HTMX wiring
5. Polish UX + guardrails

---

**Outcome:**
A safe, narrow, form-focused AI assistant that improves UX without turning your app into a general-purpose chat interface.

References:
1. `docs/copilot-sdk-readme.md`
2. `docs/about-copilot-sdk.md`