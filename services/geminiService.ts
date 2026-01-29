
import { GoogleGenAI, Type } from "@google/genai";
import { VideoMetadata } from "../types";

/**
 * Uses Gemini 3 Flash to extract structured metadata from a social media URL.
 * Flash is preferred here for speed and strict adherence to JSON schemas.
 */
export const analyzeUrl = async (url: string): Promise<VideoMetadata> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extract video metadata from this URL: ${url}. 
      Identify if it's YouTube, TikTok, or Instagram. 
      Create a title, identify the author, and estimate duration.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            author: { type: Type.STRING },
            duration: { type: Type.STRING },
            platform: { 
              type: Type.STRING, 
              enum: ["youtube", "tiktok", "instagram", "unknown"] 
            }
          },
          required: ["title", "author", "duration", "platform"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("The AI returned an empty response. This usually happens with invalid URLs.");
    }

    // Clean the text in case the model ignored responseMimeType and added markdown
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanedText);

    return {
      title: data.title || "Untitled Video",
      author: data.author || "Unknown Creator",
      duration: data.duration || "00:00",
      platform: data.platform || "unknown",
      thumbnail: `https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80`
    };
  } catch (error: any) {
    console.error("Gemini Analysis Error Details:", error);
    
    // Provide user-friendly versions of common API errors
    if (error.message?.includes("403")) {
      throw new Error("API Key Error: Access forbidden. Please check if your API Key is valid and has billing enabled if required.");
    } else if (error.message?.includes("429")) {
      throw new Error("Rate Limit Reached: Too many requests. Please wait a moment and try again.");
    } else if (error.message?.includes("404")) {
      throw new Error("Model not found. The Gemini service might be temporarily unavailable.");
    }
    
    throw new Error(error.message || "Failed to analyze link. Please ensure it's a valid YouTube, TikTok, or Instagram URL.");
  }
};
