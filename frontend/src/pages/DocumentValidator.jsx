/**
 * CivicLens AI — Document Validator Page (v5 — Cinematic Pitch Mode)
 * Framer Motion upload animations, slide-in results, premium glassmorphism.
 */

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { useAIActivity } from '../hooks/useAIActivity';
import AIReasoningSteps from '../components/ui/AIReasoningSteps';
import AIConfidenceRing from '../components/ui/AIConfidenceRing';
import {
  Upload, Camera, PenTool, FileText, CheckCircle2, XCircle,
  AlertTriangle, Info, X, FileUp, Image, Loader2, Sparkles,
  ChevronRight, Eye
} from 'lucide-react';

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.06 } } },
  item: {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  },
};

const TABS = [
  { id: 'photo', label: 'Passport Photo', icon: Camera, accept: 'image/jpeg,image/png', hint: 'JPEG or PNG, max 500KB' },
  { id: 'signature', label: 'Signature', icon: PenTool, accept: 'image/jpeg,image/png', hint: 'JPEG or PNG, max 300KB' },
  { id: 'pdf', label: 'PDF Document', icon: FileText, accept: 'application/pdf', hint: 'PDF, max 10MB' },
];

function StatusIcon({ passed }) {
  if (passed === true) return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
  if (passed === false) return <XCircle className="w-5 h-5 text-red-400" />;
  return <Info className="w-5 h-5 text-gray-500" />;
}

