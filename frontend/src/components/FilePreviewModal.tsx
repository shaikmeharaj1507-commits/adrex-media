'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, File as FileIcon, Loader2, ChevronLeft, ChevronRight, FileArchive, FileVideo, FileAudio, FileImage, ExternalLink } from 'lucide-react';
import { API_URL } from '@/lib/api';

interface FileData {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  createdAt: string;
  user?: { firstName: string; lastName: string };
}

interface FilePreviewModalProps {
  file: FileData | null;
  files: FileData[];
  onClose: () => void;
  onNavigate: (file: FileData) => void;
}

export default function FilePreviewModal({ file, files, onClose, onNavigate }: FilePreviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  useEffect(() => {
    if (file) {
      setLoading(true);
      setError(false);
    }
  }, [file]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!file) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [file, files, onClose]);

  if (!file) return null;

  const currentIndex = files.findIndex(f => f.id === file.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < files.length - 1;

  const handlePrev = () => {
    if (hasPrev) onNavigate(files[currentIndex - 1]);
  };

  const handleNext = () => {
    if (hasNext) onNavigate(files[currentIndex + 1]);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileCategory = (mime: string) => {
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/')) return 'video';
    if (mime.startsWith('audio/')) return 'audio';
    if (mime === 'application/pdf') return 'pdf';
    if (mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('csv')) return 'spreadsheet';
    if (mime.includes('document') || mime.includes('word') || mime === 'text/plain') return 'document';
    if (mime.includes('presentation') || mime.includes('powerpoint')) return 'presentation';
    if (mime.includes('zip') || mime.includes('tar') || mime.includes('rar')) return 'archive';
    return 'other';
  };

  const category = getFileCategory(file.mimeType);

  const getIconForCategory = (cat: string) => {
    switch (cat) {
      case 'image': return <FileImage size={48} className="text-blue-400" />;
      case 'video': return <FileVideo size={48} className="text-purple-400" />;
      case 'audio': return <FileAudio size={48} className="text-amber-400" />;
      case 'pdf': return <FileText size={48} className="text-red-400" />;
      case 'spreadsheet': return <FileText size={48} className="text-emerald-400" />;
      case 'document': return <FileText size={48} className="text-blue-400" />;
      case 'archive': return <FileArchive size={48} className="text-orange-400" />;
      default: return <FileIcon size={48} className="text-zinc-400" />;
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderPreviewContent = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-6">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
            <X size={32} className="text-destructive" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Preview Failed</h3>
          <p className="text-muted-foreground max-w-md">The file could not be loaded for preview. You can try downloading it instead.</p>
          <button onClick={handleDownload} className="mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center gap-2 hover:bg-primary/90 transition-all">
            <Download size={18} /> Download File
          </button>
        </div>
      );
    }

    switch (category) {
      case 'image':
        return (
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {loading && <Loader2 size={32} className="animate-spin text-primary absolute" />}
            <img 
              src={file.url} 
              alt={file.name} 
              className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
              onLoad={() => setLoading(false)}
              onError={() => { setLoading(false); setError(true); }}
            />
          </div>
        );
      
      case 'video':
        return (
          <div className="w-full h-full flex items-center justify-center bg-black">
            <video 
              src={file.url} 
              controls 
              autoPlay 
              className="max-w-full max-h-full"
              onCanPlay={() => setLoading(false)}
              onError={() => { setLoading(false); setError(true); }}
            />
          </div>
        );
        
      case 'audio':
        return (
          <div className="flex flex-col items-center justify-center h-full w-full max-w-md mx-auto p-6 text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl shadow-amber-500/20 mb-8 animate-pulse">
              <FileAudio size={40} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-foreground truncate w-full mb-6">{file.name}</h3>
            <audio 
              src={file.url} 
              controls 
              className="w-full"
              onCanPlay={() => setLoading(false)}
              onError={() => { setLoading(false); setError(true); }}
            />
          </div>
        );

      case 'pdf':
        return (
          <div className="w-full h-full">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                <Loader2 size={32} className="animate-spin text-primary" />
              </div>
            )}
            <iframe 
              src={`${file.url}#toolbar=0`} 
              className="w-full h-full border-0 bg-white"
              onLoad={() => setLoading(false)}
              onError={() => { setLoading(false); setError(true); }}
            />
          </div>
        );

      // Fallback for unsupported preview types (documents, spreadsheets, archives, etc)
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="w-24 h-24 rounded-2xl bg-muted border border-border flex items-center justify-center mb-6 shadow-sm">
              {getIconForCategory(category)}
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2 break-all">{file.name}</h3>
            <p className="text-muted-foreground mb-6">Preview is not available for this file type ({file.mimeType || 'unknown'})</p>
            <button onClick={handleDownload} className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(124,92,255,0.3)]">
              <Download size={18} /> Download {formatSize(file.size)}
            </button>
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center animate-in fade-in duration-200">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-background/90 backdrop-blur-xl" onClick={onClose} />
        
        {/* Modal Container */}
        <div className="relative z-10 w-full h-full flex flex-col pointer-events-none">
          
          {/* Top Bar */}
          <div className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-white/10 bg-black/20 backdrop-blur-md shrink-0 pointer-events-auto">
            <div className="flex flex-col min-w-0 pr-4">
              <h2 className="text-sm font-semibold text-foreground truncate">{file.name}</h2>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatSize(file.size)}</span>
                <span>•</span>
                <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                {file.user && (
                  <>
                    <span>•</span>
                    <span>Uploaded by {file.user.firstName} {file.user.lastName}</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={() => window.open(file.url, '_blank')} 
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-foreground transition-all"
                title="Open in new tab"
              >
                <ExternalLink size={18} />
              </button>
              <button 
                onClick={handleDownload} 
                className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary transition-all"
                title="Download"
              >
                <Download size={18} />
              </button>
              <div className="w-px h-6 bg-white/10 mx-1" />
              <button 
                onClick={onClose} 
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center text-foreground transition-all"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Preview Area */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden pointer-events-auto">
            
            {/* Nav Buttons */}
            {hasPrev && (
              <button 
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                className="absolute left-4 z-20 w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 flex items-center justify-center text-white backdrop-blur-md transition-all hidden sm:flex"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            
            {hasNext && (
              <button 
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="absolute right-4 z-20 w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 flex items-center justify-center text-white backdrop-blur-md transition-all hidden sm:flex"
              >
                <ChevronRight size={24} />
              </button>
            )}

            {/* Content Container */}
            <div className="absolute inset-4 sm:inset-12 bg-card border border-border shadow-2xl rounded-2xl overflow-hidden flex items-center justify-center">
              {renderPreviewContent()}
            </div>
            
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
}
