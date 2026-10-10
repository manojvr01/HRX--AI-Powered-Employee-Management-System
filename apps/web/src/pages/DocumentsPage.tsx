import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Lock,
  Plus,
  CheckCircle,
  AlertCircle,
  X,
  File as FileIcon,
  Image,
  Filter,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import {
  DocumentCategory,
  UserRole,
} from '@hrx/shared';

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  profile_image: 'Profile Image',
  identity: 'Identity Document',
  offer_letter: 'Offer Letter',
  payslip: 'Payslip',
  resume: 'Resume / CV',
  certificate: 'Certificate',
  performance_attachment: 'Performance Document',
  other_hr_document: 'Other Document',
};

export const DocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const isHRorAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.HR;

  const [documents, setDocuments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>(DocumentCategory.CERTIFICATE);
  const [targetEmployeeId, setTargetEmployeeId] = useState<string>('');
  const [isConfidential, setIsConfidential] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      const url = selectedCategory === 'ALL'
        ? '/documents'
        : `/documents?category=${selectedCategory}`;

      const res = await apiRequest<any[]>(url);
      if (res.data) {
        setDocuments(res.data);
      }

      if (isHRorAdmin && employees.length === 0) {
        const empRes = await apiRequest<any[]>('/employees?limit=100');
        if (empRes.data) {
          setEmployees(empRes.data);
          if (empRes.data.length > 0 && !targetEmployeeId) {
            setTargetEmployeeId(empRes.data[0]._id);
          }
        }
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to load documents' });
    } finally {
      setIsLoading(false);
    }
  }, [isHRorAdmin, selectedCategory, employees.length, targetEmployeeId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Set default employee ID for non-HR
  useEffect(() => {
    if (!isHRorAdmin && user?.employee?.id) {
      setTargetEmployeeId(user.employee.id);
    }
  }, [isHRorAdmin, user?.employee?.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('File exceeds the 5MB size limit.');
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
      if (!uploadTitle) {
        setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a file to upload');
      return;
    }
    const empId = isHRorAdmin ? targetEmployeeId : user?.employee?.id;
    if (!empId) {
      setUploadError('Employee assignment missing');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('employeeId', empId);
      formData.append('title', uploadTitle.trim());
      formData.append('category', uploadCategory);
      if (isConfidential) {
        formData.append('isConfidential', 'true');
      }

      const res = await apiRequest('/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.data) {
        setIsUploadModalOpen(false);
        setSelectedFile(null);
        setUploadTitle('');
        setFeedback({ type: 'success', message: 'Document uploaded successfully!' });
        await loadDocuments();
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (docId: string, title: string) => {
    try {
      // 1. Request short-lived signed download token
      const res = await apiRequest<{ downloadUrl: string; expiresInSeconds: number }>(
        `/documents/${docId}/download-url`
      );

      if (res.data?.downloadUrl) {
        // Trigger download
        const downloadUrl = res.data.downloadUrl;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', title);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to download document' });
    }
  };

  const handleDelete = async (docId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this document?')) {
      return;
    }
    try {
      await apiRequest(`/documents/${docId}`, { method: 'DELETE' });
      setFeedback({ type: 'success', message: 'Document deleted successfully' });
      await loadDocuments();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to delete document' });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getCategoryBadge = (category: DocumentCategory) => {
    switch (category) {
      case DocumentCategory.OFFER_LETTER:
        return 'bg-violet-500/10 text-violet-400 border-violet-500/30';
      case DocumentCategory.IDENTITY:
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case DocumentCategory.PAYSLIP:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case DocumentCategory.CERTIFICATE:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Document Repository</h1>
          <p className="text-sm text-slate-400 mt-1">
            Secure cloud storage, verification, signed short-lived downloads, and audit logs
          </p>
        </div>

        <button
          id="btn-upload-document"
          onClick={() => setIsUploadModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/20"
        >
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {/* Global Alerts */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-3 border ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 ${
            selectedCategory === 'ALL'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          All Categories
        </button>
        {Object.entries(CATEGORY_LABELS).map(([cat, label]) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Documents Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Uploaded Documents</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">{documents.length} files</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-mono uppercase text-[11px]">
                <th className="py-3 px-4">Document Title</th>
                <th className="py-3 px-4">Category</th>
                {isHRorAdmin && <th className="py-3 px-4">Employee</th>}
                <th className="py-3 px-4">File Type</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Date Added</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-mono text-xs">
                    Loading documents...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                    No documents found in this category.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc._id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {doc.mimeType?.startsWith('image/') ? (
                          <Image className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                        ) : (
                          <FileIcon className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        )}
                        <div>
                          <p className="font-semibold text-white">{doc.title}</p>
                          {doc.isConfidential && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-rose-400 font-semibold">
                              <Lock className="w-3 h-3" /> Confidential
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryBadge(
                          doc.category
                        )}`}
                      >
                        {CATEGORY_LABELS[doc.category as DocumentCategory] || doc.category}
                      </span>
                    </td>
                    {isHRorAdmin && (
                      <td className="py-3 px-4 text-slate-300">
                        {doc.employeeId?.firstName} {doc.employeeId?.lastName}
                        <span className="block text-[10px] text-slate-500 font-mono">
                          {doc.employeeId?.employeeCode}
                        </span>
                      </td>
                    )}
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {doc.mimeType === 'application/pdf' ? 'PDF' : doc.mimeType?.split('/')[1]?.toUpperCase()}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {formatFileSize(doc.fileSize)}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          id={`btn-download-doc-${doc._id}`}
                          onClick={() => handleDownload(doc._id, doc.title)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-bold text-[11px] flex items-center gap-1 transition"
                          title="Generate signed download URL"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </button>
                        <button
                          id={`btn-delete-doc-${doc._id}`}
                          onClick={() => handleDelete(doc._id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title="Delete document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Upload Document Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl border border-slate-800 w-full max-w-lg p-6 bg-slate-900 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Upload Employee Document</h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {isHRorAdmin && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Select Employee *
                  </label>
                  <select
                    id="select-doc-employee"
                    value={targetEmployeeId}
                    onChange={(e) => setTargetEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Document Title *
                </label>
                <input
                  id="input-doc-title"
                  type="text"
                  placeholder="e.g. Master Degree Certificate"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Category *
                </label>
                <select
                  id="select-doc-category"
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {Object.entries(CATEGORY_LABELS).map(([cat, label]) => (
                    <option key={cat} value={cat}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* File Drop / Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  File Attachment (PDF, PNG, JPEG up to 5MB) *
                </label>
                <div className="border border-slate-800 rounded-2xl p-4 bg-slate-950/60 space-y-3">
                  <input
                    id="input-file"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                    onChange={handleFileChange}
                    className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                  />
                  {selectedFile && (
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-white">{selectedFile.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold">Ready</span>
                    </div>
                  )}
                  <button
                    id="btn-use-sample-pdf"
                    type="button"
                    onClick={() => {
                      const samplePdfContent = '%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF';
                      const blob = new Blob([samplePdfContent], { type: 'application/pdf' });
                      const file = new File([blob], 'Employment_Agreement_Sample.pdf', { type: 'application/pdf' });
                      setSelectedFile(file);
                      setUploadError(null);
                      if (!uploadTitle) setUploadTitle('Official Employment Agreement');
                    }}
                    className="w-full py-1.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-[11px] font-semibold text-indigo-300 flex items-center justify-center gap-2 transition"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Attach Sample PDF (Instant Demo)
                  </button>
                </div>
              </div>

              {isHRorAdmin && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    id="checkbox-confidential"
                    type="checkbox"
                    checked={isConfidential}
                    onChange={(e) => setIsConfidential(e.target.checked)}
                    className="rounded border-slate-800 text-indigo-600 focus:ring-0"
                  />
                  <label htmlFor="checkbox-confidential" className="text-xs text-slate-300">
                    Mark as Confidential (Restricted to HR & Administrators)
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-upload"
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : 'Upload Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
