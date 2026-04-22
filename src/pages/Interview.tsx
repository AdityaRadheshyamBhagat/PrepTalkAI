import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import DashboardLayout from "@/components/DashboardLayout";
import { Mic, MicOff, Send, Bot, User, CheckCircle, ArrowLeft, Loader2, Volume2, VolumeX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useVoice } from "@/hooks/useVoice";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

type Msg = { role: "user" | "assistant"; content: string };

interface InterviewConfig {
  type: string;
  difficulty: string;
  role: string;
}

interface Feedback {
  overall: number;
  categories: { name: string; score: number }[];
  tips: string[];
  summary?: string;
}

async function streamChat({
  messages,
  config,
  onDelta,
  onDone,
  onError,
}: {
  messages: Msg[];
  config: InterviewConfig;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
}) {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/interview-chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({ messages, config }),
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
      if (json === "[DONE]") { onDone(); return; }
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
}

const roleLabels: Record<string, string> = {
  frontend: "Frontend Developer",
  backend: "Backend Developer",
  fullstack: "Full Stack Developer",
  data: "Data Analyst",
};

const Interview = () => {
  const [phase, setPhase] = useState<"setup" | "interview" | "feedback">("setup");
  const [config, setConfig] = useState<InterviewConfig>({ type: "technical", difficulty: "intermediate", role: "frontend" });
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const sendFromVoiceRef = useRef<((text: string) => void) | null>(null);

  const voice = useVoice({
    onTranscript: (text: string) => {
      if (sendFromVoiceRef.current) {
        sendFromVoiceRef.current(text);
      }
    },
  });

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  }, []);

  // Start interview — get first AI question
  const startInterview = async () => {
    setPhase("interview");
    setMessages([]);
    setIsLoading(true);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [{ role: "assistant", content: assistantSoFar }];
      });
      scrollToBottom();
    };

    await streamChat({
      messages: [],
      config,
      onDelta: upsert,
      onDone: () => { setIsLoading(false); voice.speak(assistantSoFar); },
      onError: (err) => {
        setIsLoading(false);
        toast({ title: "Error", description: err, variant: "destructive" });
      },
    });
  };

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText || input).trim();
    if (!text || isLoading) return;
    if (!overrideText) setInput("");

    const userMsg: Msg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);
    scrollToBottom();

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
      scrollToBottom();
    };

    await streamChat({
      messages: newMessages,
      config,
      onDelta: upsert,
      onDone: () => { setIsLoading(false); voice.speak(assistantSoFar); },
      onError: (err) => {
        setIsLoading(false);
        toast({ title: "Error", description: err, variant: "destructive" });
      },
    });
  };

  // Wire voice transcript to sendMessage
  sendFromVoiceRef.current = (text: string) => sendMessage(text);

  const endInterview = async () => {
    voice.stopSpeaking();
    if (messages.length < 2) {
      setPhase("setup");
      return;
    }
    setFeedbackLoading(true);
    setPhase("feedback");

    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/interview-feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ messages, config }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({ error: "Failed" }));
        throw new Error(data.error || `Error ${resp.status}`);
      }

      const data = await resp.json();
      setFeedback(data);

      // Save session to database
      if (user) {
        await supabase.from("interview_sessions").insert({
          firebase_uid: user.uid,
          interview_type: config.type,
          difficulty: config.difficulty,
          role: config.role,
          messages: messages as any,
          overall_score: data.overall,
          categories: data.categories as any,
          tips: data.tips as any,
          summary: data.summary || null,
        });
      }
    } catch (err: any) {
      toast({ title: "Feedback Error", description: err.message, variant: "destructive" });
      setFeedback({
        overall: 0,
        categories: [],
        tips: ["Could not generate feedback. Please try again."],
      });
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (phase === "setup") {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">AI Interview Practice</h1>
          <p className="text-muted-foreground mb-8">Configure your mock interview session</p>
          <Card className="border-border/50">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Interview Type</label>
                <Select value={config.type} onValueChange={(v) => setConfig(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="behavioral">Behavioral</SelectItem>
                    <SelectItem value="hr">HR Round</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Difficulty</label>
                <Select value={config.difficulty} onValueChange={(v) => setConfig(p => ({ ...p, difficulty: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Topic / Role</label>
                <Select value={config.role} onValueChange={(v) => setConfig(p => ({ ...p, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="frontend">Frontend Developer</SelectItem>
                    <SelectItem value="backend">Backend Developer</SelectItem>
                    <SelectItem value="fullstack">Full Stack Developer</SelectItem>
                    <SelectItem value="data">Data Analyst</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Voice Mode</label>
                  <p className="text-xs text-muted-foreground">Speak answers & hear AI questions</p>
                </div>
                <Switch checked={voice.voiceEnabled} onCheckedChange={voice.setVoiceEnabled} />
              </div>
              <Button className="w-full gradient-primary border-0" onClick={startInterview}>
                <Mic className="mr-2 h-4 w-4" /> Start Interview
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (phase === "interview") {
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const questionNumber = messages.filter((m) => m.role === "assistant").length;

    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border/50 bg-card/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium">Live Interview</span>
            <span className="text-xs text-muted-foreground capitalize">
              {config.type} · {config.difficulty} · {roleLabels[config.role]}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Q{questionNumber}</span>
            <Button variant="destructive" size="sm" onClick={endInterview} disabled={isLoading}>
              End Interview
            </Button>
          </div>
        </div>

        {/* Main stage */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 overflow-y-auto">
          {/* AI Interviewer avatar */}
          <div className="flex flex-col items-center mb-8">
            <div className={`relative h-24 w-24 rounded-full gradient-primary flex items-center justify-center mb-4 transition-all duration-300 ${voice.isSpeaking ? "ring-4 ring-primary/40 scale-105" : ""} ${isLoading && !lastAssistant ? "animate-pulse" : ""}`}>
              <Bot className="h-12 w-12 text-primary-foreground" />
              {voice.isSpeaking && (
                <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1.5 shadow-lg">
                  <Volume2 className="h-3.5 w-3.5 text-primary-foreground animate-pulse" />
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-muted-foreground">AI Interviewer</span>
          </div>

          {/* Current question card */}
          <div className="w-full max-w-2xl">
            {lastAssistant ? (
              <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-lg mb-6">
                <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 text-base leading-relaxed">
                  <ReactMarkdown>{lastAssistant.content}</ReactMarkdown>
                </div>
              </div>
            ) : isLoading ? (
              <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-lg mb-6 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary mr-3" />
                <span className="text-muted-foreground">Preparing your question...</span>
              </div>
            ) : null}

            {/* User's last answer (subtle) */}
            {lastUser && (
              <div className="flex items-start gap-3 mb-6 opacity-60">
                <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <User className="h-3.5 w-3.5 text-secondary-foreground" />
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{lastUser.content}</p>
              </div>
            )}
          </div>

          {/* Previous Q&A collapsed */}
          {messages.length > 2 && (
            <button
              onClick={() => {
                const el = document.getElementById("interview-history");
                el?.classList.toggle("hidden");
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors mb-4 underline underline-offset-2"
            >
              View conversation history ({messages.length} messages)
            </button>
          )}
          <div id="interview-history" className="hidden w-full max-w-2xl max-h-60 overflow-y-auto space-y-3 mb-4 border border-border/30 rounded-xl p-4 bg-muted/30">
            {messages.slice(0, -2).map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${msg.role === "assistant" ? "gradient-primary" : "bg-secondary"}`}>
                  {msg.role === "assistant" ? <Bot className="h-3 w-3 text-primary-foreground" /> : <User className="h-3 w-3 text-secondary-foreground" />}
                </div>
                <div className={`max-w-[85%] rounded-xl p-2.5 text-xs ${msg.role === "assistant" ? "bg-secondary" : "bg-primary/10"}`}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom controls — voice-centric */}
        <div className="border-t border-border/50 bg-card/80 backdrop-blur-sm px-6 py-4">
          <div className="max-w-2xl mx-auto">
            {/* Speaking indicator */}
            {voice.isSpeaking && (
              <div className="flex items-center justify-center gap-2 mb-3 text-sm text-muted-foreground">
                <Volume2 className="h-4 w-4 animate-pulse text-primary" />
                <span>AI is speaking...</span>
                <Button variant="ghost" size="sm" onClick={voice.stopSpeaking} className="h-6 px-2">
                  <VolumeX className="h-3 w-3" />
                </Button>
              </div>
            )}

            <div className="flex items-end gap-3">
              {voice.voiceEnabled && (
                <div className="shrink-0 flex flex-col items-center gap-2">
                  <div className="relative h-12 w-12 flex items-center justify-center">
                    {voice.isListening && (
                      <>
                        <span className="absolute inset-0 rounded-full bg-destructive/20 animate-ping" />
                        <span className="absolute inset-0 rounded-full bg-destructive/15 animate-ping [animation-delay:300ms] [animation-duration:1.6s]" />
                        <span className="absolute -inset-1 rounded-full bg-destructive/10 animate-ping [animation-delay:600ms] [animation-duration:2s]" />
                        <div className="absolute -inset-3 flex items-center justify-around pointer-events-none">
                          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                            <span
                              key={i}
                              className="w-0.5 rounded-full bg-destructive/70 animate-soundwave"
                              style={{
                                animationDelay: `${i * 90}ms`,
                                animationDuration: `${700 + (i % 3) * 150}ms`,
                              }}
                            />
                          ))}
                        </div>
                      </>
                    )}
                    <Button
                      size="icon"
                      variant={voice.isListening ? "destructive" : "secondary"}
                      className={`relative z-10 h-12 w-12 rounded-full transition-all ${voice.isListening ? "ring-4 ring-destructive/40 shadow-lg shadow-destructive/30" : ""}`}
                      onClick={voice.toggleListening}
                      disabled={isLoading}
                    >
                      {voice.isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </Button>
                  </div>
                  {voice.isListening && (
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-destructive flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                      Listening
                    </span>
                  )}
                </div>
              )}
              <div className="flex-1 flex flex-col gap-2">
                {voice.voiceEnabled && voice.isListening && (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm min-h-[40px] flex items-center animate-fade-in">
                    {voice.transcript ? (
                      <span className="text-foreground leading-snug">
                        {voice.transcript}
                        <span className="inline-block w-0.5 h-4 ml-0.5 bg-destructive align-middle animate-pulse" />
                      </span>
                    ) : (
                      <span className="text-muted-foreground italic">Listening for your voice...</span>
                    )}
                  </div>
                )}
                <div className="flex items-end gap-3">
                  <Textarea
                    placeholder={voice.voiceEnabled ? "Speak or type your answer..." : "Type your answer..."}
                    className="resize-none rounded-xl min-h-[48px] flex-1"
                    rows={1}
                    value={voice.isListening ? voice.transcript : input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading || voice.isListening}
                  />
                  <Button
                    size="icon"
                    className="gradient-primary border-0 shrink-0 h-12 w-12 rounded-full"
                    onClick={() => sendMessage()}
                    disabled={isLoading || !input.trim()}
                  >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Feedback phase
  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" className="mb-4" onClick={() => { setPhase("setup"); setFeedback(null); setMessages([]); }}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Setup
        </Button>
        <h1 className="text-3xl font-bold mb-2">Interview Feedback</h1>
        <p className="text-muted-foreground mb-8">Here's how you performed</p>

        {feedbackLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Analyzing your interview performance...</p>
          </div>
        ) : feedback ? (
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Overall Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-black gradient-text text-center mb-4">{feedback.overall}%</div>
                {feedback.summary && (
                  <p className="text-sm text-muted-foreground text-center mb-4">{feedback.summary}</p>
                )}
                <div className="space-y-3">
                  {feedback.categories.map((c) => (
                    <div key={c.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{c.name}</span>
                        <span className="font-medium">{c.score}%</span>
                      </div>
                      <Progress value={c.score} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Improvement Tips</CardTitle>
                <CardDescription>Actionable suggestions for next time</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {feedback.tips.map((tip, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default Interview;
