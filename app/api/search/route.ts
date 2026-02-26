import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { z } from 'zod'

// ─────────────────────────────────────────────
// Strict Local Inventory — source of truth
// ─────────────────────────────────────────────
const INVENTORY = [
    { id: 1, title: 'High-Altitude Tea Trails', location: 'Nuwara Eliya', price: 120, tags: ['cold', 'nature', 'hiking'] },
    { id: 2, title: 'Coastal Heritage Wander', location: 'Galle Fort', price: 45, tags: ['history', 'culture', 'walking'] },
    { id: 3, title: 'Wild Safari Expedition', location: 'Yala', price: 250, tags: ['animals', 'adventure', 'photography'] },
    { id: 4, title: 'Surf & Chill Retreat', location: 'Arugam Bay', price: 80, tags: ['beach', 'surfing', 'young-vibe'] },
    { id: 5, title: 'Ancient City Exploration', location: 'Sigiriya', price: 110, tags: ['history', 'climbing', 'view'] },
] as const

// Valid IDs derived from inventory — used for whitelist validation
const VALID_IDS = INVENTORY.map((i) => i.id) as number[]

// ─────────────────────────────────────────────
// Zod schemas
// ─────────────────────────────────────────────

/** Schema for the incoming request body */
const RequestSchema = z.object({
    prompt: z
        .string({ required_error: 'prompt is required' })
        .min(1, 'prompt cannot be empty')
        .max(500, 'prompt must be 500 characters or fewer'),
})

/** Schema for each item returned by the AI */
const AiMatchSchema = z.array(
    z.object({
        id: z.number().int().refine((id) => VALID_IDS.includes(id), {
            message: 'AI returned an ID that is not in the inventory',
        }),
        reason: z.string().min(1),
    }),
)

// ─────────────────────────────────────────────
// System prompt — strictly grounded
// ─────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a travel scout. Match the user's request ONLY to the provided INVENTORY. Evaluate based on price, tags, and location. You must return ONLY a JSON array of objects, where each object has an 'id' (matching the inventory ID) and a 'reason' (a short, one-sentence explanation of why it matches). If no items match, or if the user asks for a location outside the inventory, return an empty array [].

INVENTORY:
${JSON.stringify(INVENTORY, null, 2)}`

// ─────────────────────────────────────────────
// Simple in-memory rate limiter
// 5 requests per IP per 60 seconds
// ─────────────────────────────────────────────
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 60_000

const ipRequestMap = new Map<string, { count: number; windowStart: number }>()

function isRateLimited(ip: string): boolean {
    const now = Date.now()
    const entry = ipRequestMap.get(ip)

    if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
        // New window
        ipRequestMap.set(ip, { count: 1, windowStart: now })
        return false
    }

    if (entry.count >= RATE_LIMIT) return true

    entry.count++
    return false
}

// ─────────────────────────────────────────────
// Gemini client
// ─────────────────────────────────────────────
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

// ─────────────────────────────────────────────
// POST /api/search
// ─────────────────────────────────────────────
export async function POST(request: NextRequest) {
    try {
        // 1. Rate limiting — identify client IP
        const ip =
            request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
            request.headers.get('x-real-ip') ??
            'unknown'

        if (isRateLimited(ip)) {
            return NextResponse.json(
                { error: 'Too many requests. Please wait a moment before trying again.' },
                { status: 429 },
            )
        }

        // 2. Validate request body with Zod
        const body = await request.json().catch(() => ({}))
        const parsed = RequestSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.errors[0]?.message ?? 'Invalid request' },
                { status: 400 },
            )
        }

        const { prompt } = parsed.data

        // 3. Call Gemini — grounded to inventory
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_PROMPT,
                temperature: 0.2,            // Low temp → deterministic, accurate matching
                responseMimeType: 'application/json',
            },
        })

        const rawContent = response.text ?? '[]'

        // 4. Parse and Zod-validate the AI's JSON response
        let aiMatches: Array<{ id: number; reason: string }> = []
        try {
            const jsonParsed = JSON.parse(rawContent)
            // Handle both bare array and object-wrapped responses from the model
            const candidate = Array.isArray(jsonParsed)
                ? jsonParsed
                : (Object.values(jsonParsed).find(Array.isArray) ?? [])

            const validated = AiMatchSchema.safeParse(candidate)
            if (validated.success) {
                aiMatches = validated.data
            } else {
                // Filter out any invalid items rather than failing completely
                aiMatches = (candidate as Array<{ id: number; reason: string }>).filter(
                    (m) => VALID_IDS.includes(m?.id) && typeof m?.reason === 'string',
                )
            }
        } catch {
            aiMatches = []
        }

        // 5. Map validated IDs back to full inventory objects + attach reason
        const results = aiMatches
            .map(({ id, reason }) => {
                const item = INVENTORY.find((inv) => inv.id === id)
                if (!item) return null          // Extra safety: strip any unknown IDs
                return { ...item, reason }
            })
            .filter(Boolean)

        return NextResponse.json({ results })
    } catch (error: unknown) {
        console.error('[/api/search] Error:', error)
        const message = error instanceof Error ? error.message : 'Internal server error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
