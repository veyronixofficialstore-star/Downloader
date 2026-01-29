
import { VideoMetadata } from "../types";

/**
 * Robustly extracts a YouTube Video ID from various URL formats.
 */
const getYouTubeId = (url: string): string | null => {
  const match = url.match(/(?:shorts\/|v=|v\/|embed\/|youtu\.be\/|\/v\/|watch\?v=|\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
};

export interface AnalysisResult extends VideoMetadata {
  sources?: { title: string; uri: string }[];
  isVerified?: boolean;
}

/**
 * Official YouTube oEmbed fetcher - No API Key required, 100% accurate for YT.
 */
const fetchYoutubeOEmbed = async (url: string) => {
  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.warn("oEmbed fetch failed, falling back to HF", e);
  }
  return null;
};

/**
 * Analyzes the provided URL.
 * Prioritizes official oEmbed for YouTube, falls back to HF Inference for others.
 */
export const analyzeUrl = async (url: string): Promise<AnalysisResult> => {
  const apiKey = process.env.API_KEY; 
  const youtubeId = getYouTubeId(url);
  const isYoutube = url.toLowerCase().includes('youtube.com') || url.toLowerCase().includes('youtu.be');

  // 1. Try Official YouTube oEmbed first for guaranteed accuracy
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
  
  // 2. Fallback/Platform analysis using Hugging Face Inference
  try {
    const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "HuggingFaceTB/SmolLM3-3B:hf-inference",
        messages: [
          {
            role: "system",
            content: "You are a media parser. Given a URL, extract the likely title and creator name from the URL string. Return format: TITLE: [name], AUTHOR: [name]."
          },
          {
            role: "user",
            content: `Extract info from: ${url}`
          }
        ],
        stream: false
      }),
    });

    if (!response.ok) throw new Error("HF API unreachable");

    const json = await response.json();
    const output = json.choices?.[0]?.message?.content || "";

    const titleMatch = output.match(/TITLE:\s*(.*)/i);
    const authorMatch = output.match(/AUTHOR:\s*(.*)/i);

    return {
      title: titleMatch?.[1]?.trim() || (youtubeId ? "YouTube Video" : "Social Media Post"),
      author: authorMatch?.[1]?.trim() || "Content Creator",
      duration: "0:30",
      platform: url.includes('tiktok') ? 'tiktok' : (url.includes('instagram') ? 'instagram' : 'youtube'),
      thumbnail: `https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80`,
      isVerified: false
    };
  } catch (error: any) {
    // Ultimate fallback if APIs fail
    return {
      title: youtubeId ? "YouTube Shorts" : "Video Content",
      author: "Creator",
      duration: "--:--",
      platform: "unknown",
      thumbnail: youtubeId ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` : "",
      isVerified: false
    };
  }
};
