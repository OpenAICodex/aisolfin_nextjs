AI Solution Finder

AI Solution Finder is a Next.js application that analyzes and evaluates business processes. The app uses the OpenAI API to check compliance with the GDPR and the EU AI Act, estimate business value, and provide recommendations for automation tools. Evaluations are stored per user in a Supabase database and protected by magic link authentication.

Architecture

Frontend: Next.js 14 with the App Router, TypeScript, and Tailwind CSS. The UI is modeled on the supplied Streamlit reference and supports all common screen sizes.

Backend: Server routes in the app/api directory orchestrate the three OpenAI calls (compliance, business value, and tool recommendations). The LLM logic resides in server/llm and uses Zod for schema validation.

Database: Supabase (PostgreSQL with pgvector) stores user profiles, evaluations, documents, embeddings, and settings. SQL migrations are located under db/migrations. RLS policies prevent unauthorized access.

Admin: An admin page (/admin) is server-protected. It serves as a placeholder for functions like editing prompts, uploading PDFs, and re-embedding.

Setup

Install the repository

npm install


Set up Supabase

Create a new Supabase project
. Enable the vector extension and create the database tables using the SQL file db/migrations/0001_init.sql.

Store the values for NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in your environment variables.

Configure OpenAI

Set an API key in OPENAI_API_KEY. You can adjust OPENAI_CHAT_MODEL and OPENAI_EMBEDDING_MODEL if needed.

Start development

npm run dev


The application will then be available at http://localhost:3000. Unauthenticated visitors are automatically redirected to the login page.

Scripts

Embedding new documents: With ts-node scripts/embed.ts <pdf>, administrators can read new PDF regulations, split them into chunks, compute vectors, and write them to the database. Before running, both OpenAI and Supabase credentials must be set as environment variables.

Tests & CI

This repository contains a basic structure for tests (Vitest) and pixel comparisons (Playwright) as well as linting and type checking. The concrete test cases and GitHub workflows still need to be added to meet the quality goals defined in the task description (≥ 99 % pixel similarity at 1920 px).

Security notes

Secrets remain server-side. API keys and service keys must never be delivered to the browser.

Activate RLS. The included SQL policies ensure that users only see their own data. Admin roles are controlled via the profiles.role table column.

Daily cap: Non-admin users can perform a maximum of three evaluations per day (Europe/Berlin). Further requests return HTTP status 429.

Further development

To use the system in production, the following points must be implemented:

Admin interface: Full implementation for editing prompts and uploading PDF documents. After uploading, vectors must be re-embedded and old vectors archived.

Contact form: When the daily limit is reached, a contact form should appear that sends an email via Nodemailer and records an entry in the database.

Pixel-perfect design: The Tailwind theme values in tailwind.config.ts serve as a starting point. To match the reference exactly, colors, spacing, and fonts may need to be adjusted and a CI-based pixel-diff check should be set up.

If you have questions or need debugging, refer to the comments in the source code and the task description in the root of the project.