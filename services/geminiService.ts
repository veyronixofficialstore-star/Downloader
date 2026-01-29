
import { GoogleGenAI, Type } from "@google/genai";
import { VideoMetadata, MediaPlatform } from "../types";

export const analyzeUrl = async (url: string): Promise<VideoMetadata> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze this URL and provide metadata for a media downloader. URL: ${url}. If it looks like YouTube, TikTok, or Instagram, provide plausible title, author, and duration.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "The title of the video or post" },
          author: { type: Type.STRING, description: "The username or channel name" },
          thumbnail: { type: Type.STRING, description: "A high quality placeholder image URL" },
          duration: { type: Type.STRING, description: "Formatted duration like 00:59" },
          platform: { type: Type.STRING, enum: ["youtube", "tiktok", "instagram", "unknown"] }
        },
        required: ["title", "author", "thumbnail", "duration", "platform"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text);
    // Overwrite thumbnail with a higher quality random one for better UI
    return {
      ...data,
      thumbnail: `https://picsum.photos/seed/${Math.random()}/800/450`
    };
  } catch (error) {
    console.error("Failed to parse Gemini response", error);
    throw new Error("Could not analyze the provided link.");
  }
};
