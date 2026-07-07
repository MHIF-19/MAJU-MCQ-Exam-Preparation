"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  X,
  AlertCircle,
  Loader2,
  CheckCircle,
} from "lucide-react";
import {
  MAX_FILE_SIZE,
  MAX_TOTAL_SIZE,
  MAX_FILE_COUNT,
  SUPPORTED_EXTENSIONS,
} from "@/types";

interface FileUploadProps {
  onFileProcessed: (text: string, fileName: string) => void;
}

export default function FileUpload({ onFileProcessed }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [currentFileName, setCurrentFileName] = useState("");
  const [totalFiles, setTotalFiles] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const validateFilesList = (filesList: File[]): string | null => {
    if (filesList.length === 0) {
      return "No files selected.";
    }
    if (filesList.length > MAX_FILE_COUNT) {
      return `Maximum ${MAX_FILE_COUNT} files allowed. You selected ${filesList.length} files.`;
    }

    let totalSize = 0;
    for (const file of filesList) {
      const extension = "." + file.name.split(".").pop()?.toLowerCase();
      if (
        !SUPPORTED_EXTENSIONS.includes(
          extension as (typeof SUPPORTED_EXTENSIONS)[number]
        )
      ) {
        return `Unsupported file type for "${file.name}". Supported: ${SUPPORTED_EXTENSIONS.join(", ")}`;
      }
      if (file.size > MAX_FILE_SIZE) {
        return `File "${file.name}" exceeds the 20 MB size limit.`;
      }
      if (file.size === 0) {
        return `File "${file.name}" is empty.`;
      }
      totalSize += file.size;
    }

    if (totalSize > MAX_TOTAL_SIZE) {
      return `Total files size exceeds 50 MB limit. Current total: ${(totalSize / (1024 * 1024)).toFixed(1)} MB.`;
    }

    return null;
  };

  const processFiles = useCallback(
    async (selectedFiles: File[]) => {
      const validationError = validateFilesList(selectedFiles);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      setIsProcessing(true);
      setTotalFiles(selectedFiles.length);
      setProgress(5);

      try {
        let combinedText = "";
        const fileNames: string[] = [];

        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          setCurrentFileIndex(i + 1);
          setCurrentFileName(file.name);
          
          // Calculate baseline progress for start of this file
          const baseProgress = (i / selectedFiles.length) * 100;
          setProgress(Math.round(baseProgress + 5));

          const formData = new FormData();
          formData.append("file", file);

          const response = await fetch("/api/parse", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Failed to parse "${file.name}".`);
          }

          const data = await response.json();
          if (!data.success) {
            throw new Error(data.error || `Failed to parse "${file.name}".`);
          }

          // Format section header to separate combined texts
          combinedText += `\n\n--- DOCUMENT: ${file.name} ---\n\n` + data.text;
          fileNames.push(file.name);

          // Calculate progress for end of this file
          const endProgress = ((i + 1) / selectedFiles.length) * 100;
          setProgress(Math.round(endProgress));
        }

        setProgress(100);
        await new Promise((r) => setTimeout(r, 600));

        onFileProcessed(combinedText.trim(), fileNames.join(", "));
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "An unexpected error occurred during processing.";
        setError(message);
      } finally {
        setIsProcessing(false);
        setProgress(0);
        setTotalFiles(0);
        setCurrentFileName("");
      }
    },
    [onFileProcessed]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (isProcessing) return;
      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) processFiles(droppedFiles);
    },
    [processFiles, isProcessing]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
      if (selectedFiles.length > 0) processFiles(selectedFiles);
    },
    [processFiles]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto"
    >
      {/* Drop Zone */}
      <motion.div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden ${
          isDragging
            ? "border-violet-400 bg-violet-500/10 scale-[1.02]"
            : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
        } ${isProcessing ? "pointer-events-none" : ""}`}
        whileHover={!isProcessing ? { scale: 1.01 } : {}}
        whileTap={!isProcessing ? { scale: 0.99 } : {}}
        onClick={() => {
          if (!isProcessing) {
            document.getElementById("file-input")?.click();
          }
        }}
      >
        {/* Gradient border glow */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500/20 via-fuchsia-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />

        <div className="relative p-10 md:p-14 flex flex-col items-center text-center">
          <AnimatePresence mode="wait">
            {isProcessing ? (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center gap-4 w-full"
              >
                <div className="relative">
                  <Loader2 className="w-12 h-12 text-violet-400 animate-spin" />
                  <div className="absolute inset-0 w-12 h-12 rounded-full bg-violet-500/20 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <p className="text-white font-medium">
                    Analyzing file {currentFileIndex} of {totalFiles}...
                  </p>
                  <p className="text-sm text-white/50 max-w-sm truncate mx-auto">
                    {currentFileName}
                  </p>
                </div>
                {/* Progress bar */}
                <div className="w-full max-w-xs h-1.5 bg-white/10 rounded-full overflow-hidden mx-auto">
                  <motion.div
                    className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="upload"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center gap-4"
              >
                <motion.div
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center"
                  animate={
                    isDragging
                      ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }
                      : {}
                  }
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <Upload className="w-7 h-7 text-violet-400" />
                </motion.div>
                <div className="space-y-2">
                  <p className="text-white font-semibold text-lg">
                    Upload Your Notes
                  </p>
                  <p className="text-sm text-white/40 max-w-sm">
                    Drag & drop or click to browse. Select one or multiple files (up to 10 files, max 50 MB total).
                  </p>
                </div>
                {/* File type badges */}
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {["PDF", "DOC", "DOCX", "PPT", "PPTX"].map((ext) => (
                    <span
                      key={ext}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-white/[0.06] text-white/50 border border-white/[0.06]"
                    >
                      .{ext.toLowerCase()}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <input
          id="file-input"
          type="file"
          accept=".pdf,.doc,.docx,.ppt,.pptx"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </motion.div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-300 font-medium">Upload Error</p>
              <p className="text-sm text-red-400/70 mt-0.5">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400/50 hover:text-red-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
