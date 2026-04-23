import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import DashboardLayout from "@/components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Send,
  Hand,
  Loader2,
  Volume2,
  VolumeX,
  ArrowLeft,
  Sparkles,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useVoice } from "@/hooks/useVoice";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
interface Persona {
  id: string;
  name: string;
  role: string;
  viewpoint: string;
  voiceHint: "male-1" | "male-2" | "female-1" | "female-2";
}

interface Turn {
  speakerId: string; // persona id | "moderator" | "user"
  speakerName: string;
  text: string;
}

interface Summary {
  summary: string;
  strengths: string[];
  improvements: string[];
}

type Phase = "setup" | "live" | "summary";

const CATEGORIES = ["Technology", "Business", "Society", "Ethics", "Career", "Current Affairs"];
const DIFFICULTIES = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];
const PERSONA_PACKS = [
  { value: "balanced", label: "Balanced panel", desc: "Complementary viewpoints, civil tone" },
  { value: "debate-heavy", label: "Debate-heavy", desc: "Strong opposing views, sharp exchanges" },
  { value: "devils-advocate", label: "Devil's advocate", desc: "Expect pushback on every claim" },
];

const AUTO_SEND_MS = 4000;

// ─────────────────────────────────────────────────────────
// Voice mapping
// ─────────────────────────────────────────────────────────
function pickVoicesForHints(): Record<Persona["voiceHint"], SpeechSynthesisVoice | null> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return { "male-1": null, "male-2": null, "female-1": null, "female-2": null };
  }
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"));
  const male = voices.filter((v) => /male|david|alex|fred|daniel|google uk english male/i.test(v.name) && !/female/i.test(v.name));
  const female = voices.filter((v) => /female|samantha|victoria|karen|susan|zira|google uk english female/i.test(v.name));
  const fallback = voices[0] || null;
  return {
    "male-1": male[0] || voices[1] || fallback,
    "male-2": male[1] || male[0] || voices[2] || fallback,
    "female-1": female[0] || voices[0] || fallback,
    "female-2": female[1] || female[0] || voices[3] || fallback,
  };
}

// ─────────────────────────────────────────────────────────
// Streaming helper (same SSE pattern as Interview)
// ─────────────────────────────────────────────────────────
async function streamTurn({
  topic,
  personas,
  history,
  nextSpeakerId,
  openingPrompt,
  onDelta,
  onDone,
  onError,
  signal,
}: {
  topic: string;
  personas: Persona[];
  history: Turn[];
  nextSpeakerId: string;
  openingPrompt?: string;
  onDelta: (t: string) => void;
  onDone: () => void;
  onError: (e: string) => void;
  signal?: AbortSignal;
}) {
  try {
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/discussion-turn`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_KEY}` },
      body: JSON.stringify({ topic, personas, history, nextSpeakerId, openingPrompt }),
      signal,
    });

    if (!resp.ok) {
      const data = await resp.json().catch(() => ({ error: "Request failed" }));
      onError(data.error || `Error ${resp.status}`);
      return;
    }
    if (!resp.body) {
      onError("No response body");
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let idx: number;
      while ((idx = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;
        const json = line.slice(6).trim();
        if (json === "[DONE]") {
          onDone();
          return;
        }
        try {
          const parsed = JSON.parse(json);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch {
          buffer = line + "\n" + buffer;
          break;
        }
      }
    }
    onDone();
  } catch (e: any) {
    if (e?.name === "AbortError") return;
    onError(e?.message || "Unknown error");
  }
}

