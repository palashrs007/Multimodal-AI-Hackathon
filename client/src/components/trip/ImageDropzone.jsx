import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, AlertCircle } from 'lucide-react';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_IMAGES = 10;

export function ImageDropzone({ images, onImagesChange, maxCount = MAX_IMAGES }) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Paste support: user can paste screenshots directly from clipboard!
  useEffect(() => {
    const handlePaste = (e) => {
      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      const items = Array.from(clipboardData.items);
      const imageFiles = [];

      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        processFiles(imageFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [images]);

  const processFiles = (fileList) => {
    setError(null);
    const validFiles = [];
    const remainingSlots = maxCount - images.length;

    if (remainingSlots <= 0) {
      setError(`Maximum limit of ${maxCount} screenshots reached.`);
      return;
    }

    const filesToProcess = Array.from(fileList).slice(0, remainingSlots);

    for (const file of filesToProcess) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`"${file.name}" is not a supported format. Please upload JPEG, PNG, or WebP.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`"${file.name}" exceeds the 5 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB).`);
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      validFiles.push({
        id: crypto.randomUUID(),
        file,
        previewUrl,
        name: file.name,
        size: file.size,
      });
    }

    if (validFiles.length > 0) {
      onImagesChange([...images, ...validFiles]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files) {
      processFiles(e.target.files);
      e.target.value = ''; // Reset input
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-300 flex flex-col items-center justify-center ${
          isDragging
            ? 'border-coral-500 bg-coral-50/50 scale-[1.01]'
            : 'border-stone-300 hover:border-coral-400 bg-stone-50/60 hover:bg-stone-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="w-14 h-14 rounded-2xl bg-coral-100 text-coral-600 flex items-center justify-center mb-3.5 shadow-sm group-hover:scale-105 transition-transform">
          <UploadCloud className="w-7 h-7 stroke-[2]" />
        </div>

        <h4 className="text-base font-bold text-stone-900 mb-1">
          Drop Instagram or Pinterest screenshots here
        </h4>
        <p className="text-xs text-stone-500 max-w-sm leading-relaxed mb-3">
          Drag & drop, browse files, or press <kbd className="px-1.5 py-0.5 rounded bg-stone-200 text-stone-700 font-mono text-[10px]">Ctrl+V</kbd> to paste directly.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold text-stone-400">
          <span className="px-2.5 py-0.5 rounded-full bg-stone-200/60">0 to 10 images (optional)</span>
          <span className="px-2.5 py-0.5 rounded-full bg-stone-200/60">JPEG, PNG, WebP</span>
          <span className="px-2.5 py-0.5 rounded-full bg-stone-200/60">Max 5MB each</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center space-x-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-slide-up">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export default ImageDropzone;
