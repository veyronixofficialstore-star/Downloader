
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

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
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
      setError(err.message || 'Could not analyze link. Check the link or your API key settings.');
      setStatus(DownloadStatus.ERROR);
    }
  };

  const startDownload = (option: DownloadOption) => {
    setStatus(DownloadStatus.DOWNLOADING);
    setActiveDownloadId(option.id);
    setProgress(0);

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 20;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setStatus(DownloadStatus.COMPLETED);
        setTimeout(() => {
          setStatus(DownloadStatus.READY);
          setActiveDownloadId(null);
        }, 2500);
      }
      setProgress(Math.floor(currentProgress));
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col items-center p-4 md:p-8 selection:bg-blue-500/30">
      {/* Background Decor */}
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
          The ultimate downloader for <span className="text-red-400">Shorts</span>, <span className="text-pink-400">Reels</span>, and <span className="text-cyan-400">TikToks</span>.
        </p>
      </header>

      <main className="relative w-full max-w-2xl space-y-8 z-10">
        <section className="bg-slate-900/50 backdrop-blur-xl border border-white/10 p-2 rounded-[2rem] shadow-2xl transition-all duration-300">
          <div className="flex flex-col gap-3">
            <div className="relative group">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                <LinkIcon className="w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input 
                ref={inputRef}
                type="text"
                placeholder="Paste media link here..."
                className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl pl-14 pr-12 py-5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-200 placeholder:text-slate-600 font-medium"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              />
              {url && (
                <button 
                  onClick={handleClear}
                  className="absolute inset-y-0 right-5 flex items-center text-slate-500 hover:text-white transition-colors p-1"
                  aria-label="Clear input"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={handlePaste}
                className="flex-1 min-w-[120px] flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-4 rounded-xl font-bold active:scale-95 transition-all border border-slate-700/50"
              >
                <Clipboard className="w-5 h-5" />
                <span>Paste</span>
              </button>

              <button 
                onClick={handleClear}
                className="flex items-center justify-center gap-2 bg-slate-800/50 hover:bg-red-500/10 hover:text-red-400 text-slate-400 px-6 py-4 rounded-xl font-bold active:scale-95 transition-all border border-slate-700/30"
              >
                <X className="w-5 h-5" />
                <span>Clear</span>
              </button>

              <button 
                onClick={handleAnalyze}
                disabled={status === DownloadStatus.ANALYZING || !url}
                className="flex-[2] min-w-[180px] flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-4 rounded-xl font-black shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:active:scale-100"
              >
                {status === DownloadStatus.ANALYZING ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
                <span>ANALYZE LINK</span>
              </button>
            </div>
          </div>
        </section>

        {status === DownloadStatus.IDLE && (
          <div className="flex justify-center items-center gap-10 py-6">
            <Youtube className="w-10 h-10 text-slate-800 hover:text-red-600 transition-colors duration-500" />
            <Instagram className="w-10 h-10 text-slate-800 hover:text-pink-600 transition-colors duration-500" />
            <Video className="w-10 h-10 text-slate-800 hover:text-cyan-500 transition-colors duration-500" />
          </div>
        )}

        {error && (
          <div className="flex items-start gap-4 bg-red-500/10 border border-red-500/30 text-red-200 p-5 rounded-2xl animate-in zoom-in-95 duration-300">
            <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5 text-red-500" />
            <div>
              <p className="font-bold mb-1">Could not analyze link</p>
              <p className="text-sm opacity-80 leading-relaxed">{error}</p>
              <button 
                onClick={() => window.open('https://aistudio.google.com/', '_blank')}
                className="mt-2 text-xs font-bold text-red-400 hover:underline"
              >
                Need an API Key? Get one here.
              </button>
            </div>
          </div>
        )}

        {status === DownloadStatus.ANALYZING && (
          <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="relative">
              <div className="w-24 h-24 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Layers className="w-8 h-8 text-blue-500 animate-pulse" />
              </div>
            </div>
            <p className="text-blue-400 font-black tracking-widest text-sm uppercase animate-pulse">Processing Media Metadata...</p>
          </div>
        )}

        {metadata && (status === DownloadStatus.READY || status === DownloadStatus.DOWNLOADING || status === DownloadStatus.COMPLETED) && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row shadow-2xl">
              <div className="w-full md:w-64 aspect-video md:aspect-square overflow-hidden bg-slate-800">
                <img 
                  src={metadata.thumbnail} 
                  alt={metadata.title} 
                  className="w-full h-full object-cover opacity-80"
                />
              </div>
              <div className="flex-1 p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-[10px] font-black tracking-widest uppercase border border-blue-500/20">
                      {metadata.platform}
                    </span>
                    <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                      Media Detected
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-white mb-2 line-clamp-2 leading-tight">
                    {metadata.title}
                  </h2>
                  <p className="text-blue-400 font-bold text-sm">@{metadata.author}</p>
                </div>
                <div className="flex items-center gap-4 mt-6">
                  <div className="px-4 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono font-bold text-slate-400">
                    {metadata.duration}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-12">
              {MOCK_OPTIONS.map((option) => (
                <button 
                  key={option.id}
                  disabled={status === DownloadStatus.DOWNLOADING}
                  onClick={() => startDownload(option)}
                  className={`
                    p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between group relative overflow-hidden
                    ${activeDownloadId === option.id 
                      ? 'bg-blue-600/20 border-blue-500 ring-2 ring-blue-500/20' 
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-500 hover:bg-slate-800'}
                    ${status === DownloadStatus.DOWNLOADING && activeDownloadId !== option.id ? 'opacity-40 grayscale pointer-events-none' : ''}
                  `}
                >
                  <div className="flex items-center gap-4 relative z-10">
                    <div className={`p-3 rounded-xl transition-colors ${option.format === 'MP4' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                      {option.format === 'MP4' ? <Video className="w-5 h-5" /> : <Music className="w-5 h-5" />}
                    </div>
                    <div className="text-left">
                      <h4 className="font-black text-slate-100 group-hover:text-blue-400 transition-colors">{option.quality}</h4>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{option.format} • {option.size}</p>
                    </div>
                  </div>

                  {activeDownloadId === option.id ? (
                    <div className="relative z-10 flex flex-col items-end gap-1">
                      <span className="text-xs font-black text-blue-400">{progress}%</span>
                      <div className="w-20 h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-300 ease-out shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-950 p-3 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <Download className="w-5 h-5" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {status === DownloadStatus.COMPLETED && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-blue-600 text-white px-8 py-4 rounded-full shadow-[0_10px_40px_rgba(37,99,235,0.4)] animate-in slide-in-from-bottom-10 duration-500 z-50">
            <CheckCircle className="w-6 h-6" />
            <span className="font-black tracking-tight">MEDIA DOWNLOADED SUCCESSFULLY!</span>
          </div>
        )}
      </main>

      <footer className="mt-auto py-10 w-full max-w-4xl border-t border-white/5 flex flex-col items-center gap-4">
        <div className="flex gap-6 opacity-30">
          <Youtube className="w-5 h-5" />
          <Instagram className="w-5 h-5" />
          <Video className="w-5 h-5" />
        </div>
        <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.3em] text-center">
          AnyStream • High Speed Media Extraction • Built for Social Creators
        </p>
      </footer>
    </div>
  );
};

export default App;
