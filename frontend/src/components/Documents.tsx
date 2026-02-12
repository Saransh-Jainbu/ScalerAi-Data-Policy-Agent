import React, { useState, useEffect } from 'react';
import { CloudUpload, FileText, Trash2, Eye, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

// API Service URL
const API_URL = 'http://localhost:8081';

interface Document {
  document_id: string;
  filename: string;
  created_at: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_size: number;
  metadata?: any;
}

export const Documents: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Fetch Documents
  const fetchDocuments = async () => {
    try {
      const res = await axios.get(`${API_URL}/documents`);
      // Sort by newest first
      const sorted = res.data.documents.sort((a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setDocuments(sorted);
    } catch (err) {
      console.error("Failed to fetch documents", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    // Poll every 5 seconds for updates
    const interval = setInterval(fetchDocuments, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handle File Upload
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;

    setUploading(true);
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(`${API_URL}/process`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Refresh list immediately
      fetchDocuments();
    } catch (err) {
      console.error("Upload failed", err);
      alert("Upload failed. Check console.");
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  // Format Bytes to human readable string
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format Date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Upload Area */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center group hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer relative">
        <input
          type="file"
          accept=".pdf"
          onChange={handleUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />

        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
          {uploading ? <Clock className="w-8 h-8 animate-spin" /> : <CloudUpload className="w-8 h-8" />}
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
          {uploading ? 'Uploading & Processing...' : 'Upload Data Policies'}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
          Drag and drop your PDF compliance documents here, or <span className="text-blue-600 font-semibold underline">browse files</span>
        </p>
        <p className="mt-4 text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Supported formats: PDF (Max 20MB)</p>
      </div>

      {/* Document List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 dark:text-white">Recent Documents ({documents.length})</h3>
          <div className="flex gap-2">
            <button onClick={() => fetchDocuments()} className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 transition-colors">Refresh</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Document Name</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date Uploaded</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Size</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading documents...</td></tr>
              ) : documents.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No documents uploaded yet.</td></tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.document_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded">
                          <FileText className="w-4 h-4 text-slate-500" />
                        </div>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">{doc.filename}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{formatDate(doc.created_at)}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{formatBytes(doc.file_size)}</td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${doc.status === 'completed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' :
                          doc.status === 'processing' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' :
                            doc.status === 'pending' ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' :
                              'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                        {doc.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                        {doc.status === 'processing' && <Clock className="w-3 h-3 animate-spin" />}
                        {doc.status === 'pending' && <Clock className="w-3 h-3" />}
                        {doc.status === 'failed' && <AlertCircle className="w-3 h-3" />}
                        {doc.status}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-all">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
