
import React, { useState, useRef, useEffect } from 'react';
import { 
  Download, 
  Clipboard, 
  Link as LinkIcon, 
  Video, 
  Music, 
  CheckCircle, 
  RefreshCw,
  Zap,
  X,
  ShieldCheck,
  Server,
  ZapOff,
  Loader2,
  Wifi,
  ExternalLink
} from 'lucide-react';
import { analyzeUrl, AnalysisResult } from './services/geminiService';
import { DownloadStatus, DownloadOption } from './types';

const DOWNLOAD_OPTIONS: DownloadOption[] = [
  { id: '1080', format: 'MP4', quality: '1080p Full HD', size: 'Original' },
  { id: '720', format: 'MP4', quality: '720p HD', size: 'Original' },
  { id: '480', format: 'MP4', quality: '480p SD', size: 'Original' },
  { id: '360', format: 'MP4', quality: '360p Mobile', size: 'Original' },
  { id: 'mp3', format: 'MP3', quality: 'MP3 Audio', size: 'Original' },
];

/**
 * High-Availability Global Mirrors.
 * These are the most stable endpoints for the Cobalt protocol.
 */
const MIRRORS = [
  'https://api.cobalt.tools/api/json',
  'https://cobalt.moe/api/json',
  'https://co.wuk.sh/api/json',
  'https://cobalt.v0lt.io/api/json'
];

/**
 * Standard CORS Proxies.
 * Used to bypass browser-side blocking (CORS) when mirrors don't allow direct fetch.
 */
const PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url='
];

