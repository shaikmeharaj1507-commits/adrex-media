'use client';

import { API_URL } from '@/lib/api';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, FileText, Image as ImageIcon, File, Loader2, Download, Trash2, 
  Search, Folder, Plus, Hash, X, ChevronRight, Pencil, FolderSymlink, Check,
  Square, CheckSquare, Eye, ShieldAlert, BarChart2
} from 'lucide-react';

interface FileRecord {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  category: string;
  tags: string[];
  createdAt: string;
  folderId?: string | null;
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

interface StorageStats {
  totalSize: number;
  totalFiles: number;
  storageLimit: number;
  countByCategory: Record<string, number>;
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [folders, setFolders] = useState<FolderRecord[]>([]);
  const [currentFolder, setCurrentFolder] = useState<FolderRecord | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  // Storage Stats State
  const [stats, setStats] = useState<StorageStats | null>(null);

  // Rename State
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingName, setRenamingName] = useState('');

  // Move File State
  const [movingFile, setMovingFile] = useState<FileRecord | null>(null);
  const [targetFolderId, setTargetFolderId] = useState<string>('');

  // Bulk Selection State
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());

  // Lightbox Preview State
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);

  // Drag and Drop Upload State
  const [dragActive, setDragActive] = useState(false);
  
  // Modals state
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadTags, setUploadTags] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadFile = async (file: FileRecord) => {
    try {
      const response = await fetch(`${API_URL}${file.url}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.name);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
      window.open(`${API_URL}${file.url}`, '_blank');
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adrex_token');
      
      const filesUrl = `${API_URL}/api/files${currentFolder ? `?folderId=${currentFolder.id}` : '?folderId=root'}`;
      const [filesRes, foldersRes, statsRes] = await Promise.all([
        fetch(filesUrl, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/folders`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/files/stats`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (filesRes.ok) setFiles(await filesRes.json());
      if (foldersRes.ok) setFolders(await foldersRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      
      setSelectedFileIds(new Set());
    } catch (error) {
      console.error('Failed to fetch file data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentFolder]);

  // Rename File
  const handleRenameFile = async (id: string) => {
    if (!renamingName.trim()) return;
    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/files/${id}/rename`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: renamingName.trim() })
      });
      if (res.ok) {
        setRenamingId(null);
        setRenamingName('');
        fetchData();
      }
    } catch (error) {
      console.error('Failed to rename file:', error);
    }
  };

  // Move File
  const handleMoveFile = async () => {
    if (!movingFile) return;
    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/files/${movingFile.id}/move`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ folderId: targetFolderId === 'root' ? null : targetFolderId })
      });
      if (res.ok) {
        setMovingFile(null);
        setTargetFolderId('');
        fetchData();
      }
    } catch (error) {
      console.error('Failed to move file:', error);
    }
  };

  // Create Folder
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

  // Delete Folder
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

  // File Upload
  const handleFileUpload = async (fileToUpload?: File) => {
    const file = fileToUpload || selectedFile;
    if (!file) return;
    setUploading(true);
    setUploadProgress(20);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', file.type.startsWith('image/') ? 'creative' : 'document');
    if (currentFolder) formData.append('folderId', currentFolder.id);
    if (uploadTags.trim()) {
      const tagsArray = uploadTags.split(',').map(t => t.trim()).filter(Boolean);
      formData.append('tags', JSON.stringify(tagsArray));
    }

    try {
      setUploadProgress(50);
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/files/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      setUploadProgress(90);
      if (res.ok) {
        setUploadProgress(100);
        setTimeout(() => {
          setShowUploadModal(false);
          setSelectedFile(null);
          setUploadTags('');
          fetchData();
        }, 400);
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

  // Delete Single File
  const handleDeleteFile = async (id: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/files/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Delete failed', error);
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedFileIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete the ${selectedFileIds.size} selected files?`)) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('adrex_token');
      await Promise.all(
        Array.from(selectedFileIds).map(id =>
          fetch(`${API_URL}/api/files/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          })
        )
      );
      setSelectedFileIds(new Set());
      fetchData();
    } catch (error) {
      console.error('Bulk deletion failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setShowUploadModal(true);
    }
  };

  const toggleSelectFile = (id: string) => {
    const next = new Set(selectedFileIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedFileIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedFileIds.size === filteredFiles.length) {
      setSelectedFileIds(new Set());
    } else {
      setSelectedFileIds(new Set(filteredFiles.map(f => f.id)));
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="text-purple-400 animate-pulse" />;
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

  const storagePercentage = stats ? (stats.totalSize / stats.storageLimit) * 100 : 0;

  return (
    <div 
      className="space-y-6 min-h-screen pb-12"
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
    >
      {/* Drag Overlay visual clue */}
      {dragActive && (
        <div className="fixed inset-0 z-50 bg-primary/20 backdrop-blur-md flex items-center justify-center pointer-events-none border-4 border-dashed border-primary m-4 rounded-3xl animate-pulse">
          <div className="text-center p-8 bg-card border border-border rounded-2xl shadow-2xl">
            <Upload size={48} className="text-primary mx-auto mb-4 animate-bounce" />
            <h2 className="text-xl font-bold text-foreground mb-2">Drop File Here to Upload</h2>
            <p className="text-sm text-muted-foreground">Your upload will start automatically.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <span 
              className={`cursor-pointer hover:text-primary transition-colors ${!currentFolder ? 'text-primary' : ''}`}
              onClick={() => setCurrentFolder(null)}
            >
              Files
            </span>
            {currentFolder && (
              <>
                <ChevronRight size={20} className="text-muted-foreground" />
                <span className="text-primary">{currentFolder.name}</span>
              </>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">Manage, preview, organize, and secure content files.</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          {selectedFileIds.size > 0 && (
            <button 
              onClick={handleBulkDelete}
              className="bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 text-sm ml-auto sm:ml-0"
            >
              <Trash2 size={16} />
              Delete Selected ({selectedFileIds.size})
            </button>
          )}
          
          <button 
            onClick={() => setShowFolderModal(true)}
            className="bg-card hover:bg-muted border border-border text-foreground px-4 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 text-sm"
          >
            <Folder size={16} />
            <span>New Folder</span>
          </button>
          
          <button 
            onClick={() => setShowUploadModal(true)}
            className="bg-primary hover:opacity-90 text-white px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 text-sm shadow-md"
          >
            <Upload size={16} />
            Upload File
          </button>
        </div>
      </div>

      {/* Storage Stats Bar */}
      {stats && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glassmorphism rounded-2xl p-4 border border-border/80 grid grid-cols-1 md:grid-cols-3 items-center gap-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <BarChart2 size={20} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Storage Usage</p>
              <p className="text-sm font-bold text-foreground">
                {formatSize(stats.totalSize)} / {formatSize(stats.storageLimit)}
              </p>
            </div>
          </div>
          <div className="md:col-span-2">
            <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden border border-border/60">
              <div 
                className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(storagePercentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
              <span>{storagePercentage.toFixed(1)}% Used</span>
              <span>{stats.totalFiles} Files total</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search files or tags..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['All', 'Documents', 'Creatives', 'Invoices'].map((filter) => (
            <button
              key={filter}
              onClick={() => setCategoryFilter(filter)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                categoryFilter === filter
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-card hover:bg-muted border border-border text-foreground'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Folders Grid */}
      {!currentFolder && !loading && folders.length > 0 && !search && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <Folder size={14} /> Folders
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {folders.map(folder => (
              <motion.div
                key={folder.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => setCurrentFolder(folder)}
                className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-primary/40 transition-all flex items-center justify-between group shadow-sm"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                   <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Folder size={20} className="fill-current opacity-20" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-semibold text-foreground truncate">{folder.name}</p>
                    <p className="text-[10px] text-muted-foreground">{folder._count?.files || 0} files</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => handleDeleteFolder(folder.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-md text-red-600 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Files Bulk Action Header */}
      {filteredFiles.length > 0 && (
        <div className="flex items-center justify-between px-2 mb-2">
          <button 
            onClick={toggleSelectAll} 
            className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            {selectedFileIds.size === filteredFiles.length ? (
              <CheckSquare size={16} className="text-primary" />
            ) : (
              <Square size={16} />
            )}
            {selectedFileIds.size === filteredFiles.length ? 'Deselect All' : 'Select All'}
          </button>
          <span className="text-xs text-muted-foreground font-medium">
            Showing {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
 
      {/* File Grid */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : filteredFiles.length === 0 ? (
        (search || categoryFilter !== 'All') ? (
          <div className="bg-card rounded-2xl border border-border p-12 text-center backdrop-blur-sm">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <FileText className="text-muted-foreground" size={32} />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              No files match your filters
            </h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : (
          <div className="text-center p-8 border border-dashed border-border rounded-2xl">
            <p className="text-sm text-muted-foreground">Drag & drop a file here or select upload above to get started.</p>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredFiles.map((file) => {
            const isSelected = selectedFileIds.has(file.id);
            const isEditing = renamingId === file.id;
 
            return (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`bg-card rounded-2xl p-5 border transition-all group relative overflow-hidden shadow-sm flex flex-col justify-between min-h-[190px] ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-border/80 hover:border-primary/30'
                }`}
              >
                {/* Checkbox Select Overlay */}
                <button 
                  onClick={() => toggleSelectFile(file.id)}
                  className={`absolute top-4 left-4 z-10 transition-opacity ${
                    isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                >
                  {isSelected ? (
                    <CheckSquare size={18} className="text-primary fill-primary/10" />
                  ) : (
                    <Square size={18} className="text-muted-foreground hover:text-foreground" />
                  )}
                </button>
 
                <div className="flex justify-between items-start mb-3 ml-7">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center border border-border">
                    {getFileIcon(file.type)}
                  </div>
                  
                  {/* File Quick Actions */}
                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                    {file.type.startsWith('image/') && (
                      <button
                        onClick={() => setPreviewFile(file)}
                        className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground"
                        title="Preview File"
                      >
                        <Eye size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDownloadFile(file)}
                      className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground"
                      title="Download"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      onClick={() => { setMovingFile(file); setTargetFolderId(file.folderId || 'root'); }}
                      className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground"
                      title="Move Folder"
                    >
                      <FolderSymlink size={14} />
                    </button>
                    <button
                      onClick={() => { setRenamingId(file.id); setRenamingName(file.name); }}
                      className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground"
                      title="Rename"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-muted-foreground hover:text-red-600 ml-1"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                
                {/* File Title / Inline Edit */}
                {isEditing ? (
                  <div className="flex items-center gap-1.5 mb-2">
                    <input 
                      type="text" 
                      value={renamingName}
                      onChange={e => setRenamingName(e.target.value)}
                      className="bg-background border border-primary rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none w-full"
                      autoFocus
                    />
                    <button 
                      onClick={() => handleRenameFile(file.id)}
                      className="p-1.5 bg-primary hover:opacity-90 rounded-lg text-white"
                    >
                      <Check size={12} />
                    </button>
                    <button 
                      onClick={() => setRenamingId(null)}
                      className="p-1.5 bg-muted hover:bg-muted/80 rounded-lg text-muted-foreground"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <h3 className="text-sm font-semibold text-foreground truncate mb-2 ml-1" title={file.name}>
                    {file.name}
                  </h3>
                )}
 
                {/* Tags */}
                {file.tags && file.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3 ml-1">
                    {file.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold border border-primary/20">
                        <Hash size={10} />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto ml-1">
                  <span>{formatSize(file.size)}</span>
                  <span className="capitalize px-2 py-0.5 rounded bg-muted text-foreground/80">{file.category}</span>
                </div>
                
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground ml-1">
                  <span>{file.uploader.firstName} {file.uploader.lastName}</span>
                  <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Lightbox Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-4xl w-full h-[80vh] flex flex-col items-center justify-center"
            >
              <button 
                onClick={() => setPreviewFile(null)} 
                className="absolute top-0 right-0 p-2.5 bg-white/5 hover:bg-white/10 rounded-full text-white z-10"
              >
                <X size={20} />
              </button>
              
              <img 
                src={`${API_URL}${previewFile.url}`} 
                alt={previewFile.name}
                className="max-h-full max-w-full object-contain rounded-xl shadow-2xl border border-white/10"
              />
              
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/70 backdrop-blur-sm text-center rounded-b-xl border-t border-white/5">
                <p className="text-white font-semibold text-sm truncate">{previewFile.name}</p>
                <p className="text-xs text-zinc-400 mt-1">Uploaded by {previewFile.uploader.firstName} on {new Date(previewFile.createdAt).toLocaleDateString()}</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Move File Modal */}
      <AnimatePresence>
        {movingFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <FolderSymlink className="text-primary" /> Move File
                </h3>
                <button onClick={() => setMovingFile(null)} className="text-muted-foreground hover:text-foreground">
                  <X size={20} />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Choose a new destination folder for <span className="text-primary font-semibold">{movingFile.name}</span>:
              </p>
              
              <select
                value={targetFolderId}
                onChange={e => setTargetFolderId(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-6"
              >
                <option value="root" className="bg-card text-foreground">/ Files (Root)</option>
                {folders.map(f => (
                  <option key={f.id} value={f.id} className="bg-card text-foreground">📁 {f.name}</option>
                ))}
              </select>
 
              <div className="flex justify-end gap-3">
                <button onClick={() => setMovingFile(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button 
                  onClick={handleMoveFile}
                  className="bg-primary hover:opacity-90 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors"
                >
                  Move Destination
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Folder Modal */}
      <AnimatePresence>
        {showFolderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold text-foreground">Create New Folder</h3>
                <button onClick={() => setShowFolderModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={20} />
                </button>
              </div>
              <input
                type="text"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                placeholder="Folder Name (e.g. Invoices 2026)"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-6"
                autoFocus
              />
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowFolderModal(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button 
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim()}
                  className="bg-primary hover:opacity-90 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Create Folder
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upload File Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold text-foreground">Upload File</h3>
                <button onClick={() => setShowUploadModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">Select File</label>
                  <input
                    type="file"
                    onChange={e => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full text-sm text-muted-foreground
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-xl file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary/10 file:text-primary
                      hover:file:bg-primary/20"
                  />
                  {selectedFile && (
                    <p className="text-[11px] text-primary mt-1 font-semibold">
                      Selected: {selectedFile.name} ({formatSize(selectedFile.size)})
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                    Tags (optional)
                  </label>
                  <input
                    type="text"
                    value={uploadTags}
                    onChange={e => setUploadTags(e.target.value)}
                    placeholder="e.g. invoice, creative, seasonal (comma separated)"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {uploading && (
                  <div className="space-y-1 pt-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Uploading status...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button onClick={() => setShowUploadModal(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button 
                  onClick={() => handleFileUpload()}
                  disabled={!selectedFile || uploading}
                  className="bg-primary hover:opacity-90 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  Start Upload
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
