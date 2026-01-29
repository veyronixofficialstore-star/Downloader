
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
 * We prioritize getting the REAL title and creator.
 */
export const analyzeUrl = async (url: string): Promise<VideoMetadata> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API Key is missing in the environment configuration.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const youtubeId = getYouTubeId(url);
  
  try {
    // We use Google Search to find the ACTUAL metadata of the video.
    // We explicitly tell the model NOT to guess or make things up.
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Perform a Google Search for this exact URL: ${url}.
      Extract the REAL video title and the REAL channel/author name from the search results.
      
      DO NOT GUESS. If you cannot find the exact title, return "Unknown Video".
      
      Format your response exactly like this:
      TITLE: [Real Title]
      AUTHOR: [Real Channel Name]
      DURATION: [Video Length if found, else 00:00]`,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text;
    
    // Parse the AI response
    const titleMatch = text?.match(/TITLE:\s*(.*)/i);
    const authorMatch = text?.match(/AUTHOR:\s*(.*)/i);
    const durationMatch = text?.match(/DURATION:\s*(.*)/i);

    const title = titleMatch?.[1]?.trim() || (youtubeId ? "YouTube Video" : "Social Media Media");
    const author = authorMatch?.[1]?.trim() || "Creator";
    const duration = durationMatch?.[1]?.trim() || "0:15";

    // Determine platform
    let platform: any = "unknown";
    if (url.includes('youtube.com') || url.includes('youtu.be')) platform = 'youtube';
    else if (url.includes('tiktok.com')) platform = 'tiktok';
    else if (url.includes('instagram.com')) platform = 'instagram';

    // Thumbnail logic: YouTube Shorts often don't have maxresdefault.
    // We'll use hqdefault as a safe high-quality base.
    let thumbnail = `https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80`;
    if (youtubeId) {
      // Use hqdefault which is more reliable than maxresdefault for Shorts
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
    
    // Fallback if AI fails: At least provide the YouTube thumbnail if we have an ID
    if (youtubeId) {
      return {
        title: "YouTube Video",
        author: "Creator",
        duration: "--:--",
        platform: "youtube",
        thumbnail: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`
      };
    }
    
    throw new Error("Could not find video details. Please check if the link is public.");
  }
};
