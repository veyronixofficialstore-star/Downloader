
import React, { useState, useRef } from 'react';
import { 
  Download, 
  Clipboard, 
  Link as LinkIcon, 
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
  { id: '1080', format: 'MP4', quality: '1080p Full HD', size: '42.5 MB' },
  { id: '720', format: 'MP4', quality: '720p HD', size: '24.1 MB' },
  { id: '480', format: 'MP4', quality: '480p SD', size: '12.8 MB' },
  { id: '360', format: 'MP4', quality: '360p', size: '8.4 MB' },
  { id: '240', format: 'MP4', quality: '240p', size: '4.2 MB' },
  { id: '144', format: 'MP4', quality: '144p', size: '2.1 MB' },
  { id: 'mp3-hi', format: 'MP3', quality: '320kbps Audio', size: '4.2 MB' },
  { id: 'mp3-std', format: 'MP3', quality: '128kbps Audio', size: '1.8 MB' },
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
      setError("Please enter a valid media link.");
      setStatus(DownloadStatus.ERROR);
      return;
    }
    
    setStatus(DownloadStatus.ANALYZING);
    setError(null);
    setMetadata(null);

    try {
      const data = await analyzeUrl(url);
      setMetadata(data);
      setStatus(DownloadStatus.READY);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred while processing the link.');
      setStatus(DownloadStatus.ERROR);
    }
  };

  const startDownload = (option: DownloadOption) => {
    setStatus(DownloadStatus.DOWNLOADING);
    setActiveDownloadId(option.id);
    setProgress(0);

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 18;
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
    }, 150);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col items-center p-4 md:p-8 selection:bg-blue-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600 blur-[120px] rounded-full animate-pulse delay-700"></div>
      </div>

      <header className="relative w-full max-w-4xl flex flex-col items-center mb-12 z-10 text-center">
        <div className="flex items-center gap-4 mb-4 group cursor-default">
          <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl shadow-2xl shadow-blue-500/20 group-hover:scale-110 transition-transform duration-500 rotate-3 group-hover:rotate-0">
            <Zap className="w-10 h-10 text-white fill-current" />
          </div>
          <h1 className="text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500">
            AnyStream
          </h1>
        </div>
        <p className="text-slate-400 font-medium tracking-tight">
          High-performance media extraction and conversion.
        </p>
      </header>

      <main className="relative w-full max-w-2xl space-y-8 z-10">
        <section className="bg-slate-900/40 backdrop-blur-2xl border border-white/10 p-3 rounded-[2.5rem] shadow-2xl transition-all duration-300 hover:shadow-blue-500/5">
          <div className="flex flex-col gap-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                <LinkIcon className="w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input 
                ref={inputRef}
                type="text"
                placeholder="Paste your media link..."
                className="w-full bg-slate-950/80 border border-slate-800 rounded-3xl pl-16 pr-14 py-6 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-200 placeholder:text-slate-600 font-medium text-lg"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              />
              {url && (
                <button onClick={handleClear} className="absolute inset-y-0 right-6 flex items-center text-slate-500 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-4 px-2 pb-2">
              <button onClick={handlePaste} className="flex-1 flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 text-slate-200 px-6 py-4 rounded-2xl font-bold transition-all border border-slate-700/50 active:scale-95">
                <Clipboard className="w-5 h-5" /> <span>Paste</span>
              </button>
              <button 
                onClick={handleAnalyze} 
                disabled={status === DownloadStatus.ANALYZING || !url} 
                className="flex-[2] flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-blue-600/20 transition-all active:scale-95 group"
              >
                {status === DownloadStatus.ANALYZING ? (
                  <RefreshCw className="w-6 h-6 animate-spin" />
                ) : (
                  <Download className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                )}
                <span>DOWNLOAD</span>
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="flex items-start gap-4 bg-red-500/10 border border-red-500/20 text-red-200 p-6 rounded-3xl animate-in fade-in zoom-in-95 duration-300">
            <AlertCircle className="w-6 h-6 flex-shrink-0 text-red-500 mt-1" />
            <div className="flex-1">
              <p className="font-black text-lg mb-1 tracking-tight">Media Lookup Failed</p>
              <p className="text-sm opacity-80 leading-relaxed font-medium">{error}</p>
            </div>
          </div>
        )}

        {status === DownloadStatus.ANALYZING && (
          <div className="flex flex-col items-center justify-center py-16 space-y-6">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Layers className="w-8 h-8 text-blue-500 animate-pulse" />
              </div>
            </div>
            <p className="text-blue-400 font-black tracking-[0.2em] text-xs uppercase animate-pulse">Scanning Platform...</p>
          </div>
        )}

        {metadata && (status === DownloadStatus.READY || status === DownloadStatus.DOWNLOADING || status === DownloadStatus.COMPLETED) && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row shadow-2xl relative group">
              <div className="w-full md:w-64 aspect-video md:aspect-square bg-slate-800 shrink-0 relative overflow-hidden">
                <img 
                  src={metadata.thumbnail} 
                  alt={metadata.title} 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src.includes('hqdefault')) {
                      target.src = target.src.replace('hqdefault', '0');
                    } else if (!target.src.includes('unsplash')) {
                      target.src = 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80';
                    }
                  }}
                  className="w-full h-full object-cover opacity-100 group-hover:scale-105 transition-transform duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent opacity-60"></div>
              </div>
              <div className="p-8 flex flex-col justify-center flex-1">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 bg-slate-800 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest">{metadata.duration}</span>
                  </div>
                  <h2 className="text-2xl font-black text-white leading-tight mb-2 tracking-tight group-hover:text-blue-400 transition-colors line-clamp-3">
                    {metadata.title}
                  </h2>
                  <p className="text-blue-400/80 text-lg font-bold">by @{metadata.author}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {MOCK_OPTIONS.map((option) => (
                <button 
                  key={option.id}
                  disabled={status === DownloadStatus.DOWNLOADING}
                  onClick={() => startDownload(option)}
                  className={`
                    p-6 rounded-[1.5rem] border transition-all flex items-center justify-between group relative overflow-hidden
                    ${activeDownloadId === option.id ? 'bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/10' : 'bg-slate-900/60 border-slate-800 hover:border-slate-500 hover:bg-slate-800'}
                    ${status === DownloadStatus.DOWNLOADING && activeDownloadId !== option.id ? 'opacity-40 grayscale pointer-events-none' : ''}
                  `}
                >
                  <div className="flex items-center gap-4 relative z-10">
                    <div className={`p-3.5 rounded-2xl ${option.format === 'MP4' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                      {option.format === 'MP4' ? <Video className="w-5 h-5" /> : <Music className="w-5 h-5" />}
                    </div>
                    <div className="text-left">
                      <h4 className="font-black text-lg text-slate-100 group-hover:translate-x-1 transition-transform">{option.quality}</h4>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{option.format} • {option.size}</p>
                    </div>
                  </div>
                  
                  <div className="relative z-10">
                    {activeDownloadId === option.id ? (
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-blue-400">{progress}%</span>
                        <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                      </div>
                    ) : (
                      <Download className="w-5 h-5 text-slate-700 group-hover:text-white transition-all scale-90 group-hover:scale-110" />
                    )}
                  </div>

                  {activeDownloadId === option.id && (
                    <div className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-300 shadow-[0_0_10px_rgba(59,130,246,0.8)]" style={{ width: `${progress}%` }}></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {status === DownloadStatus.COMPLETED && (
          <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-blue-600 text-white px-10 py-5 rounded-3xl shadow-2xl animate-in slide-in-from-bottom-12 duration-500 z-50">
            <div className="bg-white/20 p-2 rounded-full">
              <CheckCircle className="w-6 h-6" />
            </div>
            <span className="font-black text-lg tracking-tight">READY TO DOWNLOAD!</span>
          </div>
        )}
      </main>

      <footer className="mt-auto py-12 text-center opacity-30 w-full max-w-2xl border-t border-white/5">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-2">AnyStream Systems Inc.</p>
        <p className="text-[9px] font-bold text-slate-600 px-10">All media rights belong to original creators. Use responsibly.</p>
      </footer>
    </div>
  );
};

export default App;