// ─────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────
const Discussion = () => {
  const { toast } = useToast();
  const [phase, setPhase] = useState<Phase>("setup");

  // setup
  const [category, setCategory] = useState("Technology");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [personaPack, setPersonaPack] = useState("balanced");
  const [voicesOn, setVoicesOn] = useState(true);
  const [generating, setGenerating] = useState(false);

  // live
  const [topic, setTopic] = useState("");
  const [openingPrompt, setOpeningPrompt] = useState("");
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [history, setHistory] = useState<Turn[]>([]);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [nextQueue, setNextQueue] = useState<string[]>([]); // forced upcoming speakers (e.g. moderator first)
  const [userQueued, setUserQueued] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);

  // summary
  const [summary, setSummary] = useState<Summary | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  // refs
  const abortRef = useRef<AbortController | null>(null);
  const turnLoopActiveRef = useRef(false);
  const transcriptScrollRef = useRef<HTMLDivElement | null>(null);
  const voiceMapRef = useRef<Record<Persona["voiceHint"], SpeechSynthesisVoice | null> | null>(null);
  const lastUserSubmitRef = useRef<number>(0);

  // auto-send (mirrors Interview)
  const [pendingAutoSend, setPendingAutoSend] = useState<string | null>(null);
  const [autoSendRemainingMs, setAutoSendRemainingMs] = useState(0);
  const autoSendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSendTickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Voice hook ────────────────────────────────────────
  const {
    isListening,
    isSpeaking,
    transcript,
    voiceEnabled,
    setVoiceEnabled,
    speak,
    stopSpeaking,
    toggleListening,
    supportsRecognition,
    supportsSynthesis,
  } = useVoice({
    silenceTimeoutMs: 1800,
    onTranscript: (text) => handleVoiceTranscript(text),
  });

  // Keep voiceEnabled in sync with voicesOn after start
  useEffect(() => {
    setVoiceEnabled(voicesOn);
  }, [voicesOn, setVoiceEnabled]);

  // Load voices once
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const update = () => {
      voiceMapRef.current = pickVoicesForHints();
    };
    update();
    window.speechSynthesis.onvoiceschanged = update;
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Elapsed timer
  useEffect(() => {
    if (phase !== "live") return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, [history, activeSpeakerId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelPendingAutoSend();
      abortRef.current?.abort();
      if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Helpers ───────────────────────────────────────────
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const cancelPendingAutoSend = useCallback(() => {
    if (autoSendTimerRef.current) clearTimeout(autoSendTimerRef.current);
    if (autoSendTickerRef.current) clearInterval(autoSendTickerRef.current);
    autoSendTimerRef.current = null;
    autoSendTickerRef.current = null;
    setPendingAutoSend(null);
    setAutoSendRemainingMs(0);
  }, []);

  const speakAsPersona = useCallback(
    (text: string, persona: Persona | undefined, onDone?: () => void) => {
      const clean = text.replace(/[*_~`#>]/g, "").trim();
      if (!voicesOn || !supportsSynthesis || !clean) {
        onDone?.();
        return;
      }
      const voice = persona && voiceMapRef.current ? voiceMapRef.current[persona.voiceHint] : null;
      const u = new SpeechSynthesisUtterance(clean);
      if (voice) u.voice = voice;
      u.rate = 1.05;
      u.pitch = persona?.voiceHint.startsWith("female") ? 1.1 : 0.95;
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        onDone?.();
      };
      u.onend = finish;
      u.onerror = finish;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    },
    [voicesOn, supportsSynthesis],
  );

  // ── Setup → start ─────────────────────────────────────
  const startDiscussion = async () => {
    setGenerating(true);
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/discussion-topic`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({ category, difficulty, personaPack }),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({ error: "Failed" }));
        toast({ title: "Could not start discussion", description: data.error, variant: "destructive" });
        return;
      }
      const data = (await resp.json()) as {
        topic: string;
        openingPrompt: string;
        personas: Persona[];
      };
      setTopic(data.topic);
      setOpeningPrompt(data.openingPrompt);
      setPersonas(data.personas);
      setHistory([]);
      setElapsed(0);
      setNextQueue(["moderator", ...data.personas.map((p) => p.id)]);
      setVoiceEnabled(voicesOn);
      setPhase("live");
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Unknown", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  // ── Turn orchestrator ─────────────────────────────────
  const pickNextSpeaker = useCallback((): string | null => {
    if (nextQueue.length > 0) return nextQueue[0];
    if (personas.length === 0) return null;
    // Round-robin with light randomness, skip last 1 speaker
    const recent = history.slice(-1).map((t) => t.speakerId);
    const candidates = personas.map((p) => p.id).filter((id) => !recent.includes(id));
    const pool = candidates.length > 0 ? candidates : personas.map((p) => p.id);
    return pool[Math.floor(Math.random() * pool.length)];
  }, [nextQueue, personas, history]);

  // Drive AI turns
  useEffect(() => {
    if (phase !== "live") return;
    if (paused) return;
    if (userQueued) return;
    if (turnLoopActiveRef.current) return;
    if (activeSpeakerId) return;

    const next = pickNextSpeaker();
    if (!next) return;

    const persona = personas.find((p) => p.id === next);
    const speakerName = next === "moderator" ? "Moderator" : persona?.name || next;
    let acc = "";
    turnLoopActiveRef.current = true;
    setActiveSpeakerId(next);
    abortRef.current = new AbortController();

    streamTurn({
      topic,
      personas,
      history,
      nextSpeakerId: next,
      openingPrompt: history.length === 0 ? openingPrompt : undefined,
      signal: abortRef.current.signal,
      onDelta: (chunk) => {
        acc += chunk;
      },
      onError: (err) => {
        toast({ title: "Turn failed", description: err, variant: "destructive" });
        turnLoopActiveRef.current = false;
        setActiveSpeakerId(null);
        // remove from forced queue if applicable
        setNextQueue((q) => (q[0] === next ? q.slice(1) : q));
      },
      onDone: () => {
        const finalText = acc.trim();
        const release = () => {
          setNextQueue((q) => (q[0] === next ? q.slice(1) : q));
          // small natural delay before next speaker
          setTimeout(() => {
            turnLoopActiveRef.current = false;
            setActiveSpeakerId(null);
          }, 600);
        };
        if (finalText) {
          setHistory((h) => [...h, { speakerId: next, speakerName, text: finalText }]);
          // Wait for this speaker to finish talking before releasing the floor
          if (voicesOn && supportsSynthesis) {
            speakAsPersona(finalText, persona, release);
          } else {
            release();
          }
        } else {
          release();
        }
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, paused, userQueued, activeSpeakerId, history, personas, topic, openingPrompt]);

  // ── User actions ──────────────────────────────────────
  const raiseHand = () => {
    if (userQueued) return;
    setUserQueued(true);
    setPaused(true);
    abortRef.current?.abort();
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
    toast({ title: "You have the floor", description: "Speak or type your contribution." });
  };

  const submitUserContribution = (text: string) => {
    const finalText = text.trim();
    if (!finalText) return;
    cancelPendingAutoSend();
    setHistory((h) => [...h, { speakerId: "user", speakerName: "You", text: finalText }]);
    setUserQueued(false);
    setPaused(false);
    lastUserSubmitRef.current = Date.now();
  };

  const handleVoiceTranscript = (text: string) => {
    const lower = text.toLowerCase().trim();
    // Voice commands
    if (/\b(undo|undo last|cancel)\b/.test(lower) && pendingAutoSend) {
      cancelPendingAutoSend();
      toast({ title: "Auto-send cancelled" });
      return;
    }
    if (/\b(send now|send it)\b/.test(lower) && pendingAutoSend) {
      const t = pendingAutoSend;
      cancelPendingAutoSend();
      submitUserContribution(t);
      return;
    }
    if (/\b(raise hand|let me speak|my turn)\b/.test(lower)) {
      raiseHand();
      return;
    }
    if (/\b(leave room|leave discussion|end discussion)\b/.test(lower)) {
      endDiscussion();
      return;
    }
    // Otherwise treat as contribution → queue auto-send
    if (!userQueued) raiseHand();
    queueAutoSend(text);
  };

  const queueAutoSend = (text: string) => {
    cancelPendingAutoSend();
    setPendingAutoSend(text);
    setAutoSendRemainingMs(AUTO_SEND_MS);
    const startedAt = Date.now();
    autoSendTickerRef.current = setInterval(() => {
      const remaining = Math.max(0, AUTO_SEND_MS - (Date.now() - startedAt));
      setAutoSendRemainingMs(remaining);
    }, 60);
    autoSendTimerRef.current = setTimeout(() => {
      submitUserContribution(text);
    }, AUTO_SEND_MS);
  };

  const endDiscussion = async () => {
    abortRef.current?.abort();
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
    cancelPendingAutoSend();
    setPaused(true);
    setGeneratingSummary(true);
    setPhase("summary");
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/discussion-summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({ topic, history }),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({ error: "Failed" }));
        toast({ title: "Summary failed", description: data.error, variant: "destructive" });
        setSummary({
          summary: "Could not generate summary.",
          strengths: [],
          improvements: [],
        });
        return;
      }
      const data = (await resp.json()) as Summary;
      setSummary(data);
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Unknown", variant: "destructive" });
    } finally {
      setGeneratingSummary(false);
    }
  };

  const resetToSetup = () => {
    setPhase("setup");
    setTopic("");
    setOpeningPrompt("");
    setPersonas([]);
    setHistory([]);
    setSummary(null);
    setActiveSpeakerId(null);
    setNextQueue([]);
    setUserQueued(false);
    setPaused(false);
    setElapsed(0);
    cancelPendingAutoSend();
  };

  // ─────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────
  if (phase === "setup") return renderSetup();
  if (phase === "summary") return renderSummary();
  return renderLive();

  // ── Setup ──────────────────────────────────────────────
  function renderSetup() {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold mb-2">Group Discussion</h1>
            <p className="text-muted-foreground mb-8">
              Join an AI-simulated panel of 3 experts and practice your communication skills.
            </p>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" /> Configure your discussion
                </CardTitle>
                <CardDescription>
                  AI generates a fresh topic and panel based on your settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DIFFICULTIES.map((d) => (
                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Persona pack</Label>
                  <div className="grid gap-2">
                    {PERSONA_PACKS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setPersonaPack(p.value)}
                        className={`text-left rounded-lg border px-4 py-3 transition-colors ${
                          personaPack === p.value
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="font-medium">{p.label}</div>
                        <div className="text-xs text-muted-foreground">{p.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3">
                  <div>
                    <Label className="text-base">AI voices</Label>
                    <p className="text-xs text-muted-foreground">
                      Each panelist speaks with a distinct voice.
                    </p>
                  </div>
                  <Switch
                    checked={voicesOn}
                    onCheckedChange={setVoicesOn}
                    disabled={!supportsSynthesis}
                  />
                </div>

                <Button
                  className="w-full gradient-primary border-0"
                  size="lg"
                  onClick={startDiscussion}
                  disabled={generating}
                >
                  {generating ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating panel…</>
                  ) : (
                    <><Sparkles className="mr-2 h-4 w-4" /> Generate topic & start</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Live ──────────────────────────────────────────────
  function renderLive() {
    const tiles = [
      { id: "moderator", name: "Moderator", role: "Host" },
      ...personas.map((p) => ({ id: p.id, name: p.name, role: p.role })),
      { id: "user", name: "You", role: userQueued ? "Floor is yours" : "Listening" },
    ];

    const recentHistory = history.slice(-8);

    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto">
          {/* Top bar */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex-1 min-w-0">
              <Badge className="mb-2 gradient-primary border-0">Live discussion</Badge>
              <h1 className="text-xl md:text-2xl font-bold leading-tight truncate">{topic}</h1>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" /> {formatTime(elapsed)}
              </div>
              <Button variant="ghost" size="sm" onClick={endDiscussion}>
                <ArrowLeft className="mr-1 h-4 w-4" /> End
              </Button>
            </div>
          </div>

          {/* Avatar tiles */}
          <Card className="border-border/50 mb-4">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {tiles.map((t) => {
                  const isActive = activeSpeakerId === t.id;
                  const isUser = t.id === "user";
                  const initials = t.name
                    .split(" ")
                    .map((s) => s[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();
                  return (
                    <motion.div
                      key={t.id}
                      className="text-center"
                      animate={{ scale: isActive ? 1.05 : 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <div className="relative inline-block">
                        <Avatar
                          className={`h-16 w-16 mx-auto ${
                            isActive
                              ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                              : ""
                          }`}
                        >
                          <AvatarFallback
                            className={
                              isActive
                                ? "gradient-primary text-primary-foreground"
                                : isUser && userQueued
                                ? "bg-primary/20 text-primary"
                                : "bg-secondary text-secondary-foreground"
                            }
                          >
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        {isActive && (
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                            {[0, 1, 2].map((i) => (
                              <motion.span
                                key={i}
                                className="block w-1 bg-primary rounded-full"
                                animate={{ height: [4, 12, 4] }}
                                transition={{
                                  duration: 0.6,
                                  repeat: Infinity,
                                  delay: i * 0.15,
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-medium mt-3 truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{t.role}</p>
                      {isActive && (
                        <Badge variant="secondary" className="text-[10px] mt-1">
                          Speaking
                        </Badge>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Transcript */}
          <Card className="border-border/50 mb-4">
            <CardContent className="p-0">
              <ScrollArea className="h-[280px]">
                <div ref={transcriptScrollRef} className="p-6 space-y-4">
                  {recentHistory.length === 0 && (
                    <p className="text-sm text-muted-foreground italic text-center py-8">
                      Discussion is starting…
                    </p>
                  )}
                  <AnimatePresence initial={false}>
                    {recentHistory.map((t, i) => {
                      const isUser = t.speakerId === "user";
                      return (
                        <motion.div
                          key={`${i}-${t.speakerId}`}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
                        >
                          <div className={`flex-1 ${isUser ? "text-right" : ""}`}>
                            <div className="text-xs font-medium text-primary mb-1">
                              {t.speakerName}
                            </div>
                            <div
                              className={`inline-block max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                                isUser
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-secondary text-secondary-foreground"
                              }`}
                            >
                              {t.text}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Controls */}
          <Card className="border-border/50">
            <CardContent className="p-4 space-y-3">
              {/* Live STT pill + auto-send */}
              {(isListening || transcript || pendingAutoSend) && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
                  {isListening && transcript && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                      <span className="italic truncate">{transcript}</span>
                    </div>
                  )}
                  {pendingAutoSend && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-foreground">"{pendingAutoSend}"</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          Sending in {(autoSendRemainingMs / 1000).toFixed(1)}s
                        </span>
                      </div>
                      <Progress value={(autoSendRemainingMs / AUTO_SEND_MS) * 100} className="h-1" />
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground">
                          Say "undo last" to cancel or "send now" to send immediately.
                        </p>
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelPendingAutoSend}
                          >
                            Undo
                          </Button>
                          <Button
                            size="sm"
                            className="gradient-primary border-0"
                            onClick={() => {
                              const t = pendingAutoSend;
                              cancelPendingAutoSend();
                              if (t) submitUserContribution(t);
                            }}
                          >
                            Send now
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={raiseHand}
                    disabled={userQueued}
                    variant={userQueued ? "secondary" : "default"}
                    className={userQueued ? "" : "gradient-primary border-0"}
                  >
                    <Hand className="mr-2 h-4 w-4" />
                    {userQueued ? "Floor is yours" : "Raise hand"}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleListening}
                    disabled={!supportsRecognition}
                    title={supportsRecognition ? "Toggle microphone" : "Voice not supported"}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const next = !voicesOn;
                      setVoicesOn(next);
                      if (!next) stopSpeaking();
                    }}
                    disabled={!supportsSynthesis}
                    title="Toggle AI voices"
                  >
                    {voicesOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  {isSpeaking && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Volume2 className="h-3 w-3" /> Panelist speaking
                    </span>
                  )}
                  <Button variant="destructive" size="sm" onClick={endDiscussion}>
                    End discussion
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Voice commands: <span className="font-medium">"raise hand"</span>,{" "}
                <span className="font-medium">"send now"</span>,{" "}
                <span className="font-medium">"undo last"</span>,{" "}
                <span className="font-medium">"leave room"</span>.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // ── Summary ───────────────────────────────────────────
  function renderSummary() {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/50">
              <CardHeader className="text-center">
                <Badge className="mx-auto mb-2 gradient-primary border-0">Wrap-up</Badge>
                <CardTitle className="text-2xl">Discussion summary</CardTitle>
                <CardDescription className="line-clamp-2">{topic}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {generatingSummary ? (
                  <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span>Reviewing your contributions…</span>
                  </div>
                ) : summary ? (
                  <>
                    <p className="text-sm leading-relaxed">{summary.summary}</p>

                    {summary.strengths.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" /> Strengths
                        </h3>
                        <ul className="space-y-1.5">
                          {summary.strengths.map((s, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex gap-2">
                              <span className="text-primary mt-0.5">•</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {summary.improvements.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-primary" /> Try next time
                        </h3>
                        <ul className="space-y-1.5">
                          {summary.improvements.map((s, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex gap-2">
                              <span className="text-primary mt-0.5">•</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : null}

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button className="flex-1 gradient-primary border-0" onClick={resetToSetup}>
                    <Sparkles className="mr-2 h-4 w-4" /> Start another
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => (window.location.href = "/dashboard")}
                  >
                    Back to dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }
};

export default Discussion;
