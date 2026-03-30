import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

// 1. Initialize the NEW SDK. It automatically finds process.env.GEMINI_API_KEY
const ai = new GoogleGenAI({});

export async function POST(request: Request) {
    try {
        console.log("🚨🚨🚨 HACKATHON SANITY CHECK: NEW SDK RUNNING 🚨🚨🚨");

        const body = await request.json();
        const { userId, userMessage, currentScore, activeIssues, chatHistory } = body;

        // 2. Format the chat history
        const formattedHistory = chatHistory
            ? chatHistory.map((msg: any) => `${msg.role === 'user' ? 'User' : 'Mentor'}: ${msg.text}`).join('\n')
            : "No previous history.";

        // 3. The System Prompt Strategy
        const systemPrompt = `
      You are an empathetic, professional AI mentor for a youth mental health platform.
      
      CURRENT USER STATE:
      - Current Wellbeing Score: ${currentScore}/100
      - Active Issues: ${activeIssues.join(", ") || "None"}
      
      RECENT CONVERSATION HISTORY:
      ${formattedHistory}
      
      USER'S LATEST MESSAGE: "${userMessage}"
      
      YOUR TASK:
      1. Provide a supportive, brief reply (max 3 sentences) acknowledging their update. Give them one small, actionable next step. Keep the context of the recent conversation history in mind.
      2. Evaluate their progress. If they took positive action (e.g., resting, studying, talking to someone), increase their score by 1 to 5 points. If they are struggling, keep the score the same (do not decrease it, keep it positive). Cap the score at 100.
      3. Update the issues list. If they resolved an issue, remove it. If a new issue emerged, add it.

      OUTPUT FORMAT:
      You must respond with a valid JSON object matching this exact schema:
      {
        "reply": "Your empathetic response here...",
        "newScore": 0,
        "updatedIssues": ["issue1", "issue2"]
      }
    `;

        // 4. Send the request using the NEW SDK syntax
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview", // Note: you can also safely use gemini-2.5-flash here
            contents: systemPrompt,
            config: {
                responseMimeType: "application/json",
            }
        });

        // 5. Parse the JSON response
        const parsedData = JSON.parse(response.text);

        // 6. Return the updated state to the frontend
        return NextResponse.json({
            reply: parsedData.reply,
            newScore: parsedData.newScore,
            updatedIssues: parsedData.updatedIssues
        });

    } catch (error) {
        console.error("Mentor chat error:", error);
        return NextResponse.json({ error: "Failed to process mentor response" }, { status: 500 });
    }
}