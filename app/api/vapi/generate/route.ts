import { generateText } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";
import admin from "firebase-admin";

export async function POST(request: Request) {
  const { type, role, level, techstack, amount, userId } = await request.json();
  console.log( "Request body:", { type, role, level, techstack, amount, userId });
  try {
    const parsedAmount = Number(amount) || 5; // fallback = 5 nếu không parse được

    // gọi Gemini để sinh câu hỏi
    const { text: questionsRaw } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: `Prepare ${parsedAmount} questions for a job interview.
        Role: ${role}.
        Level: ${level}.
        Tech stack: ${techstack}.
        Focus: ${type} (behavioural/technical).
        
        Return only valid JSON array of strings.
        Do NOT include any explanations or text outside the array.
        Example format:
        ["Question 1", "Question 2", "Question 3"]
      `,
    });

    // xử lý JSON từ model
    let questions: string[];
    try {
      // thử parse trực tiếp
      questions = JSON.parse(questionsRaw);
    } catch {
      // fallback: chỉ lấy phần trong [ ... ]
      const match = questionsRaw.match(/\[([\s\S]*)\]/);
      if (!match) {
        console.error("Invalid model output:", questionsRaw);
        throw new Error("Model did not return valid JSON");
      }
      questions = JSON.parse(match[0]);
    }

    // object interview
    const interview = {
      role,
      type,
      level,
      techstack: techstack.split(",").map((s: string) => s.trim()),
      questions,
      userId: userId,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: admin.firestore.Timestamp.now(), // chuẩn Firestore timestamp
    };

    // lưu Firestore
    await db.collection("interviews").add(interview);

    return Response.json({ success: true, interview }, { status: 200 });
  } catch (error: any) {
    console.error("Error in /api/vapi/generate:", error);
    return Response.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({ success: true, data: "Thank you!" }, { status: 200 });
}
