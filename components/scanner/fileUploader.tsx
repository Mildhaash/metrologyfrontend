"use client";

import { useState, useRef, useCallback } from "react";
import { Image, Film, FileText, X } from "lucide-react";

interface FileUploaderProps {
  onFileSelect: (file: File | null) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getFileExtension(name: string): string {
  return name.split(".").pop()?.toUpperCase() || "";
}

function getFileCategory(type: string): string {
  if (type.startsWith("image/")) return "Image";
  if (type.startsWith("video/")) return "Video";
  return "File";
}

export default function FileUploader({ onFileSelect }: FileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const url = URL.createObjectURL(file);
      setPreview(url);
      setSelectedFile(file);
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setSelectedFile(null);
    onFileSelect(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  // File selected preview
  if (selectedFile) {
    return (
      <div className="flex flex-col gap-5">
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-2xl p-5 transition-all duration-300
            ${
              dragActive
                ? "border-violet-400 bg-violet-50 scale-[1.01]"
                : "border-violet-200 hover:border-violet-300"
            }
          `}
        >
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-violet-100 flex-shrink-0">
              {preview && (
                <img
                  src={preview}
                  alt={selectedFile.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {getFileCategory(selectedFile.type)} &bull; {formatFileSize(selectedFile.size)} &bull; {getFileExtension(selectedFile.name)}
              </p>
            </div>
            <button
              onClick={handleRemove}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors group"
            >
              <X className="w-5 h-5 text-red-400 group-hover:text-red-500" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty drag & drop zone
  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`
        relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300
        ${
          dragActive
            ? "border-violet-400 bg-violet-100/60 scale-[1.02]"
            : "border-violet-300 hover:border-violet-400 hover:bg-white/60"
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />

      <div className="flex items-center justify-center gap-2 mb-5">
        <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
          <Film className="w-5 h-5 text-violet-500" />
        </div>
        <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center -translate-y-1">
          <Image className="w-6 h-6 text-violet-600" />
        </div>
        <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
          <FileText className="w-5 h-5 text-violet-500" />
        </div>
      </div>

      <p className="text-lg font-semibold text-gray-800 mb-1">
        Drag & drop <span className="text-violet-600">images</span>,{" "}
        <span className="text-violet-600">videos</span>, or any{" "}
        <span className="text-violet-600">file</span>
      </p>
      <p className="text-sm text-gray-500">
        or{" "}
        <span className="text-violet-600 font-medium underline underline-offset-2">
          browse files
        </span>{" "}
        on your computer
      </p>
    </div>
  );
}
