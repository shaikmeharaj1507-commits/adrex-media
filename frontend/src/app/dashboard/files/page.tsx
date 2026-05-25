'use client';

import { API_URL } from '@/lib/api';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, FileText, Image as ImageIcon, File, Loader2, 
  Download, Trash2, Search, Folder as FolderIcon, 
  FolderOpen, FolderPlus, ChevronRight, X 
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface FileRecord {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  category: string;
  folderId: string | null;
  tags: string;
  createdAt: string;
  uploader: {
    firstName: string;
    lastName: string;
  };
}

interface FolderRecord {
  id: string;
  name: string;
  tags: string;
  createdAt: string;
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [folders, setFolders] = useState<FolderRecord[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  // Modals and inputs
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderTags, setNewFolderTags] = useState('');
  const [fileTags, setFileTags] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFolders = async () => {
    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/files/folders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setFolders(await res.json());
    } catch (error) {
      console.error('Failed to fetch folders', error);
    }
  };

  const fetchFiles = async () => {
    try {
      const token = localStorage.getItem('adrex_token');
      const folderQuery = currentFolderId !== 'root' ? `folderId=${currentFolderId}` : 'folderId=root';
      const res = await fetch(`${API_URL}/api/files?${folderQuery}`, {
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
    fetchFolders();
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchFiles();
  }, [currentFolderId]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/files/folders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newFolderName,
          tags: newFolderTags.replace(/#/g, '').replace(/\s+/g, '').trim(),
        })
      });

      if (res.ok) {
        setNewFolderName('');
        setNewFolderTags('');
        setShowCreateFolder(false);
        await fetchFolders();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create folder');
      }
    } catch (error) {
      console.error('Failed to create folder', error);
    }
  };

  const handleDeleteFolder = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this folder? All files inside it will be permanently deleted.')) return;
    setDeletingFolder(id);

    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/files/folders/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setFolders(prev => prev.filter(f => f.id !== id));
        if (currentFolderId === id) {
          setCurrentFolderId('root');
        }
      } else {
        alert('Failed to delete folder');
      }
    } catch (error) {
      console.error('Delete failed', error);
    } finally {
      setDeletingFolder(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', file.type.startsWith('image/') ? 'creative' : 'document');
    formData.append('folderId', currentFolderId);
    formData.append('tags', fileTags.replace(/#/g, '').replace(/\s+/g, '').trim());

    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/files/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        setFileTags('');
        await fetchFiles();
      } else {
        const err = await res.json();
        alert(`Upload failed: ${err.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Upload failed', error);
      alert('Upload failed. Check console for details.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
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

  // Helper to parse hashtags
  const renderTags = (tagsStr: string) => {
    if (!tagsStr) return null;
    return tagsStr.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
      <button
        key={tag}
        onClick={(e) => { e.stopPropagation(); setSearch(`#${tag}`); }}
        className="px-2 py-0.5 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 text-[10px]"
      >
        #{tag}
      </button>
    ));
  };

  const isTagSearch = search.startsWith('#');
  const cleanSearch = isTagSearch ? search.substring(1).toLowerCase() : search.toLowerCase();

  const filteredFiles = files.filter(f => {
    const matchSearch = isTagSearch 
      ? f.tags?.toLowerCase().includes(cleanSearch)
      : f.name.toLowerCase().includes(cleanSearch) || f.tags?.toLowerCase().includes(cleanSearch);

    const matchCategory = categoryFilter === 'All' ||
      (categoryFilter === 'Documents' && (f.category === 'document' || f.type.includes('pdf'))) ||
      (categoryFilter === 'Creatives' && f.category === 'creative') ||
      (categoryFilter === 'Invoices' && f.category === 'invoice');
    return matchSearch && matchCategory;
  });

  const filteredFolders = folders.filter(f => {
    return isTagSearch
      ? f.tags?.toLowerCase().includes(cleanSearch)
      : f.name.toLowerCase().includes(cleanSearch) || f.tags?.toLowerCase().includes(cleanSearch);
  });

  const activeFolderName = folders.find(f => f.id === currentFolderId)?.name;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            File Management
          </h1>
          <p className="text-zinc-400 mt-1">Manage contracts, invoices, and campaign creatives in secure folders.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Quick Hashtags Upload Field */}
          <div className="relative">
            <input 
              type="text"
              placeholder="Hashtags for upload (e.g. #creative)"
              value={fileTags}
              onChange={e => setFileTags(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50 w-56"
            />
          </div>
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
            className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 disabled:opacity-50 text-sm"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            Upload File
          </button>
          {currentFolderId === 'root' && (
            <button 
              onClick={() => setShowCreateFolder(true)}
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 text-sm"
            >
              <FolderPlus size={16} className="text-purple-400" />
              New Folder
            </button>
          )}
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      {currentFolderId !== 'root' && (
        <div className="flex items-center gap-2 text-sm text-zinc-400 py-1 bg-white/3 px-4 rounded-xl border border-white/5 h-11 w-fit">
          <button onClick={() => setCurrentFolderId('root')} className="hover:text-white transition-colors">
            Files
          </button>
          <ChevronRight size={14} className="text-zinc-600" />
          <span className="text-white font-medium flex items-center gap-1.5">
            <FolderOpen size={14} className="text-purple-400" />
            {activeFolderName || 'Folder'}
          </span>
          <button 
            onClick={() => setCurrentFolderId('root')}
            className="ml-3 text-xs bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded text-zinc-300 hover:text-white border border-white/5"
          >
            Back
          </button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="Search files/folders (use #tag to filter by tag)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
              <X size={16} />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {['All', 'Documents', 'Creatives', 'Invoices'].map((filter) => (
            <button
              key={filter}
              onClick={() => setCategoryFilter(filter)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                categoryFilter === filter
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* View Grid */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="animate-spin text-purple-500" size={32} />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Folders Section (Only visible at root-level view) */}
          {currentFolderId === 'root' && filteredFolders.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Folders</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredFolders.map((folder) => (
                  <div
                    key={folder.id}
                    onClick={() => setCurrentFolderId(folder.id)}
                    className="glassmorphism rounded-2xl p-4 border border-white/10 hover:border-purple-500/30 hover:bg-white/8 transition-all group flex flex-col justify-between cursor-pointer h-28"
                  >
                    <div className="flex justify-between items-start">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                        <FolderIcon className="text-purple-400" size={20} fill="currentColor" fillOpacity={0.2} />
                      </div>
                      <button
                        onClick={(e) => handleDeleteFolder(folder.id, e)}
                        disabled={deletingFolder === folder.id}
                        className="p-1 hover:bg-red-500/20 rounded text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                      >
                        {deletingFolder === folder.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                    <div className="mt-2 min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate" title={folder.name}>
                        {folder.name}
                      </h3>
                      <div className="flex flex-wrap gap-1 mt-1 empty:hidden">
                        {renderTags(folder.tags)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files Section */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
              {currentFolderId === 'root' ? 'Files' : 'Files in Folder'}
            </h2>
            
            {filteredFiles.length === 0 ? (
              <div className="glassmorphism rounded-2xl border border-white/10 p-12 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="text-zinc-500" size={32} />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">
                  {search || categoryFilter !== 'All' ? 'No files match your filters' : 'No files in this folder'}
                </h3>
                <p className="text-zinc-400 mb-6">
                  {search || categoryFilter !== 'All' ? 'Try adjusting your search or filter criteria.' : 'Upload a file using the button above.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredFiles.map((file) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glassmorphism rounded-2xl p-5 border border-white/10 hover:border-purple-500/30 transition-all group flex flex-col justify-between h-[180px]"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
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
                          <button
                            onClick={() => handleDelete(file.id)}
                            disabled={deleting === file.id}
                            className="p-1.5 hover:bg-red-500/20 rounded-lg text-zinc-400 hover:text-red-400 ml-1 disabled:opacity-50"
                          >
                            {deleting === file.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                          </button>
                        </div>
                      </div>
                      
                      <h3 className="text-sm font-semibold text-white truncate mb-0.5" title={file.name}>
                        {file.name}
                      </h3>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mt-1 empty:hidden">
                        {renderTags(file.tags)}
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-2">
                        <span>{formatSize(file.size)}</span>
                        <span className="capitalize px-1.5 py-0.2 rounded bg-white/5">{file.category}</span>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-400">
                        <span className="truncate max-w-[120px]">{file.uploader?.firstName} {file.uploader?.lastName}</span>
                        <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <h3 className="text-lg font-bold text-white">Create New Folder</h3>
              <button onClick={() => setShowCreateFolder(false)} className="text-zinc-500 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Folder Name</label>
                <input 
                  type="text" 
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  placeholder="e.g. Contracts 2026"
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-1">Hashtags (comma separated)</label>
                <input 
                  type="text" 
                  value={newFolderTags}
                  onChange={e => setNewFolderTags(e.target.value)}
                  placeholder="e.g. #finance, #contracts"
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowCreateFolder(false)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white text-sm font-semibold hover:bg-white/5 border border-transparent transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-purple-500/20 transition-all"
                >
                  Create Folder
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
