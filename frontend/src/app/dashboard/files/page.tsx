'use client';

import { API_URL } from '@/lib/api';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Image as ImageIcon, File, Loader2, Download, Trash2, Search, Filter, Folder, Plus, Hash, X, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface FileRecord {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  category: string;
  tags: string[];
  createdAt: string;
  uploader: {
    firstName: string;
    lastName: string;
  };
}

interface FolderRecord {
  id: string;
  name: string;
  createdAt: string;
  _count?: {
    files: number;
  };
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [folders, setFolders] = useState<FolderRecord[]>([]);
  const [currentFolder, setCurrentFolder] = useState<FolderRecord | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [deleting, setDeleting] = useState<string | null>(null);
  
  // Modals state
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadTags, setUploadTags] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adrex_token');
      
      const [filesRes, foldersRes] = await Promise.all([
        fetch(`${API_URL}/api/files${currentFolder ? `?folderId=${currentFolder.id}` : '?folderId=root'}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/folders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (filesRes.ok) setFiles(await filesRes.json());
      if (foldersRes.ok) setFolders(await foldersRes.json());
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentFolder]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/folders`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newFolderName })
      });
      if (res.ok) {
        setNewFolderName('');
        setShowFolderModal(false);
        fetchData();
      }
    } catch (error) {
      console.error('Failed to create folder', error);
    }
  };

  const handleDeleteFolder = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this folder and all its files?')) return;
    try {
      const token = localStorage.getItem('adrex_token');
      await fetch(`${API_URL}/api/folders/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (currentFolder?.id === id) setCurrentFolder(null);
      fetchData();
    } catch (error) {
      console.error('Failed to delete folder', error);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('category', selectedFile.type.startsWith('image/') ? 'creative' : 'document');
    if (currentFolder) formData.append('folderId', currentFolder.id);
    if (uploadTags.trim()) {
      const tagsArray = uploadTags.split(',').map(t => t.trim()).filter(Boolean);
      formData.append('tags', JSON.stringify(tagsArray));
    }

    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/files/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        setShowUploadModal(false);
        setSelectedFile(null);
        setUploadTags('');
        await fetchData();
      } else {
        const err = await res.json();
        alert(`Upload failed: ${err.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Upload failed', error);
      alert('Upload failed. Check console for details.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (id: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    setDeleting(id);
    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/files/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setFiles(prev => prev.filter(f => f.id !== id));
      } else {
        alert('Failed to delete file');
      }
    } catch (error) {
      console.error('Delete failed', error);
      alert('Failed to delete file');
    } finally {
      setDeleting(null);
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

  const filteredFiles = files.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase()) || 
                       f.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = categoryFilter === 'All' ||
      (categoryFilter === 'Documents' && (f.category === 'document' || f.type.includes('pdf'))) ||
      (categoryFilter === 'Creatives' && f.category === 'creative') ||
      (categoryFilter === 'Invoices' && f.category === 'invoice');
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            <span 
              className={`cursor-pointer hover:text-purple-500 transition-colors ${!currentFolder ? 'text-purple-600 dark:text-purple-400' : ''}`}
              onClick={() => setCurrentFolder(null)}
            >
              Files
            </span>
            {currentFolder && (
              <>
                <ChevronRight size={20} className="text-zinc-400" />
                <span className="text-purple-600 dark:text-purple-400">{currentFolder.name}</span>
              </>
            )}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage contracts, invoices, and creatives.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowFolderModal(true)}
            className="bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-800 dark:text-white px-4 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2"
          >
            <Folder size={18} />
            <span className="hidden sm:inline">New Folder</span>
          </button>
          
          <button 
            onClick={() => setShowUploadModal(true)}
            className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2"
          >
            <Upload size={18} />
            Upload File
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input
            type="text"
            placeholder="Search files or tags..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['All', 'Documents', 'Creatives', 'Invoices'].map((filter) => (
            <button
              key={filter}
              onClick={() => setCategoryFilter(filter)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                categoryFilter === filter
                  ? 'bg-purple-600 text-white'
                  : 'bg-white dark:bg-white/5 hover:bg-zinc-50 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Folders Grid */}
      {!currentFolder && !loading && folders.length > 0 && !search && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-4">Folders</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {folders.map(folder => (
              <motion.div
                key={folder.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => setCurrentFolder(folder)}
                className="bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl p-4 cursor-pointer hover:border-purple-500/30 transition-all flex items-center justify-between group shadow-sm"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 bg-purple-500/10 rounded-lg text-purple-600 dark:text-purple-400">
                    <Folder size={20} className="fill-current opacity-20" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{folder.name}</p>
                    <p className="text-[10px] text-zinc-500">{folder._count?.files || 0} files</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => handleDeleteFolder(folder.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 rounded-md text-red-500 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* File Grid */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="animate-spin text-purple-500" size={32} />
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="bg-white/50 dark:bg-white/5 rounded-2xl border border-zinc-200 dark:border-white/10 p-12 text-center backdrop-blur-sm">
          <div className="w-16 h-16 bg-zinc-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="text-zinc-400" size={32} />
          </div>
          <h3 className="text-lg font-medium text-zinc-800 dark:text-white mb-2">
            {search || categoryFilter !== 'All' ? 'No files match your filters' : 'No files in this folder'}
          </h3>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6">
            {search || categoryFilter !== 'All' ? 'Try adjusting your search or filter criteria.' : 'Upload your first document or creative here.'}
          </p>
          {!search && categoryFilter === 'All' && (
            <button onClick={() => setShowUploadModal(true)} className="text-purple-600 dark:text-purple-400 hover:text-purple-500 font-medium">
              Upload a file
            </button>
          )}
        </div>
      ) : (
        <div>
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-4">Files</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFiles.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-white/5 rounded-2xl p-5 border border-zinc-200 dark:border-white/10 hover:border-purple-500/30 transition-all group shadow-sm"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-zinc-50 dark:bg-white/5 flex items-center justify-center border border-zinc-100 dark:border-white/10">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                    <a 
                      href={`${API_URL}${file.url}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-1.5 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-lg text-zinc-400 hover:text-zinc-800 dark:hover:text-white"
                    >
                      <Download size={16} />
                    </a>
                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      disabled={deleting === file.id}
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-lg text-zinc-400 hover:text-red-500 dark:hover:text-red-400 ml-1 disabled:opacity-50"
                    >
                      {deleting === file.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </div>
                
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-white truncate mb-2" title={file.name}>
                  {file.name}
                </h3>

                {/* Tags */}
                {file.tags && file.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {file.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-[10px] font-medium">
                        <Hash size={10} />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-auto text-xs text-zinc-500">
                  <span>{formatSize(file.size)}</span>
                  <span className="capitalize px-2 py-0.5 rounded bg-zinc-100 dark:bg-white/5">{file.category}</span>
                </div>
                
                <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-white/10 flex items-center justify-between text-xs text-zinc-400">
                  <span>{file.uploader.firstName} {file.uploader.lastName}</span>
                  <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showFolderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl p-6 w-full max-w-md shadow-xl"
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold text-zinc-800 dark:text-white">Create New Folder</h3>
                <button onClick={() => setShowFolderModal(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <input
                type="text"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                placeholder="Folder Name (e.g. Q3 Campaigns)"
                className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 mb-6"
                autoFocus
              />
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowFolderModal(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors">
                  Cancel
                </button>
                <button 
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim()}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Create Folder
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl p-6 w-full max-w-md shadow-xl"
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold text-zinc-800 dark:text-white">Upload File</h3>
                <button onClick={() => setShowUploadModal(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white">
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Select File</label>
                  <input
                    type="file"
                    onChange={e => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full text-sm text-zinc-500 dark:text-zinc-400
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-xl file:border-0
                      file:text-sm file:font-semibold
                      file:bg-purple-50 file:text-purple-700
                      dark:file:bg-purple-500/20 dark:file:text-purple-300
                      hover:file:bg-purple-100 dark:hover:file:bg-purple-500/30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Tags (optional)
                  </label>
                  <input
                    type="text"
                    value={uploadTags}
                    onChange={e => setUploadTags(e.target.value)}
                    placeholder="e.g. invoice, urgent, clientA (comma separated)"
                    className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button onClick={() => setShowUploadModal(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors">
                  Cancel
                </button>
                <button 
                  onClick={handleFileUpload}
                  disabled={!selectedFile || uploading}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  Upload
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
