
import { GoogleGenAI } from "@google/genai";
import { VideoMetadata } from "../types";

/**
 * Robustly extracts a YouTube Video ID from various URL formats, including Shorts.
 */
const getYouTubeId = (url: string): string | null => {
  const match = url.match(/(?:shorts\/|v=|v\/|embed\/|youtu\.be\/|\/v\/|watch\?v=|\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
};

export interface AnalysisResult extends VideoMetadata {
  sources?: { title: string; uri: string }[];
}

/**
 * Analyzes the provided URL using Gemini 3 Flash with Google Search.
 * Optimized for speed and accuracy.
 */
export const analyzeUrl = async (url: string): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const youtubeId = getYouTubeId(url);
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Search for this URL: ${url}. 
      Extract the EXACT video title, creator name, and duration.
      
      Format your response strictly as:
      TITLE: [Title]
      AUTHOR: [Creator Name]
      DURATION: [MM:SS]`,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 0 } // Disable thinking for faster response
      }
    });

    const text = response.text || "";
    
    // Improved parsing for speed and reliability
    const titleMatch = text.match(/TITLE:\s*(.*)/i);
    const authorMatch = text.match(/AUTHOR:\s*(.*)/i);
    const durationMatch = text.match(/DURATION:\s*(\d+:\d+)/i);

    const title = titleMatch?.[1]?.trim() || (youtubeId ? "YouTube Video" : "Media Clip");
    const author = authorMatch?.[1]?.trim() || "Verified Creator";
    const duration = durationMatch?.[1]?.trim() || "0:15";

    // Extracting Search Grounding URLs (Required by API rules)
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk, index) => {
        if (chunk.web) {
          return {
            title: chunk.web.title || `Source ${index + 1}`,
            uri: chunk.web.uri || ""
          };
        }
        return null;
      })
      .filter((s): s is { title: string; uri: string } => s !== null) || [];

    // Thumbnail Logic
    let thumbnail = `https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80`;
    if (youtubeId) {
      thumbnail = `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
    }

    return {
      title,
      author,
      duration,
      platform: url.includes('tiktok') ? 'tiktok' : (url.includes('instagram') ? 'instagram' : 'youtube'),
      thumbnail,
      sources
    };
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    
    // Fallback if AI search fails but we have a YouTube ID
    if (youtubeId) {
      return {
        title: "YouTube Content",
        author: "Creator",
        duration: "--:--",
        platform: "youtube",
        thumbnail: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
        sources: []
      };
    }
    
    throw new Error("Analysis timed out or failed. Please ensure the link is public.");
  }
};
