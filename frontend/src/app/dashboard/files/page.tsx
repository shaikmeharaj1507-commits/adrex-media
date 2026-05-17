'use client';

import { API_URL } from '@/lib/api';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Image as ImageIcon, File, Loader2, Download, Trash2, Search, Filter } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface FileRecord {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  category: string;
  createdAt: string;
  uploader: {
    firstName: string;
    lastName: string;
  };
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async () => {
    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/files`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setFiles(await res.json());
    } catch (error) {
      console.error('Failed to fetch files', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', file.type.startsWith('image/') ? 'creative' : 'document');

    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/files/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        await fetchFiles(); // Refresh list
      }
    } catch (error) {
      console.error('Upload failed', error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="text-purple-400" />;
    if (type.includes('pdf')) return <FileText className="text-red-400" />;
    return <File className="text-blue-400" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">File Management</h1>
          <p className="text-zinc-400 mt-1">Manage contracts, invoices, and campaign creatives.</p>
        </div>
        <div className="flex gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            Upload File
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="Search files..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
        </div>
        <div className="flex gap-2">
          {['All', 'Documents', 'Creatives', 'Invoices'].map((filter) => (
            <button key={filter} className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-zinc-300 transition-colors whitespace-nowrap">
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* File Grid */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="animate-spin text-purple-500" size={32} />
        </div>
      ) : files.length === 0 ? (
        <div className="glassmorphism rounded-2xl border border-white/10 p-12 text-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="text-zinc-500" size={32} />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No files uploaded yet</h3>
          <p className="text-zinc-400 mb-6">Upload your first contract, creative, or invoice.</p>
          <button onClick={() => fileInputRef.current?.click()} className="text-purple-400 hover:text-purple-300 font-medium">
            Browse files
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {files.map((file) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glassmorphism rounded-2xl p-5 border border-white/10 hover:border-purple-500/30 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  {getFileIcon(file.type)}
                </div>
                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                  <a 
                    href={`${API_URL}${file.url}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white"
                  >
                    <Download size={16} />
                  </a>
                  <button className="p-1.5 hover:bg-red-500/20 rounded-lg text-zinc-400 hover:text-red-400 ml-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <h3 className="text-sm font-semibold text-white truncate mb-1" title={file.name}>
                {file.name}
              </h3>
              
              <div className="flex items-center justify-between mt-4 text-xs text-zinc-500">
                <span>{formatSize(file.size)}</span>
                <span className="capitalize px-2 py-0.5 rounded bg-white/5">{file.category}</span>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
                <span>{file.uploader.firstName} {file.uploader.lastName}</span>
                <span>{new Date(file.createdAt).toLocaleDateString()}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
