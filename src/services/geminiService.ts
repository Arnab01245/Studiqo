/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { StudySession, Task } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export async function analyzeStudyPatterns(sessions: StudySession[], tasks: Task[]) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Analyze these study sessions and tasks for a student. 
        Sessions: ${JSON.stringify(sessions.slice(-10))}
        Tasks: ${JSON.stringify(tasks)}

        Provide burnout detection and productivity insights.
        Return as JSON with:
        - burnoutRisk: number (0-100)
        - insights: string[] (3-5 items)
        - suggestedFocus: string (what subject to tackle next)
        - focusScore: number (0-100 overall)
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            burnoutRisk: { type: Type.NUMBER },
            insights: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedFocus: { type: Type.STRING },
            focusScore: { type: Type.NUMBER }
          },
          required: ["burnoutRisk", "insights", "suggestedFocus", "focusScore"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return {
      burnoutRisk: 20,
      insights: ["Maintain a steady rhythm.", "Take short breaks every 25 mins.", "Focus on your upcoming deadlines."],
      suggestedFocus: "Priority tasks",
      focusScore: 75
    };
  }
}
