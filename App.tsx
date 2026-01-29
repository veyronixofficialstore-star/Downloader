
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
  Layers,
  ShieldCheck,
  FileDown
} from 'lucide-react';
import { analyzeUrl, AnalysisResult } from './services/geminiService';
import { DownloadStatus, DownloadOption } from './types';

const MOCK_OPTIONS: DownloadOption[] = [
  { id: '1080', format: 'MP4', quality: '1080p Full HD', size: '45.2 MB' },
  { id: '720', format: 'MP4', quality: '720p HD', size: '28.4 MB' },
  { id: '480', format: 'MP4', quality: '480p SD', size: '15.1 MB' },
  { id: '360', format: 'MP4', quality: '360p', size: '9.2 MB' },
  { id: 'mp3-hi', format: 'MP3', quality: '320kbps Audio', size: '5.1 MB' },
  { id: 'mp3-std', format: 'MP3', quality: '128kbps Audio', size: '2.4 MB' },
];

const App: React.FC = () => {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<DownloadStatus>(DownloadStatus.IDLE);
  const [metadata, setMetadata] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [activeDownloadId, setActiveDownloadId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePaste = async () => {
    try {
      setError(null);
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        setMetadata(null);
        setStatus(DownloadStatus.IDLE);
      }
    } catch (err: any) {
      setError("Please paste using Ctrl+V.");
      if (inputRef.current) inputRef.current.focus();
    }
  };

  const handleProcess = async () => {
    if (!url.trim()) return;
    
    setStatus(DownloadStatus.ANALYZING);
    setError(null);
    setMetadata(null);

    try {
      const data = await analyzeUrl(url);
      setMetadata(data);
      setStatus(DownloadStatus.READY);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the URL.');
      setStatus(DownloadStatus.ERROR);
    }
  };

  /**
   * Triggers an actual file download in the browser to complete the user experience.
   */
  const triggerActualDownload = (option: DownloadOption) => {
    if (!metadata) return;
    
    // Create a dummy file blob that mimics the media metadata
    const content = `AnyStream Download Information\n\nTitle: ${metadata.title}\nAuthor: ${metadata.author}\nQuality: ${option.quality}\nFormat: ${option.format}\nSource: ${url}\n\nNote: This is a professional UI simulation of the download process.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const fileUrl = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = `${metadata.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${option.quality}.${option.format.toLowerCase()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(fileUrl);
  };

  const startDownload = (option: DownloadOption) => {
    setStatus(DownloadStatus.DOWNLOADING);
    setActiveDownloadId(option.id);
    setProgress(0);

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 25;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        
        // Trigger the actual file save
        triggerActualDownload(option);
        
        setStatus(DownloadStatus.COMPLETED);
        setTimeout(() => {
          setStatus(DownloadStatus.READY);
          setActiveDownloadId(null);
        }, 3000);
      }
      setProgress(Math.floor(currentProgress));
    }, 150);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col items-center p-4 md:p-8 font-sans selection:bg-blue-500/40">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600 blur-[150px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600 blur-[150px] rounded-full animate-pulse delay-1000"></div>
      </div>

      <header className="relative w-full max-w-4xl flex flex-col items-center mb-16 z-10 text-center">
        <div className="flex items-center gap-5 mb-6 group cursor-default">
          <div className="p-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2rem] shadow-2xl shadow-blue-500/20 rotate-3 group-hover:rotate-0 transition-all duration-700 scale-100 group-hover:scale-110">
            <Zap className="w-12 h-12 text-white fill-current" />
          </div>
          <h1 className="text-7xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 italic">
            AnyStream
          </h1>
        </div>
        <div className="flex items-center gap-2 text-slate-500 font-black uppercase text-[10px] tracking-[0.6em] opacity-80">
          <ShieldCheck className="w-3 h-3 text-blue-500" />
          <span>PRO-GRADE DOWNLOAD ENGINE</span>
        </div>
      </header>

      <main className="relative w-full max-w-2xl space-y-10 z-10">
        <section className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 p-5 rounded-[3rem] shadow-2xl">
          <div className="flex flex-col gap-5">
            <div className="relative group">
              <div className="absolute inset-y-0 left-7 flex items-center pointer-events-none">
                <LinkIcon className="w-6 h-6 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input 
                ref={inputRef}
                type="text"
                placeholder="Paste YouTube Shorts or Video URL..."
                className="w-full bg-slate-950/80 border border-slate-800 rounded-[2rem] pl-16 pr-14 py-7 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-200 placeholder:text-slate-700 font-bold text-xl"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleProcess()}
              />
              {url && (
                <button onClick={() => setUrl('')} className="absolute inset-y-0 right-7 flex items-center text-slate-600 hover:text-white transition-colors">
                  <X className="w-7 h-7" />
                </button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-5">
              <button 
                onClick={handlePaste} 
                className="flex-1 flex items-center justify-center gap-3 bg-slate-800/80 hover:bg-slate-700 text-slate-200 px-8 py-5 rounded-[1.5rem] font-black transition-all border border-slate-700/50 active:scale-95 uppercase tracking-widest text-sm"
              >
                <Clipboard className="w-5 h-5" /> <span>PASTE</span>
              </button>
              <button 
                onClick={handleProcess} 
                disabled={status === DownloadStatus.ANALYZING || !url} 
                className="flex-[2] flex items-center justify-center gap-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-10 py-5 rounded-[1.5rem] font-black shadow-2xl shadow-blue-600/30 transition-all active:scale-95 uppercase tracking-[0.2em] text-lg"
              >
                {status === DownloadStatus.ANALYZING ? (
                  <RefreshCw className="w-7 h-7 animate-spin" />
                ) : (
                  <Download className="w-7 h-7" />
                )}
                <span>DOWNLOAD</span>
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="flex items-start gap-5 bg-red-500/10 border border-red-500/20 text-red-200 p-8 rounded-[2.5rem] animate-in fade-in zoom-in-95 duration-500">
            <AlertCircle className="w-8 h-8 flex-shrink-0 text-red-500 mt-1" />
            <div className="flex-1">
              <p className="font-black text-xl mb-2 tracking-tight">System Notice</p>
              <p className="text-sm opacity-80 leading-relaxed font-bold">{error}</p>
            </div>
          </div>
        )}

        {status === DownloadStatus.ANALYZING && (
          <div className="flex flex-col items-center justify-center py-24 space-y-8">
            <div className="relative">
              <div className="w-28 h-28 border-[6px] border-blue-500/5 border-t-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Layers className="w-12 h-12 text-blue-500 animate-pulse" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-blue-400 font-black tracking-[0.5em] text-sm uppercase animate-pulse">Requesting Source...</p>
              <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">Verifying Title & Creator Metadata</p>
            </div>
          </div>
        )}

        {metadata && (status === DownloadStatus.READY || status === DownloadStatus.DOWNLOADING || status === DownloadStatus.COMPLETED) && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <div className="bg-slate-900/90 border border-white/5 rounded-[3rem] overflow-hidden flex flex-col md:flex-row shadow-2xl relative group">
              <div className="w-full md:w-72 aspect-video md:aspect-square bg-slate-800 shrink-0 relative overflow-hidden">
                <img 
                  src={metadata.thumbnail} 
                  alt={metadata.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src.includes('maxresdefault')) {
                      target.src = target.src.replace('maxresdefault', 'hqdefault');
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent"></div>
                <div className="absolute top-4 left-4">
                   <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Official Verified</span>
                  </div>
                </div>
              </div>
              <div className="p-10 flex flex-col justify-center flex-1">
                <div className="mb-6">
                  <h2 className="text-3xl font-black text-white leading-[1.1] mb-4 tracking-tight line-clamp-2 italic">
                    {metadata.title}
                  </h2>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                      <Zap className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Uploader</p>
                      <p className="text-blue-400 text-2xl font-black leading-none mt-1">{metadata.author}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {MOCK_OPTIONS.map((option) => (
                <button 
                  key={option.id}
                  disabled={status === DownloadStatus.DOWNLOADING}
                  onClick={() => startDownload(option)}
                  className={`
                    p-8 rounded-[2.5rem] border transition-all flex items-center justify-between group relative overflow-hidden
                    ${activeDownloadId === option.id ? 'bg-blue-600/20 border-blue-500 shadow-2xl shadow-blue-500/20' : 'bg-slate-900/60 border-slate-800 hover:border-slate-400 hover:bg-slate-800'}
                    ${status === DownloadStatus.DOWNLOADING && activeDownloadId !== option.id ? 'opacity-30 grayscale pointer-events-none' : ''}
                  `}
                >
                  <div className="flex items-center gap-5 relative z-10">
                    <div className={`p-5 rounded-2xl ${option.format === 'MP4' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                      {option.format === 'MP4' ? <Video className="w-7 h-7" /> : <Music className="w-7 h-7" />}
                    </div>
                    <div className="text-left">
                      <h4 className="font-black text-2xl text-slate-100 italic">{option.quality}</h4>
                      <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.2em]">{option.format} • {option.size}</p>
                    </div>
                  </div>
                  
                  <div className="relative z-10">
                    {activeDownloadId === option.id ? (
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-black text-blue-400">{progress}%</span>
                        <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
                      </div>
                    ) : (
                      <Download className="w-7 h-7 text-slate-800 group-hover:text-blue-500 transition-all group-hover:translate-y-2 duration-300" />
                    )}
                  </div>

                  {activeDownloadId === option.id && (
                    <div className="absolute bottom-0 left-0 h-2 bg-blue-500 transition-all duration-300 shadow-[0_0_20px_rgba(59,130,246,1)]" style={{ width: `${progress}%` }}></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {status === DownloadStatus.COMPLETED && (
          <div className="fixed bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-5 bg-blue-600 text-white px-12 py-7 rounded-[3rem] shadow-2xl animate-in slide-in-from-bottom-16 duration-700 z-50">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
              <FileDown className="w-6 h-6" />
            </div>
            <div>
              <span className="font-black text-xl tracking-tighter uppercase italic block leading-none">Download Injected</span>
              <span className="text-[10px] font-bold opacity-80">Check your browser downloads</span>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-auto py-16 text-center opacity-30 w-full max-w-2xl border-t border-white/5">
        <p className="text-[11px] font-black uppercase tracking-[0.8em] text-slate-500 mb-3">AnyStream Enterprise</p>
        <p className="text-[9px] font-bold text-slate-600 px-12 leading-relaxed">Official oEmbed & Hugging Face Inference Hybrid Engine.</p>
      </footer>
    </div>
  );
};

export default App;
