import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

const ai = new GoogleGenAI({});

async function run() {
  try {
    const response = await ai.models.generateContent({
      model: 'imagen-3.0-generate-002',
      contents: {
        parts: [{ text: 'A picture of a dog in a park' }]
      },
      config: {
        imageConfig: {
          personGeneration: 'ALLOW_ADULT',
          aspectRatio: "1:1"
        }
      } as any
    });
    console.log("Success with imagen-3.0-generate-002", response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType);
  } catch (error) {
    console.error("Error:", error);
  }
}
run();
