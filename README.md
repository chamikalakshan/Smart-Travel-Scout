# Smart Travel Scout 🌏

A mini web application that uses **Google Gemini AI** to match natural-language travel requests to a curated Sri Lanka inventory — with strict grounding, schema validation, and a polished UI.

Built as a technical assessment for a product-minded engineer role.

---

## Live Demo

> Deployed on Vercel — _add your URL here after deployment_

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| AI | Google Gemini 2.5 Flash (`@google/genai`) |
| Validation | Zod |
| Deployment | Vercel |

---

## Features

- **Natural-language search** — type any travel request in plain English
- **AI-grounded matching** — Gemini is strictly instructed to match only from the provided inventory; no hallucinations
- **Zod schema validation** — AI response is validated at the API boundary; only valid inventory IDs are returned
- **Rate limiting** — 5 requests per IP per minute (in-memory)
- **Prompt length guard** — 500 character cap enforced on both client and server
- **Rich results** — location, price, colour-coded tags, and AI reasoning per card
- **Edge states** — loading skeleton, empty-state, and error banner
- **Secure** — API key never exposed to the client (server-side Route Handler only)

---

## Inventory

The AI is grounded exclusively to this dataset:

| ID | Title | Location | Price | Tags |
|---|---|---|---|---|
| 1 | High-Altitude Tea Trails | Nuwara Eliya | $120 | cold, nature, hiking |
| 2 | Coastal Heritage Wander | Galle Fort | $45 | history, culture, walking |
| 3 | Wild Safari Expedition | Yala | $250 | animals, adventure, photography |
| 4 | Surf & Chill Retreat | Arugam Bay | $80 | beach, surfing, young-vibe |
| 5 | Ancient City Exploration | Sigiriya | $110 | history, climbing, view |

---

## Project Structure

```
app/
├── (frontend)/
│   └── page.tsx          # UI — hero, search input, results grid
├── api/search/
│   └── route.ts          # POST handler — Gemini AI, Zod validation, rate limiting
├── layout.tsx            # Root layout + SEO metadata
└── globals.css           # Tailwind + custom animations
```

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/smart-travel-scout.git
cd smart-travel-scout
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the project root:

```bash
GEMINI_API_KEY=your-gemini-api-key-here
```

Get a free API key at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Architecture Notes

### AI Grounding
The full inventory is injected into the system prompt. Gemini is instructed to return **only** a JSON array of `{ id, reason }` objects matching inventory IDs. It is explicitly told to return `[]` for out-of-inventory requests.

### Schema Validation (Zod)
The API route uses two Zod schemas:
1. **`RequestSchema`** — validates the incoming prompt (non-empty, max 500 chars)
2. **`AiMatchSchema`** — validates the AI's JSON response, whitelisting only IDs `[1–5]`

Any ID returned by the AI that is not in the inventory is silently dropped before the response is sent to the client.

### Rate Limiting
A simple in-memory `Map` tracks request counts per IP. Each IP is limited to **5 requests per 60 seconds**. Exceeding this returns a `429 Too Many Requests` response.

### Security
- `GEMINI_API_KEY` is read only in the server-side Route Handler — never bundled into the client
- Prompt is sanitised and length-capped before being sent to the AI

---

## Deployment (Vercel)

1. Push the repo to GitHub
2. Import the project in [vercel.com](https://vercel.com)
3. Add `GEMINI_API_KEY` in **Project Settings → Environment Variables**
4. Deploy

---

## License

MIT
