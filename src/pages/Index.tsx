import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import FloatingLines from "@/components/FloatingLines";
import {
  MotionCard,
  MotionButton,
  MotionStagger,
  MotionItem,
} from "@/components/MotionElements";
import { Mic, Users, BarChart3, Zap, ArrowRight, Star, Check } from "lucide-react";
import { motion } from "framer-motion";
import featureAiInterview from "@/assets/feature-ai-interview.png";
import featureGroupDiscussion from "@/assets/feature-group-discussion.png";
import featureAnalytics from "@/assets/feature-analytics.png";
import featureFeedback from "@/assets/feature-feedback.png";
import howItWorksImg from "@/assets/how-it-works.png";

const featureImages = [
  featureAiInterview,
  featureGroupDiscussion,
  featureAnalytics,
  featureFeedback,
];

const features = [
  {
    icon: Mic,
    title: "AI Mock Interviews",
    description:
      "Practice with AI-powered interviewers that adapt to your skill level and provide real-time feedback.",
  },
  {
    icon: Users,
    title: "Group Discussions",
    description:
      "Join collaborative discussion rooms to sharpen your communication and critical thinking skills.",
  },
  {
    icon: BarChart3,
    title: "Performance Analytics",
    description:
      "Track your progress with detailed analytics, scores, and personalized improvement plans.",
  },
  {
    icon: Zap,
    title: "Instant Feedback",
    description:
      "Get immediate, actionable feedback on your responses to accelerate your preparation.",
  },
];

const steps = [
  {
    step: "01",
    title: "Choose Your Practice",
    description:
      "Select from AI interviews or group discussions based on your goals.",
    icon: "🎯",
  },
  {
    step: "02",
    title: "Practice & Engage",
    description:
      "Dive into realistic scenarios with adaptive AI or real peers.",
    icon: "🚀",
  },
  {
    step: "03",
    title: "Review & Improve",
    description: "Get detailed feedback and track your progress over time.",
    icon: "📈",
  },
];

