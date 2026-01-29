
import React, { useState, useRef } from 'react';
import { 
  Download, 
  Clipboard, 
  Link as LinkIcon, 
  Youtube, 
  Instagram, 
  Video, 
  Music, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Zap,
  Check,
  X
} from 'lucide-react';
import { analyzeUrl } from './services/geminiService';
import { VideoMetadata, DownloadStatus, DownloadOption } from './types';

const MOCK_OPTIONS: DownloadOption[] = [
  { id: '1', format: 'MP4', quality: '1080p', size: '42.5 MB' },
  { id: '2', format: 'MP4', quality: '720p', size: '24.1 MB' },
  { id: '3', format: 'MP4', quality: '480p', size: '12.8 MB' },
  { id: '4', format: 'MP4', quality: '360p', size: '8.4 MB' },
  { id: '5', format: 'MP3', quality: '320kbps', size: '4.2 MB' },
  { id: '6', format: 'MP3', quality: '128kbps', size: '1.8 MB' },
];

const App: React.FC = () => {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<DownloadStatus>(DownloadStatus.IDLE);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [activeDownloadId, setActiveDownloadId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePaste = async () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }

    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        setError(null);
        // Reset analysis state when a new link is pasted
        if (status !== DownloadStatus.IDLE) {
            setStatus(DownloadStatus.IDLE);
            setMetadata(null);
        }
      }
    } catch (err) {
      console.warn('Direct clipboard access denied, focusing input for manual paste.');
    }
  };

  const handleClear = () => {
    setUrl('');
    setError(null);
    setMetadata(null);
    setStatus(DownloadStatus.IDLE);
    setProgress(0);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    
    setStatus(DownloadStatus.ANALYZING);
    setError(null);
    setMetadata(null);
    setProgress(0);

    try {
      const data = await analyzeUrl(url);
      setMetadata(data);
      setStatus(DownloadStatus.READY);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not analyze link. Please check the URL and try again.');
      setStatus(DownloadStatus.ERROR);
    }
  };

  const startDownload = (option: DownloadOption) => {
    setStatus(DownloadStatus.DOWNLOADING);
    setActiveDownloadId(option.id);
    setProgress(0);

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 15;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setStatus(DownloadStatus.COMPLETED);
        setTimeout(() => {
          setStatus(DownloadStatus.READY);
          setActiveDownloadId(null);
        }, 3000);
      }
      setProgress(Math.floor(currentProgress));
    }, 400);
  };

  const reset = () => {
    setUrl('');
    setStatus(DownloadStatus.IDLE);
    setMetadata(null);
    setError(null);
    setProgress(0);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-4 md:p-8">
      <header className="w-full max-w-4xl flex flex-col items-center mb-12">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
            <Zap className="w-8 h-8 text-white fill-current" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
            AnyStream
          </h1>
        </div>
        <p className="text-slate-400 text-center max-w-lg">
          Download high-quality media from YouTube, TikTok, and Instagram in seconds. MP4 or MP3 up to 4K resolution.
        </p>
      </header>

      <main className="w-full max-w-2xl space-y-8">
        <section className="bg-slate-900 border border-slate-800 p-1.5 rounded-3xl shadow-2xl transition-all duration-300">
          <div className="flex flex-col gap-2">
            <div className="relative group flex-1">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <LinkIcon className="w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input 
                ref={inputRef}
                type="text"
                placeholder="Paste link here..."
                className="w-full bg-slate-950 border-none rounded-2xl pl-12 pr-12 py-4 focus:ring-2 focus:ring-blue-500 transition-all text-slate-200"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              {url && (
                <button 
                  onClick={handleClear}
                  className="absolute inset-y-0 right-4 flex items-center text-slate-500 hover:text-white transition-colors"
                  aria-label="Clear input"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 p-1 md:p-0">
              <button 
                onClick={handlePaste}
                className="flex-1 min-w-[100px] flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-3.5 rounded-2xl font-semibold active:scale-95 transition-all"
                title="Paste from clipboard"
              >
                <Clipboard className="w-5 h-5" />
                <span>Paste</span>
              </button>

              <button 
                onClick={handleClear}
                className="flex-1 min-w-[100px] flex items-center justify-center gap-2 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-200 px-4 py-3.5 rounded-2xl font-semibold active:scale-95 transition-all"
                title="Clear all"
              >
                <X className="w-5 h-5" />
                <span>Clear</span>
              </button>

              <button 
                onClick={handleAnalyze}
                disabled={status === DownloadStatus.ANALYZING || !url}
                className="flex-[2] min-w-[150px] flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white px-6 py-3.5 rounded-2xl font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95"
              >
                {status === DownloadStatus.ANALYZING ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
                <span>Get Media</span>
              </button>
            </div>
          </div>
        </section>

        {status === DownloadStatus.IDLE && (
          <div className="flex justify-center items-center gap-8 py-4 grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
            <div className="flex flex-col items-center gap-2">
              <Youtube className="w-8 h-8 text-red-500" />
              <span className="text-xs font-medium uppercase tracking-widest opacity-70">Shorts</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Instagram className="w-8 h-8 text-pink-500" />
              <span className="text-xs font-medium uppercase tracking-widest opacity-70">Reels</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Video className="w-8 h-8 text-cyan-400" />
              <span className="text-xs font-medium uppercase tracking-widest opacity-70">TikTok</span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300 shadow-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {status === DownloadStatus.ANALYZING && (
          <div className="flex flex-col items-center justify-center py-12 space-y-6 animate-pulse">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <p className="text-blue-400 font-medium tracking-wide">Analyzing your media...</p>
          </div>
        )}

        {metadata && (status === DownloadStatus.READY || status === DownloadStatus.DOWNLOADING || status === DownloadStatus.COMPLETED) && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-xl ring-1 ring-white/5">
              <div className="w-full md:w-56 h-40 md:h-auto overflow-hidden">
                <img 
                  src={metadata.thumbnail} 
                  alt={metadata.title} 
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="flex-1 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {metadata.platform === 'youtube' && <Youtube className="w-4 h-4 text-red-500" />}
                    {metadata.platform === 'instagram' && <Instagram className="w-4 h-4 text-pink-500" />}
                    {metadata.platform === 'tiktok' && <Video className="w-4 h-4 text-cyan-400" />}
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                      {metadata.platform} Media Found
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mb-1 line-clamp-2 leading-snug">
                    {metadata.title}
                  </h2>
                  <p className="text-slate-400 text-sm font-medium">@{metadata.author}</p>
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <div className="px-3 py-1 bg-slate-800 rounded-lg text-xs font-mono text-slate-300">
                    {metadata.duration}
                  </div>
                  <button onClick={reset} className="text-xs font-medium text-slate-500 hover:text-blue-400 transition-colors underline underline-offset-4">
                    Change link
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MOCK_OPTIONS.map((option) => (
                <div 
                  key={option.id}
                  className={`
                    p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between group
                    ${activeDownloadId === option.id 
                      ? 'bg-blue-600/10 border-blue-500/50 ring-1 ring-blue-500/20' 
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'}
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl transition-colors ${option.format === 'MP4' ? 'bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20'}`}>
                      {option.format === 'MP4' ? <Video className="w-5 h-5" /> : <Music className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-200">{option.quality}</h4>
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-tighter">{option.format} • {option.size}</p>
                    </div>
                  </div>

                  {activeDownloadId === option.id ? (
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs font-bold text-blue-400">{progress}%</span>
                      <div className="w-24 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-300 ease-out"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => startDownload(option)}
                      disabled={status === DownloadStatus.DOWNLOADING}
                      className="bg-slate-800 group-hover:bg-blue-600 text-slate-400 group-hover:text-white p-2.5 rounded-xl transition-all shadow-sm active:scale-90 disabled:opacity-30"
                    >
                      {status === DownloadStatus.COMPLETED && activeDownloadId === option.id ? (
                        <Check className="w-5 h-5 animate-in zoom-in" />
                      ) : (
                        <Download className="w-5 h-5" />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {status === DownloadStatus.COMPLETED && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-2xl shadow-emerald-500/40 animate-in fade-in slide-in-from-bottom-8 duration-500 z-50">
            <CheckCircle className="w-5 h-5" />
            <span className="font-bold">Download Completed!</span>
          </div>
        )}
      </main>

      <footer className="mt-auto py-8 text-slate-600 text-sm font-medium text-center space-y-2">
        <p>© 2024 AnyStream • Rapid Media Downloader</p>
        <p className="text-slate-700 text-[10px] uppercase tracking-widest font-bold">Fast • Reliable • Multi-Platform</p>
      </footer>
    </div>
  );
};

export default App;
