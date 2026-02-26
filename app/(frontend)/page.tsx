'use client'

import { useState, useRef } from 'react'

// ---- Types ----
interface TravelResult {
    id: number
    title: string
    location: string
    price: number
    tags: string[]
    reason: string
}

// ---- Location → emoji map for visual flair ----
const LOCATION_EMOJI: Record<string, string> = {
    'Nuwara Eliya': '🍃',
    'Galle Fort': '🏰',
    'Yala': '🦁',
    'Arugam Bay': '🏄',
    'Sigiriya': '🗿',
}

// ---- Prompt character limit (must match server-side Zod schema) ----
const MAX_PROMPT_LENGTH = 500

// ---- Example prompts to inspire users ----
const EXAMPLE_PROMPTS = [
    'a chilled beach weekend under $100',
    'something adventurous with wildlife and photography',
    'historical sightseeing on a tight budget',
    'a cool mountain escape with nature walks',
]

// ---- Tag colour mapping ----
const TAG_COLORS: Record<string, string> = {
    cold: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    nature: 'bg-green-500/15 text-green-300 border-green-500/30',
    hiking: 'bg-lime-500/15 text-lime-300 border-lime-500/30',
    history: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    culture: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    walking: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
    animals: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
    adventure: 'bg-red-500/15 text-red-300 border-red-500/30',
    photography: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
    beach: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    surfing: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    'young-vibe': 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    climbing: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    view: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
}
const DEFAULT_TAG_COLOR = 'bg-slate-500/15 text-slate-300 border-slate-500/30'

