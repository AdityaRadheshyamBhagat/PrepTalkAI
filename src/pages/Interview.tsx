import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import DashboardLayout from "@/components/DashboardLayout";
import { Mic, Send, Bot, User, CheckCircle, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
      onDone: () => setIsLoading(false),
      onError: (err) => {
        setIsLoading(false);
        toast({ title: "Error", description: err, variant: "destructive" });
      },
    });
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");

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
      onDone: () => setIsLoading(false),
      onError: (err) => {
        setIsLoading(false);
        toast({ title: "Error", description: err, variant: "destructive" });
      },
    });
  };

  const endInterview = async () => {
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
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Mock Interview</h1>
              <p className="text-sm text-muted-foreground capitalize">
                {config.type} • {config.difficulty} • {roleLabels[config.role]}
              </p>
            </div>
            <Button variant="outline" onClick={endInterview} disabled={isLoading}>
              End Interview
            </Button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "assistant" ? "gradient-primary" : "bg-secondary"}`}>
                  {msg.role === "assistant" ? <Bot className="h-4 w-4 text-primary-foreground" /> : <User className="h-4 w-4 text-secondary-foreground" />}
                </div>
                <div className={`max-w-[80%] rounded-2xl p-4 text-sm ${msg.role === "assistant" ? "bg-secondary text-secondary-foreground" : "gradient-primary text-primary-foreground"}`}>
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 gradient-primary">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="bg-secondary rounded-2xl p-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Textarea
              placeholder="Type your response..."
              className="resize-none"
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <Button
              size="icon"
              className="gradient-primary border-0 shrink-0 h-auto"
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </DashboardLayout>
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
