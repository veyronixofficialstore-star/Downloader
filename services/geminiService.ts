
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
}

/**
 * Analyzes the provided URL using Hugging Face Inference API.
 * This service now uses the user-provided HF router endpoint and token via environment variables.
 */
export const analyzeUrl = async (url: string): Promise<AnalysisResult> => {
  // Use the API key from environment (e.g. 1cf97b5cd4534d809ea47fb31860e4b7)
  const apiKey = process.env.API_KEY; 
  const youtubeId = getYouTubeId(url);
  
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
            content: "You are a specialized media metadata extractor. Extract information from the provided URL. Return ONLY the following format: TITLE: [title], AUTHOR: [creator], TIME: [duration]."
          },
          {
            role: "user",
            content: `Extract metadata for this URL: ${url}`
          }
        ],
        stream: false
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HF API Error: ${response.status} - ${errorText}`);
    }

    const json = await response.json();
    const output = json.choices?.[0]?.message?.content || "";

    // Parsing the LLM response
    const titleMatch = output.match(/TITLE:\s*(.*)/i);
    const authorMatch = output.match(/AUTHOR:\s*(.*)/i);
    const durationMatch = output.match(/TIME:\s*(\d+:?\d*)/i);

    // Basic cleaning and fallbacks
    const title = titleMatch?.[1]?.trim().split('\n')[0].replace(/,$/, '') || (youtubeId ? "YouTube Shorts Content" : "Media Content");
    const author = authorMatch?.[1]?.trim().split('\n')[0].replace(/,$/, '') || "Content Creator";
    const duration = durationMatch?.[1]?.trim() || "0:15";

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
      sources: [] // Search grounding is a Gemini-specific feature; omitted for standard HF models
    };
  } catch (error: any) {
    console.error("HF Inference Error:", error);
    if (youtubeId) {
      return {
        title: "YouTube Video",
        author: "Original Creator",
        duration: "--:--",
        platform: "youtube",
        thumbnail: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
        sources: []
      };
    }
    throw new Error("Target analysis failed. Verify your API token and connectivity.");
  }
};
