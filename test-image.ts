import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

const ai = new GoogleGenAI({});

async function run() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: {
        parts: [
          { text: 'A robot holding a red skateboard.' }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        }
      }
    });

    console.log("Response:", JSON.stringify(response, null, 2));

    let foundImage = false;
    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
         if (part.inlineData) {
           console.log("Found image!", part.inlineData.mimeType, "length:", part.inlineData.data?.length);
           foundImage = true;
         } else if (part.text) {
           console.log("Found text:", part.text);
         }
      }
    }
    
    if (!foundImage) {
       console.log("No inlineData found in parts.", response.candidates?.[0]?.content?.parts);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
