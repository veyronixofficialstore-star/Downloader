
import { GoogleGenAI } from "@google/genai";
import { VideoMetadata } from "../types";

/**
 * Robustly extracts a YouTube Video ID from various URL formats, including Shorts.
 */
const getYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:v=|\/)([0-9A-Za-z_-]{11}).*/,
    /(?:embed\/|v\/|shorts\/|watch\?v=|youtu\.be\/)([0-9A-Za-z_-]{11})/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
};

/**
 * Analyzes the provided URL using Gemini 3 Flash with Google Search.
 * We prioritize getting the REAL title and creator directly from the web.
 */
export const analyzeUrl = async (url: string): Promise<VideoMetadata> => {
  // Use the API key directly as per environment specifications
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const youtubeId = getYouTubeId(url);
  
  try {
    // Using Google Search tool to fetch LIVE data from the platform.
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Search for this URL and extract the REAL title and channel/author name: ${url}. 
      
      CRITICAL INSTRUCTIONS:
      1. Use Google Search to find the actual page content.
      2. Do NOT invent a title. If you cannot find the exact title, return "Private or Unavailable Video".
      3. Return ONLY the data in this exact format:
      TITLE: [Real Title]
      AUTHOR: [Real Channel Name]
      DURATION: [Video length like 00:15 or 01:20]`,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text;
    
    // Parse the AI response with fallback handling
    const titleMatch = text?.match(/TITLE:\s*(.*)/i);
    const authorMatch = text?.match(/AUTHOR:\s*(.*)/i);
    const durationMatch = text?.match(/DURATION:\s*(.*)/i);

    const title = titleMatch?.[1]?.trim() || (youtubeId ? "YouTube Video" : "Media Clip");
    const author = authorMatch?.[1]?.trim() || "Creator";
    const duration = durationMatch?.[1]?.trim() || "0:15";

    // Determine platform for UI context
    let platform: any = "unknown";
    if (url.includes('youtube.com') || url.includes('youtu.be')) platform = 'youtube';
    else if (url.includes('tiktok.com')) platform = 'tiktok';
    else if (url.includes('instagram.com')) platform = 'instagram';

    // Thumbnail logic: YouTube Shorts use hqdefault for guaranteed availability.
    let thumbnail = `https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80`;
    if (youtubeId) {
      thumbnail = `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
    }

    return {
      title,
      author,
      duration,
      platform,
      thumbnail
    };
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    
    // Automatic fallback for YouTube links if search fails but we have an ID
    if (youtubeId) {
      return {
        title: "YouTube Video",
        author: "Creator",
        duration: "--:--",
        platform: "youtube",
        thumbnail: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`
      };
    }
    
    throw new Error("Unable to fetch video details. Please ensure the link is public and valid.");
  }
};
