## Goal
Replace the browser's robotic Web Speech TTS with ElevenLabs' human-like voices for both the AI Interview and Group Discussion modules, so each AI panelist / interviewer sounds natural and distinct.

## Approach

Use the ElevenLabs connector (gateway-enabled, no manual API key handling). When you approve, you'll be prompted to link your ElevenLabs account in one click — no copy/pasting keys.

```text
Browser ──▶ Edge function `tts-speak` ──▶ ElevenLabs gateway ──▶ MP3 audio ──▶ HTMLAudioElement
```

## What changes

### 1. New edge function: `supabase/functions/tts-speak/index.ts`
- Input: `{ text, voiceId, modelId? }`
- Streams MP3 from `https://api.elevenlabs.io/v1/text-to-speech/{voiceId}/stream?output_format=mp3_44100_128` via the connector gateway
- Uses `eleven_turbo_v2_5` model (low latency, good for back-and-forth speech)
- Returns raw `audio/mpeg` bytes (streaming) so playback can start fast
- Validates input with Zod, returns proper CORS headers

### 2. New client hook: `src/hooks/useElevenLabsVoice.ts`
- `speak(text, voiceId, { onDone, onStart })` — fetches the edge function, plays MP3 via `new Audio(URL.createObjectURL(blob))`
- `cancel()` — pauses + revokes current audio (used when user raises hand / interrupts)
- `isSpeaking` state
- Maintains a single active `Audio` element so only one voice plays at a time
- Falls back gracefully if the edge function errors (toast + no audio)

### 3. Voice mapping
Pre-pick 5 distinct ElevenLabs voice IDs from the recommended list and map them by role:

| Role | Voice | ID |
|---|---|---|
| Interview AI | George (warm male interviewer) | `JBFqnCBsd6RMkjVDRZzb` |
| Moderator | Sarah (clear female host) | `EXAVITQu4vr4xnSDxMaL` |
| Panelist `male-1` | Brian | `nPczCjzI2devNBz1zQrb` |
| Panelist `male-2` | Liam | `TX3LPaxmHKxFdv7VOQHJ` |
| Panelist `female-1` | Laura | `FGY2WhTYpPnrIDTdsKH5` |
| Panelist `female-2` | Matilda | `XrExE9yKIg1WjnnlVkGX` |

Each persona's existing `voiceHint` already maps to one of these slots — no AI prompt changes needed.

### 4. Wire into existing pages
- **`src/pages/Discussion.tsx`** — replace `speakAsPersona` (Web Speech) with `useElevenLabsVoice().speak(text, voiceIdFor(persona), { onDone })`. Keep the existing turn-gating (next speaker waits for `onDone`) and "raise hand" interrupt (calls `cancel()`).
- **`src/pages/Interview.tsx`** — replace `useVoice().speak` calls for the interviewer's text with the ElevenLabs hook (Interview voice ID).
- Keep `useVoice` for **STT only** (mic input). The browser's SpeechRecognition stays — only TTS is replaced.

### 5. UI
- "AI voices" toggle keeps working; when off, skip the edge function call.
- Add a small "Powered by ElevenLabs" line in the voice settings area.
- Show a subtle loading state on the active speaker tile while the first audio chunk is fetched (~300-600 ms).

## Files

**New**
- `supabase/functions/tts-speak/index.ts`
- `src/hooks/useElevenLabsVoice.ts`
- `src/lib/voiceMap.ts` (the voice-id table)

**Edited**
- `src/pages/Discussion.tsx` (swap TTS, keep turn lock)
- `src/pages/Interview.tsx` (swap TTS for interviewer lines)

## Setup step (once)
On approval, the connector tool prompts you to link ElevenLabs. After that the gateway secret `ELEVENLABS_API_KEY` is auto-injected into edge functions — nothing for you to paste.

## Out of scope
- Streaming WebSocket TTS (low-latency duplex) — overkill for this turn-based flow
- Voice cloning / custom voices
- Server-side audio caching (can add later if quota becomes a concern)
