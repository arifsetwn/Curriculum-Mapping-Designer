
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateCurriculumSuggestion = async (major: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a sample 8-semester curriculum for a ${major} major. Return exactly 8 semesters with 3-5 courses each. Each course needs a name, SKS (credits, usually 2-4), and a suggested color category (choose from: bg-blue-500, bg-green-500, bg-yellow-400, bg-purple-500, bg-red-500).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            semesters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  courses: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        sks: { type: Type.NUMBER },
                        color: { type: Type.STRING }
                      },
                      required: ["name", "sks", "color"]
                    }
                  }
                },
                required: ["title", "courses"]
              }
            }
          },
          required: ["semesters"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};
