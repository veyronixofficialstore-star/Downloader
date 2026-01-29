
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
  X,
  Layers
} from 'lucide-react';
import { analyzeUrl } from './services/geminiService';
import { VideoMetadata, DownloadStatus, DownloadOption } from './types';

const MOCK_OPTIONS: DownloadOption[] = [
  { id: '4k', format: 'MP4', quality: '4K (2160p)', size: '184.2 MB' },
  { id: '2k', format: 'MP4', quality: '2K (1440p)', size: '92.5 MB' },
  { id: '1', format: 'MP4', quality: '1080p', size: '42.5 MB' },
  { id: '2', format: 'MP4', quality: '720p', size: '24.1 MB' },
  { id: '3', format: 'MP4', quality: '480p', size: '12.8 MB' },
  { id: '4', format: 'MP4', quality: '360p', size: '8.4 MB' },
  { id: '5', format: 'MP3', quality: '320kbps (High)', size: '4.2 MB' },
  { id: '6', format: 'MP3', quality: '128kbps (Standard)', size: '1.8 MB' },
];

const App: React.FC = () => {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<DownloadStatus>(DownloadStatus.IDLE);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [activeDownloadId, setActiveDownloadId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateUrl = (testUrl: string) => {
    const socialPatterns = [/youtube\.com/, /youtu\.be/, /tiktok\.com/, /instagram\.com/];
    return socialPatterns.some(pattern => pattern.test(testUrl.toLowerCase()));
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        setError(null);
        setMetadata(null);
        setStatus(DownloadStatus.IDLE);
      }
    } catch (err) {
      if (inputRef.current) inputRef.current.focus();
    }
  };

  const handleClear = () => {
    setUrl('');
    setError(null);
    setMetadata(null);
    setStatus(DownloadStatus.IDLE);
    setProgress(0);
    setActiveDownloadId(null);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleAnalyze = async () => {
    if (!url.trim()) return;

    if (!validateUrl(url)) {
      setError("Please enter a valid YouTube, TikTok, or Instagram link.");
      setStatus(DownloadStatus.ERROR);
      return;
    }
    
    setStatus(DownloadStatus.ANALYZING);
    setError(null);
    setMetadata(null);
    setProgress(0);

    try {
      const data = await analyzeUrl(url);
      setMetadata(data);
      setStatus(DownloadStatus.READY);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred while analyzing the link.');
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
        }, 2000);
      }
      setProgress(Math.floor(currentProgress));
    }, 200);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col items-center p-4 md:p-8 selection:bg-blue-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600 blur-[120px] rounded-full animate-pulse delay-700"></div>
      </div>

      <header className="relative w-full max-w-4xl flex flex-col items-center mb-12 z-10">
        <div className="flex items-center gap-3 mb-4 group">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl shadow-blue-500/20 group-hover:scale-110 transition-transform duration-500">
            <Zap className="w-8 h-8 text-white fill-current" />
          </div>
          <h1 className="text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500">
            AnyStream
          </h1>
        </div>
        <p className="text-slate-400 text-center max-w-lg font-medium">
          Universal media downloader for <span className="text-red-400">YouTube</span>, <span className="text-pink-400">Instagram</span>, and <span className="text-cyan-400">TikTok</span>.
        </p>
      </header>

      <main className="relative w-full max-w-2xl space-y-8 z-10">
        <section className="bg-slate-900/50 backdrop-blur-xl border border-white/10 p-2 rounded-[2rem] shadow-2xl">
          <div className="flex flex-col gap-3">
            <div className="relative group">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                <LinkIcon className="w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input 
                ref={inputRef}
                type="text"
                placeholder="Paste media link here..."
                className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl pl-14 pr-12 py-5 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-200 placeholder:text-slate-600"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              />
              {url && (
                <button onClick={handleClear} className="absolute inset-y-0 right-5 flex items-center text-slate-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button onClick={handlePaste} className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-4 rounded-xl font-bold transition-all border border-slate-700/50 active:scale-95">
                <Clipboard className="w-5 h-5" /> Paste
              </button>
              <button onClick={handleAnalyze} disabled={status === DownloadStatus.ANALYZING || !url} className="flex-[2] flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-4 rounded-xl font-black shadow-lg shadow-blue-500/30 transition-all active:scale-95">
                {status === DownloadStatus.ANALYZING ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                <span>ANALYZE LINK</span>
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="flex items-start gap-4 bg-red-500/10 border border-red-500/30 text-red-200 p-5 rounded-2xl animate-in zoom-in-95">
            <AlertCircle className="w-6 h-6 flex-shrink-0 text-red-500" />
            <div className="flex-1">
              <p className="font-bold mb-1">Analysis Error</p>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          </div>
        )}

        {status === DownloadStatus.ANALYZING && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-16 h-16 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-blue-400 font-bold tracking-widest text-xs uppercase animate-pulse">Extracting Media Data...</p>
          </div>
        )}

        {metadata && (status === DownloadStatus.READY || status === DownloadStatus.DOWNLOADING || status === DownloadStatus.COMPLETED) && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-slate-900 border border-white/5 rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl">
              <div className="w-full md:w-56 aspect-video md:aspect-square bg-slate-800 shrink-0">
                <img src={metadata.thumbnail} alt={metadata.title} className="w-full h-full object-cover opacity-90" />
              </div>
              <div className="p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-md text-[10px] font-black uppercase border border-blue-500/20">{metadata.platform}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{metadata.duration}</span>
                  </div>
                  <h2 className="text-xl font-black text-white leading-tight line-clamp-2">{metadata.title}</h2>
                  <p className="text-blue-400 text-sm font-bold mt-1">@{metadata.author}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {MOCK_OPTIONS.map((option) => (
                <button 
                  key={option.id}
                  disabled={status === DownloadStatus.DOWNLOADING}
                  onClick={() => startDownload(option)}
                  className={`
                    p-4 rounded-2xl border transition-all flex items-center justify-between group
                    ${activeDownloadId === option.id ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-900/40 border-slate-800 hover:border-slate-600 hover:bg-slate-800'}
                    ${status === DownloadStatus.DOWNLOADING && activeDownloadId !== option.id ? 'opacity-40 pointer-events-none' : ''}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${option.format === 'MP4' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                      {option.format === 'MP4' ? <Video className="w-4 h-4" /> : <Music className="w-4 h-4" />}
                    </div>
                    <div className="text-left">
                      <h4 className="font-black text-sm text-slate-200">{option.quality}</h4>
                      <p className="text-[9px] text-slate-500 font-bold uppercase">{option.format} • {option.size}</p>
                    </div>
                  </div>
                  {activeDownloadId === option.id ? (
                    <span className="text-xs font-black text-blue-500">{progress}%</span>
                  ) : (
                    <Download className="w-4 h-4 text-slate-600 group-hover:text-blue-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {status === DownloadStatus.COMPLETED && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-blue-600 text-white px-6 py-3 rounded-full shadow-2xl animate-in slide-in-from-bottom-10 z-50">
            <CheckCircle className="w-5 h-5" />
            <span className="font-bold text-sm">DOWNLOAD COMPLETE!</span>
          </div>
        )}
      </main>

      <footer className="mt-auto py-8 text-center opacity-40">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">AnyStream • Multi-Format Media Extractor</p>
      </footer>
    </div>
  );
};

export default App;
