## Notes

- We still need Copilot CLI installed in machine/server and authorized it using your Github account.

- Only use Copilot SDK for developing agentic features. If using a straightforward pipeline like RAG, OpenAI + LangChain is still a better option.

- With that said, adding agentic in your web app is a breeze. Copilot does all the heavy lifting.

- This SDK is pretty new. The models I'm using in VS Code Copilot doesn't really understand how it works. I have to add documentation files in the workspace for it to understand how to use it.

- Article should add those information as well as providing important code snippets (readers can see the full code in a Github repo).

- The "Form-Filling Agent" concept is available in a separate document: `docs/concept_form-filling_agent.md`.

## Article content

1. Opening paragraph about what is Copilot SDK and what it can do or add to an existing app
2. A how-to discussions about creating this project. Add snippets of the important stuff, eg. adding Copilot SDK to Fastify, creating requests, creating system messages, creating custom tools, etc.
3. Conclusion, about how easy to add Copilot to an app and some its caveats.