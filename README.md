<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Knowledge Graph Builder

This app extracts entities and relationships from text and visualizes them as a knowledge graph.

## What was fixed

- Vercel now has a real serverless route at `api/extract.ts`, so `/api/extract` will not 404 after deployment.
- Local development and Vercel use the same extraction service.
- `.env.local` is loaded locally, so your Gemini key is actually used.
- Mock mode now runs in the browser immediately and also works as a fallback if the LLM API fails.
- The API route now returns a `mock_fallback` graph instead of status 500 when the LLM route has a serverless/runtime problem.
- LLM relation labels are normalized, so outputs like `works for`, `studies at`, and `located in` no longer collapse into `KNOWS`.
- The rule-based extractor is more reliable for common people, school, company, project, skill, and location sentences.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local`:

   ```bash
   GEMINI_API_KEY="paste_your_real_key_here"
   GEMINI_MODEL="gemini-2.5-flash"
   ```

3. Run the app:

   ```bash
   npm run dev
   ```

## Deploy on Vercel

1. Push this folder to GitHub.
2. Import the GitHub repo in Vercel.
3. In Vercel, add this environment variable:

   ```bash
   GEMINI_API_KEY=paste_your_real_key_here
   ```

4. Deploy. The frontend calls `/api/extract`, and Vercel serves that from `api/extract.ts`.
