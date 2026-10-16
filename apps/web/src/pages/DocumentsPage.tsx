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
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import {
  DocumentCategory,
  UserRole,
} from '@hrx/shared';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';

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
        return <Badge variant="purple">{CATEGORY_LABELS[category] || category}</Badge>;
      case DocumentCategory.IDENTITY:
        return <Badge variant="primary">{CATEGORY_LABELS[category] || category}</Badge>;
      case DocumentCategory.PAYSLIP:
        return <Badge variant="success">{CATEGORY_LABELS[category] || category}</Badge>;
      case DocumentCategory.CERTIFICATE:
        return <Badge variant="warning">{CATEGORY_LABELS[category] || category}</Badge>;
      default:
        return <Badge variant="neutral">{CATEGORY_LABELS[category] || category}</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-primary px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
              Enterprise Vault
            </span>
            <span className="text-xs text-text-muted">Signed URL Downloads • Encrypted Storage</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">Document Repository</h1>
          <p className="text-sm text-text-secondary mt-1">
            Secure cloud storage, verification, signed short-lived downloads, and audit logs
          </p>
        </div>

        <Button
          id="btn-upload-document"
          onClick={() => setIsUploadModalOpen(true)}
          variant="primary"
          className="shadow-glow"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Global Alerts */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-3 border shadow-glass transition-all ${
            feedback.type === 'success'
              ? 'bg-secondary/10 border-secondary/30 text-secondary-light'
              : 'bg-error/10 border-error/30 text-error-light'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0 text-secondary" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-error" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Category Filter Ribbon */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/[0.08]">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
            selectedCategory === 'ALL'
              ? 'bg-primary text-white shadow-glow'
              : 'text-text-secondary hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          All Categories
        </button>
        {Object.entries(CATEGORY_LABELS).map(([cat, label]) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
              selectedCategory === cat
                ? 'bg-primary text-white shadow-glow'
                : 'text-text-secondary hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Documents Table Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Uploaded Documents
              </CardTitle>
              <CardDescription>
                Verified enterprise files with role-based confidentiality permissions
              </CardDescription>
            </div>
            <span className="text-xs text-text-muted font-mono">{documents.length} files</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02] text-text-muted font-mono uppercase text-[11px]">
                  <th className="py-3.5 px-5">Document Title</th>
                  <th className="py-3.5 px-5">Category</th>
                  {isHRorAdmin && <th className="py-3.5 px-5">Employee</th>}
                  <th className="py-3.5 px-5">File Type</th>
                  <th className="py-3.5 px-5">Size</th>
                  <th className="py-3.5 px-5">Date Added</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-text-muted font-mono">
                      Loading documents...
                    </td>
                  </tr>
                ) : documents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-text-muted">
                      No documents found in this category.
                    </td>
                  </tr>
                ) : (
                  documents.map((doc) => (
                    <tr key={doc._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-surface-highest/60 border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                            {doc.mimeType?.startsWith('image/') ? (
                              <Image className="w-4 h-4 text-primary-light" />
                            ) : (
                              <FileIcon className="w-4 h-4 text-tertiary" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{doc.title}</p>
                            {doc.isConfidential && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-error-light font-semibold">
                                <Lock className="w-3 h-3 text-error" /> Confidential
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        {getCategoryBadge(doc.category)}
                      </td>
                      {isHRorAdmin && (
                        <td className="py-3.5 px-5 text-text-secondary">
                          <span className="font-semibold text-white">
                            {doc.employeeId?.firstName} {doc.employeeId?.lastName}
                          </span>
                          <span className="block text-[10px] text-text-muted font-mono">
                            {doc.employeeId?.employeeCode || 'EMP'}
                          </span>
                        </td>
                      )}
                      <td className="py-3.5 px-5 font-mono text-text-muted uppercase">
                        {doc.mimeType === 'application/pdf' ? 'PDF' : doc.mimeType?.split('/')[1] || 'FILE'}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-text-muted">
                        {formatFileSize(doc.fileSize)}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-text-muted">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            id={`btn-download-doc-${doc._id}`}
                            variant="secondary"
                            size="sm"
                            onClick={() => handleDownload(doc._id, doc.title)}
                            title="Generate signed download URL"
                          >
                            <Download className="w-3.5 h-3.5 mr-1" />
                            Download
                          </Button>
                          <Button
                            id={`btn-delete-doc-${doc._id}`}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(doc._id)}
                            className="text-text-muted hover:text-error"
                            title="Delete document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Upload Document Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Employee Document"
        description="Attach verified PDF or image files. Max file size: 5MB."
        maxWidth="lg"
      >
        {uploadError && (
          <div className="p-3.5 rounded-xl bg-error/10 border border-error/30 text-error-light text-xs mb-4">
            {uploadError}
          </div>
        )}

        <form onSubmit={handleUploadSubmit} className="space-y-4">
          {isHRorAdmin && (
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Select Personnel Assignment *
              </label>
              <select
                id="select-doc-employee"
                value={targetEmployeeId}
                onChange={(e) => setTargetEmployeeId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-highest/60 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-primary transition"
              >
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id} className="bg-surface-darker text-white">
                    {emp.firstName} {emp.lastName} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Document Title *
            </label>
            <input
              id="input-doc-title"
              type="text"
              placeholder="e.g. Master Degree Certificate"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-highest/60 border border-white/[0.08] text-xs text-white placeholder-text-muted focus:outline-none focus:border-primary transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Category *
            </label>
            <select
              id="select-doc-category"
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-highest/60 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-primary transition"
            >
              {Object.entries(CATEGORY_LABELS).map(([cat, label]) => (
                <option key={cat} value={cat} className="bg-surface-darker text-white">
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* File Drop / Selection */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              File Attachment (PDF, PNG, JPEG up to 5MB) *
            </label>
            <div className="border border-dashed border-white/[0.15] rounded-2xl p-5 bg-surface-highest/30 space-y-3 hover:border-primary/50 transition">
              <input
                id="input-file"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                onChange={handleFileChange}
                className="block w-full text-xs text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary file:text-white hover:file:bg-primary-light cursor-pointer"
              />
              {selectedFile && (
                <div className="p-3 rounded-xl bg-surface-container border border-white/[0.08] flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-white">{selectedFile.name}</p>
                    <p className="text-[10px] text-text-muted font-mono">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <Badge variant="success">Ready</Badge>
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
                className="w-full py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-primary-light flex items-center justify-center gap-2 transition"
              >
                <FileText className="w-3.5 h-3.5" />
                Attach Sample PDF (Instant Demo)
              </button>
            </div>
          </div>

          {isHRorAdmin && (
            <div className="flex items-center gap-2.5 pt-1">
              <input
                id="checkbox-confidential"
                type="checkbox"
                checked={isConfidential}
                onChange={(e) => setIsConfidential(e.target.checked)}
                className="rounded border-white/[0.2] bg-surface-highest text-primary focus:ring-0 w-4 h-4"
              />
              <label htmlFor="checkbox-confidential" className="text-xs text-text-secondary cursor-pointer">
                Mark as Confidential (Restricted to HR & Administrators only)
              </label>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsUploadModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              id="btn-submit-upload"
              type="submit"
              variant="primary"
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

