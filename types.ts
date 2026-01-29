
export type MediaPlatform = 'youtube' | 'tiktok' | 'instagram' | 'unknown';

export interface VideoMetadata {
  title: string;
  author: string;
  thumbnail: string;
  duration: string;
  platform: MediaPlatform;
}

export interface DownloadOption {
  id: string;
  format: 'MP4' | 'MP3';
  quality: string;
  size: string;
}

export enum DownloadStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  READY = 'READY',
  DOWNLOADING = 'DOWNLOADING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}
