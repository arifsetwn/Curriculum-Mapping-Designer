
import { GoogleGenAI, Type } from "@google/genai";

// Always use the process.env.API_KEY directly as a named parameter.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateCurriculumSuggestion = async (major: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      // Use color values that match the application's CourseColor enum (blue, green, yellow, purple, gray, red).
      contents: `Generate a sample 8-semester curriculum for a ${major} major. Return exactly 8 semesters with 3-5 courses each. Each course needs a name, SKS (credits, usually 2-4), and a suggested color category (choose from: blue, green, yellow, purple, gray, red).`,
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

    // Access the .text property directly to get the generated string.
    const jsonStr = response.text?.trim();
    if (!jsonStr) return null;
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};