function ResultItem({ label, passed, detail }) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-xl border transition-colors
      ${passed ? 'bg-emerald-500/[0.04] border-emerald-500/15' : passed === false ? 'bg-red-500/[0.04] border-red-500/15' : 'bg-white/[0.02] border-white/[0.06]'}`}>
      <div className="flex items-center gap-3">
        <StatusIcon passed={passed} />
        <span className="text-sm font-medium text-gray-200">{label}</span>
      </div>
      {detail && <span className="text-xs text-gray-400 max-w-[200px] text-right">{detail}</span>}
    </div>
  );
}

export default function DocumentValidator() {
  const [activeTab, setActiveTab] = useState('photo');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const { startAgent, completeAgent, failAgent } = useAIActivity();

  const currentTab = TABS.find(t => t.id === activeTab);

  /* Reasoning steps per document type */
  const REASONING_STEPS = {
    photo: [
      { label: 'Detecting image dimensions…' },
      { label: 'Analyzing background uniformity…' },
      { label: 'Running face detection model…' },
      { label: 'Checking face centering & alignment…' },
      { label: 'Validating format & file size…' },
      { label: 'Scanning for heavy filters…' },
    ],
    signature: [
      { label: 'Measuring signature contrast…' },
      { label: 'Checking background whiteness…' },
      { label: 'Analyzing sharpness level…' },
      { label: 'Validating dimensions & format…' },
    ],
    pdf: [
      { label: 'Parsing PDF structure…' },
      { label: 'Checking encryption status…' },
      { label: 'Counting pages & orientation…' },
      { label: 'Extracting text content…' },
      { label: 'Validating file size…' },
    ],
  };

  const handleFile = useCallback((f) => {
    setFile(f);
    setResult(null);
    setError('');

    // Generate preview
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => setDragOver(false), []);

  const onFileSelect = useCallback((e) => {
    const f = e.target.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const validate = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);

    startAgent('validation', `Validating ${currentTab.label}: ${file.name}`);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const endpoint = `/validate/${activeTab}`;
      const response = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(response.data);

      const resultItems = getResultItemsFromData(response.data);
      const passed = resultItems.filter(i => i.passed).length;
      completeAgent('validation', `${passed}/${resultItems.length} checks passed`);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Validation failed. Please try again.';
      setError(msg);
      failAgent('validation', msg);
    } finally {
      setLoading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const switchTab = (tabId) => {
    setActiveTab(tabId);
    clearFile();
  };

  // Build result items based on validation type
  const getResultItemsFromData = (r) => {
    if (!r) return [];

    if (activeTab === 'photo') {
      return [
        { label: 'White Background', passed: r.background_check },
        { label: 'Face Detected', passed: r.face_detected },
        { label: 'Face Centered', passed: r.face_centered },
        { label: 'Resolution Valid', passed: r.resolution_valid },
        { label: 'Aspect Ratio (3:4)', passed: r.aspect_ratio_valid },
        { label: 'File Size', passed: r.file_size_valid, detail: `${(r.file_size_bytes / 1024).toFixed(0)}KB` },
        { label: 'Format (JPEG/PNG)', passed: r.format_valid },
        { label: 'No Heavy Filters', passed: r.no_heavy_filters },
      ];
    }

    if (activeTab === 'signature') {
      return [
        { label: 'White Background', passed: r.background_white },
        { label: 'Clear Contrast', passed: r.clear_contrast },
        { label: 'Not Blurry', passed: r.not_blurry },
        { label: 'Dimensions Valid', passed: r.dimensions_valid },
        { label: 'Format (JPEG/PNG)', passed: r.format_valid },
        { label: 'File Size', passed: r.file_size_valid, detail: `${(r.file_size_bytes / 1024).toFixed(0)}KB` },
      ];
    }

    if (activeTab === 'pdf') {
      return [
        { label: 'Valid PDF', passed: r.is_valid_pdf },
        { label: 'File Size', passed: r.file_size_valid, detail: `${(r.file_size_bytes / (1024 * 1024)).toFixed(1)}MB` },
        { label: 'Not Password Protected', passed: r.not_password_protected },
        { label: 'Page Count', passed: r.page_count > 0 && r.page_count <= 50, detail: `${r.page_count} pages` },
        { label: 'Orientation', passed: true, detail: r.orientation },
        { label: 'Has Readable Text', passed: r.has_text },
      ];
    }

    return [];
  };

  const getResultItems = () => getResultItemsFromData(result);

  /* Calculate confidence score from result checks */
  const getConfidenceScore = () => {
    const items = getResultItems();
    if (items.length === 0) return 0;
    const passed = items.filter(i => i.passed).length;
    return Math.round((passed / items.length) * 100);
  };

  return (
    <motion.div
      variants={stagger.container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={stagger.item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.08, rotate: 3 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-saffron-500 to-saffron-600 flex items-center justify-center shadow-lg shadow-saffron-500/20"
            >
              <FileUp className="w-5 h-5 text-white" />
            </motion.div>
            Document Validator
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            AI-powered validation for government document submissions
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-saffron-500/[0.08] border border-saffron-500/15">
          <Sparkles className="w-3.5 h-3.5 text-saffron-400 animate-sparkle" />
          <span className="text-xs text-saffron-400 font-medium">AI Powered</span>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={stagger.item} className="flex gap-2">
        {TABS.map((tab) => (
          <motion.button
            key={tab.id}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => switchTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200
              ${activeTab === tab.id
                ? 'bg-saffron-500/15 text-saffron-400 border border-saffron-500/25 shadow-sm shadow-saffron-500/10'
                : 'text-gray-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
              }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </motion.button>
        ))}
      </motion.div>

      <motion.div variants={stagger.item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Upload Area */}
        <div className="space-y-4">
          {/* Drop Zone */}
          <motion.div
            whileHover={!file ? { scale: 1.01 } : {}}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => !file && fileInputRef.current?.click()}
            className={`glass-card-cinematic p-8 text-center cursor-pointer transition-all duration-300 min-h-[300px] flex flex-col items-center justify-center relative
              ${dragOver ? 'border-saffron-500/40 bg-saffron-500/[0.04] scale-[1.01]' : file ? '' : 'upload-zone'}              
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={currentTab.accept}
              onChange={onFileSelect}
              className="hidden"
            />

            {file ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full"
              >
                {/* Preview */}
                {preview && (
                  <div className="mb-4 flex justify-center">
                    <div className="relative group">
                      <img
                        src={preview}
                        alt="Preview"
                        className="max-h-48 rounded-xl border border-white/[0.08] shadow-lg object-contain"
                      />
                      <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                )}

                {!preview && activeTab === 'pdf' && (
                  <div className="mb-4 flex justify-center">
                    <div className="w-24 h-32 rounded-xl bg-red-500/[0.08] border border-red-500/15 flex items-center justify-center">
                      <FileText className="w-10 h-10 text-red-400" />
                    </div>
                  </div>
                )}

                <p className="text-sm text-white font-medium truncate mb-1">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>

                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={(e) => { e.stopPropagation(); validate(); }}
                    disabled={loading}
                    className="btn-primary text-sm px-6 py-2.5 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Validating...</>
                    ) : (
                      <><CheckCircle2 className="w-4 h-4" /> Validate</>
                    )}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); clearFile(); }}
                    className="btn-secondary text-sm px-4 py-2.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4 mx-auto">
                  <Upload className="w-8 h-8 text-gray-500" />
                </div>
                <p className="text-gray-300 font-medium mb-1">
                  Drag & drop your {currentTab.label.toLowerCase()} here
                </p>
                <p className="text-xs text-gray-500 mb-4">{currentTab.hint}</p>
                <button className="btn-secondary text-sm px-5 py-2">
                  Browse Files
                </button>
              </motion.div>
            )}
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center gap-2 p-3 rounded-xl bg-red-500/[0.08] border border-red-500/15 text-red-400 text-sm"
              >
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI Reasoning Steps — visible during validation */}
          <AnimatePresence>
            {(loading || result || error) && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="glass-card-cinematic p-4"
              >
                <AIReasoningSteps
                  steps={REASONING_STEPS[activeTab] || []}
                  active={loading}
                  completed={!!result}
                  error={!!error}
                  errorMessage={error}
                  stepInterval={500}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Results Panel */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
              {/* Overall Status with Confidence Ring */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`glass-card-cinematic p-5 mb-4 border ${result.overall_valid ? 'border-emerald-500/20 bg-emerald-500/[0.03] result-glow-success' : 'border-red-500/20 bg-red-500/[0.03] result-glow-error'}`}
              >
                <div className="flex items-center gap-4 mb-3">
                  <AIConfidenceRing
                    score={getConfidenceScore()}
                    size={64}
                    strokeWidth={4}
                    showGlow={true}
                    animated={true}
                  />
                  <div className="flex-1">
                    {result.overall_valid ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <h3 className="font-display font-semibold text-white tracking-tight">All Checks Passed</h3>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <XCircle className="w-5 h-5 text-red-400" />
                        <h3 className="font-display font-semibold text-white tracking-tight">Issues Found</h3>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {getResultItems().filter(i => i.passed).length}/{getResultItems().length} checks passed
                    </p>
                  </div>
                </div>
                {result.recommendation && (
                  <p className="text-sm text-gray-300 bg-white/[0.03] rounded-lg p-3 border border-white/[0.04]">
                    <span className="text-saffron-400 font-medium">Recommendation: </span>
                    {result.recommendation}
                  </p>
                )}
              </motion.div>

              {/* Individual Checks */}
              <div className="space-y-2">
                {getResultItems().map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <ResultItem {...item} />
                  </motion.div>
                ))}
              </div>

              {/* PDF text preview */}
              {activeTab === 'pdf' && result.text_preview && (
                <div className="glass-card-premium p-4 mt-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-saffron-400" />
                    Text Preview
                  </h4>
                  <pre className="text-xs text-gray-400 bg-white/[0.02] rounded-lg p-3 border border-white/[0.04] max-h-48 overflow-auto whitespace-pre-wrap font-mono">
                    {result.text_preview}
                  </pre>
                </div>
              )}

              {/* Issues list */}
              {result.issues && result.issues.length > 0 && (
                <div className="glass-card-premium p-4 mt-4 border border-yellow-500/15">
                  <h4 className="text-sm font-medium text-yellow-400 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Issues ({result.issues.length})
                  </h4>
                  <ul className="space-y-1.5">
                    {result.issues.map((issue, i) => (
                      <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                        <ChevronRight className="w-3 h-3 text-yellow-500/60 mt-0.5 flex-shrink-0" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card-cinematic p-12 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4 mx-auto">
                <currentTab.icon className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-gray-400 font-medium mb-1">Upload & Validate</h3>
              <p className="text-xs text-gray-500">
                Upload your {currentTab.label.toLowerCase()} and click validate to see results here
              </p>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
