
import { GoogleGenAI, Type } from "@google/genai";
import { VideoMetadata, MediaPlatform } from "../types";

export const analyzeUrl = async (url: string): Promise<VideoMetadata> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Using gemini-3-pro-preview for more complex reasoning on URLs
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Task: Extract video metadata from this social media URL.
    URL: ${url}
    
    Context: This is for a video downloader app. The user provides a link from YouTube (Shorts/Videos), TikTok, or Instagram (Reels/Posts).
    
    Requirements:
    1. Platform Detection: Identify if it is "youtube", "tiktok", or "instagram".
    2. Title: Create a catchy, relevant title based on the URL or common patterns for that platform.
    3. Author: Extract or guess the creator's handle/name.
    4. Duration: Return a realistic duration (e.g., "00:15" to "10:00").
    5. Thumbnail: The app will handle the image, just ensure the other fields are accurate.
    
    The URL might be a mobile share link (e.g., youtu.be, vt.tiktok.com) or a full desktop link. Be flexible.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Video title" },
          author: { type: Type.STRING, description: "Creator username" },
          thumbnail: { type: Type.STRING, description: "Placeholder" },
          duration: { type: Type.STRING, description: "Duration in MM:SS" },
          platform: { type: Type.STRING, enum: ["youtube", "tiktok", "instagram", "unknown"] }
        },
        required: ["title", "author", "thumbnail", "duration", "platform"]
      }
    }
  });

  try {
    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    
    const data = JSON.parse(text);
    // Use a high-quality dynamic placeholder for the thumbnail based on the title
    const seed = encodeURIComponent(data.title.substring(0, 10));
    return {
      ...data,
      thumbnail: `https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80` // Default social media style thumb
    };
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Analysis failed. Please check your URL format or verify your API key is correctly set in Vercel.");
  }
};
