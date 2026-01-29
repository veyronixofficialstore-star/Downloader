
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
 * Optimized for speed and absolute accuracy.
 */
export const analyzeUrl = async (url: string): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const youtubeId = getYouTubeId(url);
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Search results for URL: ${url}. 
      Task: Extract the REAL video title and the REAL creator/channel name. 
      CRITICAL: Do not provide generic names like 'Nas Daily' or '#shorts' unless it is actually in the metadata. 
      Only return what is found in the search results for this specific link.

      Output Format:
      TITLE: [Real Video Title]
      AUTHOR: [Real Channel/Creator Name]
      DURATION: [MM:SS or approximate]`,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 0 } // Bypasses thinking for extreme speed
      }
    });

    const text = response.text || "";
    
    // Precise extraction logic
    const titleMatch = text.match(/TITLE:\s*(.*)/i);
    const authorMatch = text.match(/AUTHOR:\s*(.*)/i);
    const durationMatch = text.match(/DURATION:\s*(\d+:?\d*)/i);

    const title = titleMatch?.[1]?.trim() || (youtubeId ? "YouTube Content" : "Media Clip");
    const author = authorMatch?.[1]?.trim() || "Creator";
    const duration = durationMatch?.[1]?.trim() || "0:15";

    // Grounding Metadata is used to display verified sources to the user
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

    // Use High Quality Thumbnail for YouTube
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
    console.error("Gemini Analysis Error:", error);
    
    // Fallback if AI search is too slow or fails
    if (youtubeId) {
      return {
        title: "YouTube Video",
        author: "Unknown Creator",
        duration: "--:--",
        platform: "youtube",
        thumbnail: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
        sources: []
      };
    }
    
    throw new Error("Link analysis failed. Please ensure the link is public and try again.");
  }
};
