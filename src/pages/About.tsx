import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Mail, MapPin, MessageCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
          <motion.span
            className="inline-block mb-3 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            About Us
          </motion.span>
          <motion.h1
            className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Built for Students Who{" "}
            <span className="gradient-text">Aim Higher</span>
          </motion.h1>
          <motion.p
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            PrepTalkAI is an AI-powered platform designed to help students and
            professionals master interviews and group discussions through
            realistic practice and instant feedback.
          </motion.p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "Our Mission",
                description:
                  "To democratize interview preparation by making high-quality, AI-driven practice accessible to everyone — regardless of background or budget.",
                icon: "🎯",
              },
              {
                title: "Our Vision",
                description:
                  "A world where every candidate walks into an interview confident, prepared, and ready to showcase their true potential.",
                icon: "🌟",
              },
            ].map((item) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <div className="animated-border rounded-2xl h-full">
                  <Card className="border-0 bg-card/80 backdrop-blur-sm h-full rounded-2xl">
                    <CardContent className="p-8">
                      <div className="text-4xl mb-4">{item.icon}</div>
                      <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {item.description}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/30 to-background" />
        <div className="container mx-auto px-4 relative z-10 max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-block mb-3 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
              Contact Us
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Get in <span className="gradient-text">Touch</span>
            </h2>
            <p className="text-muted-foreground mb-10">
              Have questions, feedback, or just want to say hello? We'd love to
              hear from you.
            </p>
          </motion.div>

          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <div className="animated-border rounded-2xl">
              <Card className="border-0 bg-card/80 backdrop-blur-sm rounded-2xl">
                <CardContent className="p-8 flex flex-col items-center gap-4">
                  <div className="p-3 rounded-xl gradient-primary">
                    <Mail className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Email Us</h3>
                    <a
                      href="mailto:dhananjaydose@gmail.com"
                      className="text-primary hover:underline text-base"
                    >
                      dhananjaydose@gmail.com
                    </a>
                  </div>
                  <Button asChild className="gradient-primary border-0 mt-2">
                    <a href="mailto:dhananjaydose@gmail.com">
                      Send an Email <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Start Practicing?
            </h2>
            <p className="text-muted-foreground mb-6">
              Join thousands of students already preparing smarter with AI.
            </p>
            <Button asChild size="lg" className="gradient-primary border-0">
              <Link to="/signup">
                Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
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

export default About;
