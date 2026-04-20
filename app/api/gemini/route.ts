import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const SYS = `You are the AI marketing agent for HomeSol Digital  — a private villa in Palghar, Maharashtra, 1.5 hours from Mumbai.

PROPERTY DETAILS:
- 1  (2BHK, private pool, capacity 20-40 pax, from ₹40,000/night)
- 3 Wooden Cottages (couples/small groups, from ₹8,000/night)
- USP: Mountain + valley views, huge private pool, 24/7 loud music allowed, NO curfew, NO restrictions, pet friendly, no neighbors
- No in-house kitchen — 2 restaurant menus for order-in
- Instagram: @homesolindia (200 followers, 34 posts as of March 2026)
- Booking: Direct DMs, WhatsApp, JustDial, MakeMyTrip, Agoda

TARGET SEGMENTS (priority order):
1. Film & ad shoots (weekday preferred, ₹40K-₹80K+/day)
2. Corporate offsites — HR managers, Mumbai companies (₹50K-₹1L per booking)
3. Bachelor/bachelorette parties — groups 10-20, age 22-35
4. YouTubers/creators for collab stays
5. Birthday/celebration groups
6. Wedding photographers for pre-wedding shoots (₹8K-₹15K)
7. Travel agents — 10-15% commission partnership

90-DAY GOALS: 500 followers M1, 1000 M3, 15+ bookings/month by M3, 4.5 Google stars, 4 weekday bookings/month.

When asked for contacts: Give REAL, SPECIFIC Instagram handles (Mumbai travel creators 10K-500K followers), real LinkedIn search URLs, real hashtags, real Facebook groups, real directories. Be extremely specific and practical.

When asked for scripts: Give copy-paste ready messages with [Name] placeholders. Warm and natural tone.

Always be practical and specific. No generic advice. Keep responses clear and well-structured.`;

export async function POST(req: NextRequest) {
  try {
    const { prompt, model: requestedModel } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "No prompt provided" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key is not configured on the server." }, { status: 500 });
    }

    const modelMap: Record<string, string> = {
      "gemini-3.1-pro": "gemini-1.5-pro-latest",
      "gemini-3.0-pro": "gemini-1.5-pro-latest",
      "gemini-2.5-pro": "gemini-1.5-pro-latest",
      "gemini-2.5-flash": "gemini-1.5-flash-latest",
      "gemini-1.5-pro-latest": "gemini-1.5-pro-latest",
      "gemini-1.5-flash-latest": "gemini-1.5-flash-latest",
      "gemini-1.0-pro": "gemini-1.0-pro",
      "gemini-pro": "gemini-pro"
    };

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelToUse = modelMap[requestedModel] || "gemini-1.5-flash-latest";
    const model = genAI.getGenerativeModel({ model: modelToUse });

    const fullPrompt = `${SYS}\n\n${prompt}`;

    const result = await model.generateContent(fullPrompt);
    const text = result.response.text();

    return NextResponse.json({ result: text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate content" }, { status: 500 });
  }
}
