import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildSystemPrompt(type: string, difficulty: string, role: string) {
  const typeInstructions: Record<string, string> = {
    technical: `You are a technical interviewer. Ask coding, system design, and technical concept questions relevant to the ${role} role. 
For beginner: ask fundamental concepts. For intermediate: ask applied scenarios. For advanced: ask complex system design and optimization questions.
Ask ONE question at a time. Wait for the candidate's response before moving on. Provide brief feedback on their answer before asking the next question.`,
    behavioral: `You are a behavioral interviewer using the STAR method. Ask questions about past experiences, teamwork, conflict resolution, and leadership relevant to the ${role} role.
For beginner: ask simple situational questions. For intermediate: ask about challenging scenarios. For advanced: ask about complex leadership and strategic decisions.
Ask ONE question at a time. Evaluate their structure and storytelling.`,
    hr: `You are an HR interviewer. Ask questions about culture fit, career goals, salary expectations, strengths/weaknesses, and motivation for the ${role} role.
For beginner: ask basic HR questions. For intermediate: ask deeper motivational questions. For advanced: ask nuanced questions about career strategy.
Ask ONE question at a time. Be warm but professional.`,
  };

  return `${typeInstructions[type] || typeInstructions.technical}

Difficulty level: ${difficulty}
Role: ${role}

Rules:
- Start with a warm greeting and your first question
- Keep responses concise (2-4 sentences of feedback + 1 question)
- After 5-7 questions, let the candidate know the interview is wrapping up
- Be encouraging but honest
- Do NOT break character`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, config } = await req.json();
    const { type = "technical", difficulty = "intermediate", role = "frontend" } = config || {};

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

const systemPrompt = buildSystemPrompt(type, difficulty, role);

    // Gemini's OpenAI-compatible endpoint requires at least one non-system message.
    // On the very first call (no history yet), synthesize a kickoff message.
    const chatMessages = messages && messages.length > 0
      ? messages
      : [{ role: "user", content: "Let's begin the interview." }];

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...chatMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("interview-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});