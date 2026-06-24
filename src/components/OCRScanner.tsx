import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { 
  UploadCloud, 
  FileCheck, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  RefreshCw 
} from 'lucide-react';

interface OCRScannerProps {
  onUploadSuccess?: () => void;
}

export default function OCRScanner({ onUploadSuccess }: OCRScannerProps) {
  const { uploadDocument, documents } = useAuth();
  const [docType, setDocType] = useState<string>('Aadhaar Card');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [results, setResults] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const documentTypes = [
    'Aadhaar Card',
    'PAN Card',
    'Income Certificate',
    'Caste Certificate',
    'Ration Card',
    'Domicile Certificate'
  ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadAndVerify = async () => {
    if (!file) return;

    setStatus('loading');
    setErrorMsg('');
    try {
      const doc = await uploadDocument(docType, file);
      setResults(doc);
      setStatus('success');
      setFile(null);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process document");
      setStatus('error');
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3" id="ocr-module-container">
      
      {/* Upload and Form Panel */}
      <div className="lg:col-span-2 space-y-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 backdrop-blur-md">
          <h3 className="font-display text-sm font-bold text-white mb-2">Upload Credentials</h3>
          <p className="text-xs text-slate-400 mb-6">Select a file type and upload Aadhaar, PAN, or other certifications for AI analysis</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Document Category</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                {documentTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div className="flex flex-col justify-end">
              {file && (
                <div className="flex items-center justify-between rounded-xl bg-slate-950 p-2 border border-slate-850">
                  <span className="text-xs text-slate-300 truncate max-w-[200px] font-mono">{file.name}</span>
                  <button 
                    onClick={() => setFile(null)}
                    className="text-[10px] text-red-400 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Drag & Drop Canvas */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`mt-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 cursor-pointer transition ${
              isDragging 
                ? 'border-amber-500 bg-amber-500/5' 
                : 'border-slate-800 bg-slate-950 hover:border-slate-700'
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*,.pdf"
            />
            <UploadCloud className="h-10 w-10 text-slate-500 mb-4" />
            <h4 className="text-xs font-semibold text-slate-300">Drag & Drop Document Here</h4>
            <p className="mt-1 text-[10px] text-slate-500">Supports PNG, JPG, JPEG up to 5MB size</p>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleUploadAndVerify}
              disabled={!file || status === 'loading'}
              className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md hover:from-amber-400 hover:to-orange-400 disabled:opacity-50"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>OCR Scanning...</span>
                </>
              ) : (
                <>
                  <FileCheck className="h-4 w-4" />
                  <span>Analyze & Validate Document</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* OCR Result View */}
        {results && status === 'success' && (
          <div className="rounded-2xl border border-emerald-800/30 bg-emerald-950/10 p-6 backdrop-blur-md">
            <div className="flex items-center space-x-3 mb-4">
              {results.status === 'Verified' ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              ) : (
                <XCircle className="h-6 w-6 text-red-500" />
              )}
              <div>
                <h4 className="font-display text-sm font-bold text-white">OCR Verification: {results.status}</h4>
                <p className="text-[10px] text-slate-400">Processed at {new Date(results.uploadedAt).toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Field Compliance Check</h5>
              {results.validationResults?.map((res: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between rounded-xl bg-slate-950/60 p-3 border border-slate-900">
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold">{res.field}</p>
                    <p className="text-xs font-mono font-bold text-white mt-0.5">{res.value}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-slate-500">{res.reason}</span>
                    {res.valid ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Extracted raw text sample block */}
            <details className="mt-4 border-t border-slate-800/60 pt-4">
              <summary className="text-[10px] text-slate-400 font-bold tracking-wider uppercase cursor-pointer hover:text-white">
                View Extracted Raw Text
              </summary>
              <pre className="mt-2 rounded-lg bg-slate-950 p-3 text-[10px] font-mono text-slate-500 overflow-x-auto whitespace-pre-wrap max-h-32">
                {results.ocrText}
              </pre>
            </details>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center space-x-3 rounded-2xl border border-red-800/30 bg-red-950/10 p-5">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-xs font-bold text-white">Document Analysis Failed</p>
              <p className="text-xs text-slate-400 mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}
      </div>

      {/* Uploaded History Index */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 backdrop-blur-md h-full">
          <h3 className="font-display text-sm font-bold text-white mb-4">Digitized Credentials Inventory</h3>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {documents.length === 0 ? (
              <p className="py-12 text-center text-xs text-slate-500 italic">No verified digital records found</p>
            ) : (
              documents.map((doc) => (
                <div key={doc.id} className="rounded-xl bg-slate-950 p-3 border border-slate-850">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{doc.documentType}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                      doc.status === 'Verified' 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">File: {doc.fileName}</p>
                  <p className="text-[9px] text-slate-500">Validated: {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                  
                  {doc.validationResults && (
                    <div className="mt-2 border-t border-slate-900 pt-1.5 space-y-1">
                      {doc.validationResults.slice(0, 2).map((res, rIdx) => (
                        <div key={rIdx} className="flex justify-between text-[9px]">
                          <span className="text-slate-500">{res.field}:</span>
                          <span className="text-slate-300 font-mono font-medium">{res.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
