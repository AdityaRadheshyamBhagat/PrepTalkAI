import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { Mic, Users, BarChart3, Zap, ArrowRight, Star, CheckCircle } from "lucide-react";

const features = [
  { icon: Mic, title: "AI Mock Interviews", description: "Practice with AI-powered interviewers that adapt to your skill level and provide real-time feedback." },
  { icon: Users, title: "Group Discussions", description: "Join collaborative discussion rooms to sharpen your communication and critical thinking skills." },
  { icon: BarChart3, title: "Performance Analytics", description: "Track your progress with detailed analytics, scores, and personalized improvement plans." },
  { icon: Zap, title: "Instant Feedback", description: "Get immediate, actionable feedback on your responses to accelerate your preparation." },
];

const steps = [
  { step: "01", title: "Choose Your Practice", description: "Select from AI interviews or group discussions based on your goals." },
  { step: "02", title: "Practice & Engage", description: "Dive into realistic scenarios with adaptive AI or real peers." },
  { step: "03", title: "Review & Improve", description: "Get detailed feedback and track your progress over time." },
];

const testimonials = [
  { name: "Priya S.", role: "Software Engineer", quote: "PrepTalkAI helped me ace my Google interview. The AI feedback was incredibly accurate!", rating: 5 },
  { name: "Alex M.", role: "MBA Student", quote: "The group discussions feature is a game-changer. I improved my communication skills dramatically.", rating: 5 },
  { name: "Jordan T.", role: "Data Analyst", quote: "I went from nervous wreck to confident speaker in just 2 weeks of practice.", rating: 5 },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-10 animate-gradient-shift" style={{ backgroundSize: "200% 200%" }} />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
            🚀 AI-Powered Interview Preparation
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl mx-auto leading-tight">
            Master Your Interviews with{" "}
            <span className="gradient-text">AI Precision</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Practice mock interviews, join group discussions, and get instant AI feedback to land your dream role.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="gradient-primary border-0 text-lg px-8 h-12">
              <Link to="/signup">Start Practicing Free <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8 h-12">
              <Link to="/dashboard">View Demo</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Everything You Need to <span className="gradient-text">Succeed</span></h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">Comprehensive tools designed to transform your interview skills from good to exceptional.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="group hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1 border-border/50">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                    <f.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">How It <span className="gradient-text">Works</span></h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((s) => (
              <div key={s.step} className="text-center">
                <div className="text-5xl font-black gradient-text mb-4">{s.step}</div>
                <h3 className="font-semibold text-xl mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Loved by <span className="gradient-text">Students</span></h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t) => (
              <Card key={t.name} className="border-border/50">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 italic">"{t.quote}"</p>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">© 2026 PrepTalkAI. Built for students who aim higher.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
