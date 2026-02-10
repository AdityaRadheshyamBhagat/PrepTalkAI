import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import DashboardLayout from "@/components/DashboardLayout";
import { Mic, Send, Bot, User, CheckCircle, ArrowLeft } from "lucide-react";

const mockConversation = [
  { role: "ai", message: "Hello! I'll be your interviewer today. Let's start with a classic — can you tell me about yourself and why you're interested in this role?" },
  { role: "user", message: "Hi! I'm a software engineering student passionate about building scalable web applications. I've worked on several React projects and I'm excited about this role because it aligns with my interest in frontend development and user experience." },
  { role: "ai", message: "Great introduction! Now, can you explain the difference between React's useEffect and useLayoutEffect hooks? When would you choose one over the other?" },
];

const mockFeedback = {
  overall: 85,
  categories: [
    { name: "Communication", score: 88 },
    { name: "Technical Knowledge", score: 82 },
    { name: "Problem Solving", score: 85 },
    { name: "Confidence", score: 84 },
  ],
  tips: [
    "Use more specific examples from your projects",
    "Structure answers using the STAR method",
    "Take a brief pause before answering complex questions",
  ],
};

const Interview = () => {
  const [phase, setPhase] = useState<"setup" | "interview" | "feedback">("setup");

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
                <Select defaultValue="technical">
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
                <Select defaultValue="intermediate">
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
                <Select defaultValue="frontend">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="frontend">Frontend Developer</SelectItem>
                    <SelectItem value="backend">Backend Developer</SelectItem>
                    <SelectItem value="fullstack">Full Stack Developer</SelectItem>
                    <SelectItem value="data">Data Analyst</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full gradient-primary border-0" onClick={() => setPhase("interview")}>
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
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Mock Interview</h1>
              <p className="text-sm text-muted-foreground">Technical • Intermediate • Frontend Developer</p>
            </div>
            <Button variant="outline" onClick={() => setPhase("feedback")}>End Interview</Button>
          </div>
          <div className="space-y-4 mb-6">
            {mockConversation.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "ai" ? "gradient-primary" : "bg-secondary"}`}>
                  {msg.role === "ai" ? <Bot className="h-4 w-4 text-primary-foreground" /> : <User className="h-4 w-4 text-secondary-foreground" />}
                </div>
                <div className={`max-w-[80%] rounded-2xl p-4 text-sm ${msg.role === "ai" ? "bg-secondary text-secondary-foreground" : "gradient-primary text-primary-foreground"}`}>
                  {msg.message}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Textarea placeholder="Type your response..." className="resize-none" rows={2} />
            <Button size="icon" className="gradient-primary border-0 shrink-0 h-auto">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" className="mb-4" onClick={() => setPhase("setup")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Setup
        </Button>
        <h1 className="text-3xl font-bold mb-2">Interview Feedback</h1>
        <p className="text-muted-foreground mb-8">Here's how you performed</p>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Overall Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-black gradient-text text-center mb-4">{mockFeedback.overall}%</div>
              <div className="space-y-3">
                {mockFeedback.categories.map((c) => (
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
                {mockFeedback.tips.map((tip, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Interview;