const testimonials = [
  {
    name: "Priya S.",
    role: "Software Engineer",
    quote:
      "PrepTalkAI helped me ace my Google interview. The AI feedback was incredibly accurate!",
    rating: 5,
  },
  {
    name: "Alex M.",
    role: "MBA Student",
    quote:
      "The group discussions feature is a game-changer. I improved my communication skills dramatically.",
    rating: 5,
  },
  {
    name: "Jordan T.",
    role: "Data Analyst",
    quote:
      "I went from nervous wreck to confident speaker in just 2 weeks of practice.",
    rating: 5,
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero with FloatingLines */}
      <section className="relative pt-32 pb-20 overflow-hidden min-h-[90vh] flex items-center">
        <div className="absolute inset-0">
          <FloatingLines
            linesGradient={["#7c3aed", "#a855f7", "#6366f1", "#d946ef"]}
            lineCount={[8, 6, 5]}
            lineDistance={[4, 5, 6]}
            animationSpeed={0.8}
            bendRadius={5}
            bendStrength={-0.5}
            interactive={true}
            parallax={true}
            parallaxStrength={0.15}
          />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium backdrop-blur-sm">
                  🚀 AI-Powered Interview Preparation
                </div>
              </motion.div>
              <motion.h1
                className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                Master Your Interviews with{" "}
                <span className="gradient-text">AI Precision</span>
              </motion.h1>
              <motion.p
                className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
              >
                Practice mock interviews, join group discussions, and get
                instant AI feedback to land your dream role.
              </motion.p>
              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <MotionButton>
                  <Button
                    size="lg"
                    asChild
                    className="gradient-primary border-0 text-lg px-8 h-12"
                  >
                    <Link to="/signup">
                      Start Practicing Free{" "}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </MotionButton>
                <MotionButton>
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="text-lg px-8 h-12 backdrop-blur-sm"
                  >
                    <Link to="/dashboard">View Demo</Link>
                  </Button>
                </MotionButton>
              </motion.div>
          </div>
        </div>
      </section>

      {/* Features – modernized with animated borders */}
      <section id="features" className="py-24 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <span className="inline-block mb-3 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
              Features
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Everything You Need to{" "}
              <span className="gradient-text">Succeed</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              Comprehensive tools designed to transform your interview skills
              from good to exceptional.
            </p>
          </motion.div>
          <MotionStagger className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <MotionItem key={f.title}>
                <MotionCard>
                  <div className="animated-border rounded-xl h-full">
                    <Card className="border-0 bg-card/80 backdrop-blur-sm h-full rounded-xl">
                      <CardContent className="p-0">
                        <div className="overflow-hidden rounded-t-xl">
                          <img
                            src={featureImages[i]}
                            alt={f.title}
                            className="w-full h-44 object-cover transition-transform duration-500 hover:scale-110"
                          />
                        </div>
                        <div className="p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 rounded-lg gradient-primary">
                              <f.icon className="h-4 w-4 text-primary-foreground" />
                            </div>
                            <h3 className="font-bold text-lg">{f.title}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {f.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </MotionCard>
              </MotionItem>
            ))}
          </MotionStagger>
        </div>
      </section>

      {/* How It Works – modernized */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 via-background to-secondary/30" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-block mb-3 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
              How It Works
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Three Steps to <span className="gradient-text">Success</span>
            </h2>
          </motion.div>

          <motion.div
            className="mb-16"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <div className="animated-border rounded-2xl p-1 max-w-2xl mx-auto">
              <img
                src={howItWorksImg}
                alt="How PrepTalkAI works - 3 step process"
                className="w-full rounded-2xl"
              />
            </div>
          </motion.div>

          <MotionStagger className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((s, i) => (
              <MotionItem key={s.step}>
                <motion.div
                  className="relative group"
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="animated-border rounded-2xl h-full">
                    <div className="bg-card/90 backdrop-blur-sm rounded-2xl p-8 h-full text-center">
                      <div className="text-4xl mb-4">{s.icon}</div>
                      <div className="text-6xl font-black gradient-text mb-4 opacity-30">
                        {s.step}
                      </div>
                      <h3 className="font-bold text-xl mb-3">{s.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {s.description}
                      </p>
                    </div>
                  </div>
                  {/* Connector line */}
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 gradient-primary opacity-40" />
                  )}
                </motion.div>
              </MotionItem>
            ))}
          </MotionStagger>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-40">
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-center mb-12"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Loved by <span className="gradient-text">Students</span>
          </motion.h2>
          <div className="overflow-hidden group/marquee">
            <div className="flex gap-6 w-max animate-marquee group-hover/marquee:[animation-play-state:paused]">
              {[...testimonials, ...testimonials, ...testimonials].map(
                (t, idx) => (
                  <div key={idx} className="w-[280px] h-[280px] shrink-0">
                    <Card className="border-border/50 w-full h-full">
                      <CardContent className="p-6 flex flex-col justify-between h-full">
                        <div>
                          <div className="flex gap-1 mb-3">
                            {Array.from({ length: t.rating }).map((_, i) => (
                              <Star
                                key={i}
                                className="h-4 w-4 fill-primary text-primary"
                              />
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground italic line-clamp-4">
                            "{t.quote}"
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{t.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {t.role}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block mb-3 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
              Pricing
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Completely <span className="gradient-text">Free</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              All features are free during our launch period. No credit card required.
            </p>
          </motion.div>

          <MotionStagger className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Starter",
                desc: "Perfect for getting started",
                features: ["5 AI mock interviews/month", "Join group discussions", "Basic performance analytics", "Email support"],
              },
              {
                name: "Pro",
                desc: "For serious preparation",
                featured: true,
                features: ["Unlimited AI interviews", "Priority discussion rooms", "Advanced analytics & insights", "Personalized improvement plans", "Interview recording & playback"],
              },
              {
                name: "Team",
                desc: "For study groups & cohorts",
                features: ["Everything in Pro", "Team analytics dashboard", "Custom discussion topics", "Dedicated support channel"],
              },
            ].map((plan) => (
              <MotionItem key={plan.name}>
                <div className={`animated-border rounded-2xl h-full ${plan.featured ? "scale-105" : ""}`}>
                  <Card className={`border-0 bg-card/80 backdrop-blur-sm h-full rounded-2xl ${plan.featured ? "ring-2 ring-primary/50" : ""}`}>
                    <CardContent className="p-8 flex flex-col h-full">
                      {plan.featured && (
                        <span className="inline-block self-start mb-3 px-3 py-1 rounded-full gradient-primary text-primary-foreground text-xs font-semibold">
                          Most Popular
                        </span>
                      )}
                      <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{plan.desc}</p>
                      <div className="mb-6">
                        <span className="text-4xl font-extrabold">$0</span>
                        <span className="text-muted-foreground text-sm">/month</span>
                      </div>
                      <ul className="space-y-3 mb-8 flex-1">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        asChild
                        className={plan.featured ? "gradient-primary border-0 w-full" : "w-full"}
                        variant={plan.featured ? "default" : "outline"}
                      >
                        <Link to="/signup">Get Started Free</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </MotionItem>
            ))}
          </MotionStagger>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2026 PrepTalkAI. Built for students who aim higher.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