const App: React.FC = () => {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<DownloadStatus>(DownloadStatus.IDLE);
  const [metadata, setMetadata] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [activeDownloadId, setActiveDownloadId] = useState<string | null>(null);
  const [mirrorIndex, setMirrorIndex] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    setUrl('');
    setMetadata(null);
    setStatus(DownloadStatus.IDLE);
    setError(null);
    setActiveDownloadId(null);
    setProgress(0);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
    } catch {
      inputRef.current?.focus();
    }
  };

  const handleProcess = async () => {
    if (!url.trim()) return;
    setStatus(DownloadStatus.ANALYZING);
    setError(null);
    try {
      const data = await analyzeUrl(url);
      setMetadata(data);
      setStatus(DownloadStatus.READY);
    } catch (err) {
      setError('Unable to analyze this link. Please check if it is valid.');
      setStatus(DownloadStatus.ERROR);
    }
  };

  const executeDownload = async (option: DownloadOption, attempt = 0) => {
    setStatus(DownloadStatus.DOWNLOADING);
    setProgress(10 + (attempt * 20));

    try {
      const activeMirror = MIRRORS[mirrorIndex % MIRRORS.length];
      
      // We use a simplified payload to maximize compatibility with older/newer mirrors
      const payload: any = {
        url: url.trim(),
        videoQuality: option.id === 'mp3' ? '720' : option.id,
        filenameStyle: 'pretty'
      };

      if (option.format === 'MP3') {
        payload.isAudioOnly = true;
      }

      // First try: Direct POST to mirror
      // Second try: Proxy-assisted POST
      const requestUrl = attempt % 2 === 0 
        ? activeMirror 
        : `${PROXIES[0]}${encodeURIComponent(activeMirror)}`;

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        // If 405 (Method Not Allowed) or 400, rotate mirror immediately
        if (attempt < MIRRORS.length * 2) {
          if (attempt % 2 !== 0) setMirrorIndex(prev => prev + 1);
          return executeDownload(option, attempt + 1);
        }
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'stream' || data.status === 'redirect' || data.status === 'success') {
        const downloadUrl = data.url || data.stream;
        if (downloadUrl) {
          window.open(downloadUrl, '_blank');
          setStatus(DownloadStatus.COMPLETED);
          setProgress(100);
        } else {
          throw new Error('No download link was generated.');
        }
      } else if (data.status === 'picker') {
        window.open(data.picker[0].url, '_blank');
        setStatus(DownloadStatus.COMPLETED);
        setProgress(100);
      } else {
        throw new Error(data.text || 'The server rejected this video request.');
      }
    } catch (e: any) {
      if (attempt < MIRRORS.length * 2) {
        setMirrorIndex(prev => prev + 1);
        return executeDownload(option, attempt + 1);
      }
      setError('Connection failed. This service might be temporarily unavailable. Please try again later.');
      setStatus(DownloadStatus.ERROR);
    } finally {
      setTimeout(() => {
        if (status !== DownloadStatus.ERROR) {
          setStatus(DownloadStatus.READY);
          setActiveDownloadId(null);
        }
      }, 3000);
    }
  };

  const startDownload = (option: DownloadOption) => {
    setActiveDownloadId(option.id);
    setError(null);
    executeDownload(option);
  };

  const currentHost = new URL(MIRRORS[mirrorIndex % MIRRORS.length]).hostname;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 flex flex-col items-center p-4 md:p-8">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-800 rounded-full blur-[120px]"></div>
      </div>

      <header className="relative w-full max-w-xl text-center mb-8 pt-6 z-10">
        <div className="inline-flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-blue-600 rounded-lg">
            <Zap className="w-5 h-5 text-white fill-current" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">AnyStream</h1>
        </div>
        <p className="text-slate-400 text-sm font-medium">Fast, Free Media Downloader</p>
      </header>

      <main className="relative w-full max-w-xl space-y-4 z-10">
        {/* Input Section */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-lg backdrop-blur-sm">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <LinkIcon className="w-4 h-4 text-slate-500" />
              </div>
              <input 
                ref={inputRef}
                type="text"
                placeholder="Paste YouTube, TikTok or IG link..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-10 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 outline-none transition-all text-sm text-slate-100"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleProcess()}
              />
              {url && (
                <button onClick={handleReset} className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={handlePaste} 
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 rounded-lg font-semibold text-xs transition-colors"
              >
                Paste Link
              </button>
              <button 
                onClick={handleProcess} 
                disabled={status === DownloadStatus.ANALYZING || !url} 
                className="flex-[2] bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2 rounded-lg font-bold text-xs shadow-md shadow-blue-900/20 flex items-center justify-center gap-2"
              >
                {status === DownloadStatus.ANALYZING ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Analyze Content
              </button>
            </div>
          </div>
        </div>

        {/* Error Messaging */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl flex gap-3 items-start animate-in fade-in slide-in-from-top-1">
            <ZapOff className="w-5 h-5 shrink-0 text-red-500" />
            <div className="flex-1">
              <p className="text-xs font-bold mb-0.5">Download Stopped</p>
              <p className="text-[11px] opacity-80 leading-relaxed">{error}</p>
              <button 
                onClick={() => { setMirrorIndex(prev => prev + 1); handleProcess(); }}
                className="mt-2 text-[10px] font-bold uppercase text-blue-400 hover:underline flex items-center gap-1"
              >
                Try Another Server <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {status === DownloadStatus.ANALYZING && (
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Searching Media...</p>
          </div>
        )}

        {/* Results Section */}
        {metadata && (status === DownloadStatus.READY || status === DownloadStatus.DOWNLOADING || status === DownloadStatus.COMPLETED) && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            {/* Metadata Card */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden flex flex-col sm:flex-row shadow-md">
              <div className="w-full sm:w-32 aspect-video sm:aspect-square bg-slate-800 shrink-0">
                <img 
                  src={metadata.thumbnail} 
                  alt={metadata.title} 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src.includes('maxresdefault')) target.src = target.src.replace('maxresdefault', 'hqdefault');
                  }}
                />
              </div>
              <div className="p-4 flex flex-col justify-center flex-1 min-w-0">
                <h2 className="text-sm font-bold text-white mb-0.5 truncate">{metadata.title}</h2>
                <p className="text-xs text-blue-400 font-semibold mb-2">{metadata.author}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <Server className="w-3 h-3" />
                  <span>Node: {currentHost}</span>
                </div>
              </div>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DOWNLOAD_OPTIONS.map((option) => (
                <button 
                  key={option.id}
                  disabled={status === DownloadStatus.DOWNLOADING}
                  onClick={() => startDownload(option)}
                  className={`
                    p-3 rounded-lg border flex items-center justify-between group transition-all
                    ${activeDownloadId === option.id ? 'bg-blue-600/10 border-blue-500' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'}
                    ${status === DownloadStatus.DOWNLOADING && activeDownloadId !== option.id ? 'opacity-40 grayscale' : ''}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-md ${option.format === 'MP4' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                      {option.format === 'MP4' ? <Video className="w-4 h-4" /> : <Music className="w-4 h-4" />}
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-200">{option.quality}</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">{option.format}</p>
                    </div>
                  </div>
                  
                  {activeDownloadId === option.id ? (
                    <div className="flex items-center gap-1.5 text-blue-400 text-xs font-bold">
                      {progress}% <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    </div>
                  ) : (
                    <Download className="w-4 h-4 text-slate-700 group-hover:text-blue-500 transition-colors" />
                  )}
                </button>
              ))}
            </div>

            <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800 text-[10px] text-slate-500 leading-relaxed italic">
              * Note: Larger files (1080p) may take a few seconds to process. Please don't close this window until the download starts.
            </div>
          </div>
        )}
      </main>

      <footer className="mt-auto py-8 text-center border-t border-slate-800/50 w-full max-w-xl">
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">AnyStream • Secure & Global</p>
      </footer>

      {/* Success Notification */}
      {status === DownloadStatus.COMPLETED && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-2.5 rounded-full shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-5 z-50">
          <CheckCircle className="w-4 h-4" />
          <span className="text-xs font-bold">Starting Download...</span>
        </div>
      )}
    </div>
  );
};

export default App;
