
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
 * Optimized for absolute metadata precision.
 */
export const analyzeUrl = async (url: string): Promise<AnalysisResult> => {
  // Use the provided environment key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const youtubeId = getYouTubeId(url);
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `ACTUAL URL TO ANALYZE: ${url}
      
      INSTRUCTIONS:
      1. Use Google Search to find the EXACT metadata for this specific URL.
      2. Identify the ORIGINAL video title (do not use generic placeholders).
      3. Identify the ACTUAL creator or channel name (do not guess 'Nas Daily' or other famous creators unless it is actually them).
      4. If you cannot find the exact creator, return 'Verified Creator' instead of guessing.

      OUTPUT FORMAT (STRICT):
      TITLE: [Exact Title]
      AUTHOR: [Exact Channel/Creator Name]
      DURATION: [MM:SS]`,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 0 } // Maximum speed
      }
    });

    const text = response.text || "";
    
    // Improved parsing with case insensitivity and better spacing handling
    const titleMatch = text.match(/TITLE:\s*(.*)/i);
    const authorMatch = text.match(/AUTHOR:\s*(.*)/i);
    const durationMatch = text.match(/DURATION:\s*(\d+:?\d*)/i);

    const title = titleMatch?.[1]?.trim() || (youtubeId ? "YouTube Video" : "Media Content");
    const author = authorMatch?.[1]?.trim() || "Content Creator";
    const duration = durationMatch?.[1]?.trim() || "0:15";

    // Extracting Search Grounding URLs for transparency
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
      thumbnail = `https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg`;
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
    console.error("Analysis Error:", error);
    
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
    
    throw new Error("Target analysis failed. Verify the URL is public and try again.");
  }
};
