

# Group Discussion Module — Build Plan

An AI-simulated panel discussion where you join a room with 3 distinct AI personas debating a topic. Each persona has its own voice, opinions, and speaking style. You contribute via voice or text; the AI panelists respond in character. At the end you get a lightweight AI summary of your performance.

## User flow

```text
Setup ──▶ Topic generation ──▶ Live discussion room ──▶ Wrap-up summary
  │            │                     │                       │
  pick      AI generates a        moderator opens,        AI summarizes
  category, fresh topic +         panelists debate,       your contributions
  difficulty, opening prompt      you jump in anytime     (no scoring)
  3 personas
```

## Screens

**1. Setup screen** (replaces current mock browser)
- Category dropdown: Technology, Business, Society, Ethics, Career, Current Affairs
- Difficulty: Beginner / Intermediate / Advanced
- Persona pack selector: "Balanced panel", "Debate-heavy", "Devil's advocate" (each preset picks 3 personas with names, roles, viewpoints, and assigned voices)
- "AI voices on/off" toggle (default on)
- Big "Generate topic & start" button

**2. Live discussion room**
- Top bar: topic title, elapsed timer, leave button
- Center: 4 avatar tiles in a row — Moderator + 3 Panelists + You
  - Active speaker tile gets a glowing ring + soundwave bars (reuses the visualizer we built for Interview)
  - Each panelist shows name + one-line role ("Tech Optimist", "Cautious Economist", etc.)
- Below avatars: live transcript feed (last 4-6 turns) with persona name + message, auto-scrolling
- Bottom controls (reuses Interview voice infra):
  - Mic button with soundwave ring
  - Live STT transcript pill
  - Auto-send countdown w/ Undo + "Send now"
  - Voice commands: "raise hand" (queue your turn), "send now", "undo last", "leave room"
  - "Raise hand" button — pauses panelists at next natural break so you get the floor
  - End discussion button

**3. Wrap-up screen**
- Single card: short AI summary paragraph of what you contributed, 2-3 strengths, 2-3 things to try next time
- "Start another" + "Back to dashboard" buttons
- No scoring, no persistence (per your choice)

## Technical implementation

**Edge functions** (new):

1. `discussion-topic` — POST `{ category, difficulty, personaPack }` → returns `{ topic, openingPrompt, personas: [{id, name, role, viewpoint, voiceHint}] }`. Single non-streaming Gemini call with structured output (tool calling).

2. `discussion-turn` — POST `{ topic, personas, history, nextSpeakerId }` → streams (SSE) the next speaker's message. System prompt instructs the AI to respond AS the named persona, staying in character, ~2-4 sentences, reacting to the last turn. Same SSE pattern as `interview-chat`. Handles 429/402.

3. `discussion-summary` — POST `{ topic, personas, history }` → returns `{ summary, strengths[], improvements[] }` via tool calling. Mirrors `interview-feedback`.

**Client (`src/pages/Discussion.tsx` — full rewrite):**
- State machine: `setup` → `live` → `summary`
- Turn orchestrator: a queue + timer that picks the next panelist (round-robin with light randomness, skipping recent speakers). When the user raises their hand or types/speaks, their turn is inserted next; the orchestrator pauses outgoing AI turns until the user submits.
- Reuses `useVoice` hook for STT and TTS
- Voice mapping: pick a different `SpeechSynthesisVoice` per persona by filtering `window.speechSynthesis.getVoices()` (e.g., male/female + locale variation). Falls back to default voice if browser voice list is small.
- Soundwave + auto-send + voice-command UI all extracted from the Interview page so both modules share the look.

**Sidebar:** Group Discussion link already exists at `/discussion` — no nav changes needed.

**Database:** None. Per your choice, sessions are not persisted.

## Files to add / change
- `supabase/functions/discussion-topic/index.ts` (new)
- `supabase/functions/discussion-turn/index.ts` (new)
- `supabase/functions/discussion-summary/index.ts` (new)
- `supabase/config.toml` (register the 3 functions)
- `src/pages/Discussion.tsx` (full rewrite)
- Optional: extract shared voice-control bar into `src/components/VoiceControlBar.tsx` if it keeps Discussion.tsx tidy

## Out of scope (can do later)
- Real multi-user rooms over WebRTC
- Scored feedback + history persistence
- Discussion analytics on the dashboard

