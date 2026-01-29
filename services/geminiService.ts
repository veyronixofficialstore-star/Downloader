
import { GoogleGenAI, Type } from "@google/genai";
import { VideoMetadata, MediaPlatform } from "../types";

export const analyzeUrl = async (url: string): Promise<VideoMetadata> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze this social media URL and extract video metadata. 
    URL: ${url}
    
    Instructions:
    1. Identify if it is YouTube (including /shorts/), TikTok, or Instagram (including /reels/).
    2. Provide a realistic title based on the URL context if possible, otherwise generate a plausible one.
    3. Provide the creator's username or channel name.
    4. Provide a duration in MM:SS format.
    5. Be robust to various URL formats from these platforms.`,
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
    // Overwrite thumbnail with a higher quality random one for better UI consistency in this demo
    return {
      ...data,
      thumbnail: `https://picsum.photos/seed/${encodeURIComponent(url.slice(-10))}/800/450`
    };
  } catch (error) {
    console.error("Failed to parse Gemini response", error);
    throw new Error("Could not analyze the provided link. Please ensure it is a valid social media URL.");
  }
};