export default function HomePage() {
    const [prompt, setPrompt] = useState('')
    const [loading, setLoading] = useState(false)
    const [results, setResults] = useState<TravelResult[] | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [hasSearched, setHasSearched] = useState(false)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    async function handleSearch(searchPrompt: string = prompt) {
        const trimmed = searchPrompt.trim()
        if (!trimmed) {
            inputRef.current?.focus()
            return
        }

        setLoading(true)
        setError(null)
        setResults(null)
        setHasSearched(true)

        try {
            const res = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: trimmed }),
            })

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}))
                throw new Error(errData.error ?? `Request failed (${res.status})`)
            }

            const data = await res.json()
            setResults(data.results ?? [])
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Something went wrong.')
        } finally {
            setLoading(false)
        }
    }

    function handleExampleClick(ex: string) {
        setPrompt(ex)
        handleSearch(ex)
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSearch()
        }
    }

    return (
        <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>

            {/* ── Noise / gradient background ── */}
            <div
                aria-hidden
                className="pointer-events-none fixed inset-0 overflow-hidden"
            >
                {/* Soft radial glows */}
                <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-indigo-600/10 blur-[120px]" />
                <div className="absolute top-60 -right-40 h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[120px]" />
                <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-fuchsia-600/8 blur-[100px]" />
            </div>

            <div className="relative z-10 mx-auto max-w-5xl px-6 py-16 sm:py-24">

                {/* ────────────── HERO SECTION ────────────── */}
                <section className="mb-14 text-center">

                    {/* Badge */}
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-indigo-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                        AI-Powered Travel Matching · Sri Lanka
                    </div>

                    {/* Title */}
                    <h1 className="mb-4 text-5xl font-black leading-tight tracking-tight sm:text-6xl lg:text-7xl">
                        <span className="gradient-text">Smart Travel</span>
                        <br />
                        <span className="text-slate-100">Scout</span>
                    </h1>

                    {/* Subtitle */}
                    <p className="mx-auto mb-10 max-w-xl text-lg text-slate-400 leading-relaxed">
                        Describe your dream trip in plain English — your{' '}
                        <span className="font-semibold text-indigo-300">AI travel scout</span>{' '}
                        will find the perfect match from our curated Sri Lanka experiences.
                    </p>

                    {/* ────── Search Card ────── */}
                    <div className="mx-auto max-w-2xl rounded-2xl border border-white/8 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
                        <label htmlFor="travel-prompt" className="mb-2 block text-left text-sm font-medium text-slate-300">
                            ✈️ What kind of trip are you looking for?
                        </label>

                        <textarea
                            id="travel-prompt"
                            ref={inputRef}
                            rows={3}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="e.g. a chilled beach weekend under $100..."
                            disabled={loading}
                            maxLength={MAX_PROMPT_LENGTH}
                            className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500/70 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
                        />
                        {/* Character counter */}
                        <p className={`mt-1 text-right text-[10px] tabular-nums transition-colors ${prompt.length > MAX_PROMPT_LENGTH * 0.9
                                ? 'text-amber-400'
                                : 'text-slate-600'
                            }`}>
                            {prompt.length} / {MAX_PROMPT_LENGTH}
                        </p>

                        {/* Example prompts */}
                        <div className="mt-3 flex flex-wrap gap-2">
                            <span className="text-xs text-slate-500 self-center">Try:</span>
                            {EXAMPLE_PROMPTS.map((ex) => (
                                <button
                                    key={ex}
                                    onClick={() => handleExampleClick(ex)}
                                    disabled={loading}
                                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400 transition hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-indigo-300 disabled:opacity-40"
                                >
                                    {ex}
                                </button>
                            ))}
                        </div>

                        {/* Submit button */}
                        <button
                            onClick={() => handleSearch()}
                            disabled={loading || !prompt.trim()}
                            className="mt-5 flex w-full items-center justify-center gap-3 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 hover:shadow-indigo-500/40 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <div className="spinner !w-5 !h-5" />
                                    <span>Scouting destinations…</span>
                                </>
                            ) : (
                                <>
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 6.15 6.15a7.5 7.5 0 0 0 10.5 10.5z" />
                                    </svg>
                                    Scout Destinations
                                </>
                            )}
                        </button>
                    </div>
                </section>

                {/* ────────────── ERROR STATE ────────────── */}
                {error && (
                    <div className="mx-auto mb-8 max-w-2xl rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300">
                        <span className="font-bold">⚠️ Error: </span>{error}
                    </div>
                )}

                {/* ────────────── LOADING SKELETON ────────────── */}
                {loading && (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="h-64 animate-pulse rounded-2xl border border-white/8 bg-white/4"
                                style={{ animationDelay: `${i * 0.1}s` }}
                            />
                        ))}
                    </div>
                )}

                {/* ────────────── NO RESULTS ────────────── */}
                {!loading && hasSearched && results !== null && results.length === 0 && (
                    <div className="mx-auto max-w-lg rounded-2xl border border-white/8 bg-white/5 p-10 text-center">
                        <div className="mb-4 text-5xl">🌏</div>
                        <h2 className="mb-2 text-xl font-bold text-slate-100">No matches found</h2>
                        <p className="text-sm text-slate-400">
                            No matches found. Try adjusting your budget or vibe!
                        </p>
                    </div>
                )}

                {/* ────────────── RESULTS GRID ────────────── */}
                {!loading && results && results.length > 0 && (
                    <>
                        <div className="mb-8 text-center">
                            <p className="text-sm text-slate-400">
                                Found{' '}
                                <span className="font-semibold text-indigo-300">{results.length}</span>{' '}
                                {results.length === 1 ? 'match' : 'matches'} for your request
                            </p>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {results.map((item, idx) => (
                                <article
                                    key={item.id}
                                    className="card-glow fade-in-up group relative flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-white/5 p-6 backdrop-blur-md transition-all duration-300 hover:border-indigo-500/40 hover:-translate-y-1"
                                    style={{ animationDelay: `${idx * 0.08}s` }}
                                >
                                    {/* Card top accent bar */}
                                    <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                                    {/* Location emoji + name */}
                                    <div className="mb-3 flex items-center gap-2">
                                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 text-lg">
                                            {LOCATION_EMOJI[item.location] ?? '📍'}
                                        </span>
                                        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                                            {item.location}
                                        </span>
                                    </div>

                                    {/* Title */}
                                    <h2 className="mb-1 text-lg font-bold leading-snug text-slate-100 group-hover:text-white transition-colors">
                                        {item.title}
                                    </h2>

                                    {/* Price */}
                                    <p className="mb-4 text-2xl font-black text-indigo-400">
                                        ${item.price}
                                        <span className="ml-1 text-sm font-normal text-slate-500">/ person</span>
                                    </p>

                                    {/* Tags */}
                                    <div className="mb-4 flex flex-wrap gap-1.5">
                                        {item.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TAG_COLORS[tag] ?? DEFAULT_TAG_COLOR}`}
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Divider */}
                                    <div className="my-auto border-t border-white/8 pt-4">
                                        {/* AI Reasoning */}
                                        <div className="flex gap-2">
                                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-[10px]">
                                                ✨
                                            </span>
                                            <p className="text-xs leading-relaxed text-slate-400 italic">
                                                {item.reason}
                                            </p>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* ── Footer ── */}
            <footer className="relative z-10 border-t border-white/6 py-8 text-center text-xs text-slate-600">
                Smart Travel Scout · Powered by Gemini 2.5 Flash · Sri Lanka Inventory Only
            </footer>
        </main>
    )
}
