
import { GoogleGenAI, Type } from "@google/genai";
import { VideoMetadata } from "../types";

/**
 * Robustly extracts a YouTube Video ID from various URL formats.
 */
const getYouTubeId = (url: string): string | null => {
  const match = url.match(/(?:shorts\/|v=|v\/|embed\/|youtu\.be\/|\/v\/|watch\?v=|\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
};

export interface AnalysisResult extends VideoMetadata {
  isVerified?: boolean;
}

/**
 * Official YouTube oEmbed fetcher - No API Key required, used as a fast first-pass.
 */
const fetchYoutubeOEmbed = async (url: string) => {
  try {
    const cleanUrl = url.split('&')[0];
    const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(cleanUrl)}&format=json`);
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.warn("oEmbed fetch failed", e);
  }
  return null;
};

/**
 * Analyzes the provided URL using Gemini 3 Flash.
 */
export const analyzeUrl = async (url: string): Promise<AnalysisResult> => {
  const youtubeId = getYouTubeId(url);
  const isYoutube = url.toLowerCase().includes('youtube.com') || url.toLowerCase().includes('youtu.be');

  // 1. Quick pass for YouTube
  if (isYoutube) {
    const oembed = await fetchYoutubeOEmbed(url);
    if (oembed) {
      return {
        title: oembed.title || "YouTube Content",
        author: oembed.author_name || "Official Creator",
        duration: "Shorts",
        platform: 'youtube',
        thumbnail: oembed.thumbnail_url || `https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg`,
        isVerified: true
      };
    }
  }

  // 2. Deep analysis using Gemini for all platforms
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extract the video title and creator name from this URL: ${url}. If it's a social media link (TikTok, Instagram, YouTube), guess based on the URL patterns if direct info isn't clear.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            author: { type: Type.STRING },
            platform: { type: Type.STRING, description: "One of: youtube, tiktok, instagram, unknown" }
          },
          required: ["title", "author", "platform"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    
    // Attempt a reasonable thumbnail
    let thumb = "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80";
    if (isYoutube && youtubeId) {
      thumb = `https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg`;
    }

    return {
      title: data.title || "Media Content",
      author: data.author || "Content Creator",
      duration: "--:--",
      platform: data.platform || (isYoutube ? 'youtube' : 'unknown'),
      thumbnail: thumb,
      isVerified: false
    };
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return {
      title: youtubeId ? "YouTube Shorts Content" : "Media Clip",
      author: "Original Creator",
      duration: "--:--",
      platform: isYoutube ? "youtube" : "unknown",
      thumbnail: youtubeId ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` : "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800",
      isVerified: false
    };
  }
};
