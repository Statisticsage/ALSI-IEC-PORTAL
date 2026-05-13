"use client";

/**
 * components/forms/FileUploadField.tsx
 * Reusable file upload field for IEC registration forms.
 * Uploads directly to Supabase Storage (anon key, RLS enforced on bucket).
 * Returns the storage path URL via onUpload callback.
 */

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface FileUploadFieldProps {
  label: string;
  bucket: string;
  folder: string;
  onUpload: (url: string) => void;
  accept?: string;
}

const MAX_SIZE_MB = 20;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const ALLOWED_MIME_TYPES: Record<string, string> = {
  "application/pdf": "PDF",
  "image/png":       "PNG",
  "image/jpeg":      "JPG",
  "image/jpg":       "JPG",
};

export default function FileUploadField({
  label,
  bucket,
  folder,
  onUpload,
  accept = ".pdf,.png,.jpg,.jpeg",
}: FileUploadFieldProps) {
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [fileName, setFileName] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg("");
    setStatus("idle");

    // Validate type
    if (!ALLOWED_MIME_TYPES[file.type]) {
      setErrorMsg("Invalid file type. Only PDF, PNG, JPG are accepted.");
      setStatus("error");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    // Validate size
    if (file.size > MAX_SIZE_BYTES) {
      setErrorMsg(`File too large. Maximum size is ${MAX_SIZE_MB}MB.`);
      setStatus("error");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setFileName(file.name);
    setStatus("uploading");

    try {
      // Build a unique path: folder/timestamp-randomhex-filename
      const ext = file.name.split(".").pop() ?? "bin";
      const safeName = file.name
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .toLowerCase();
      const uniquePath = `${folder}/${Date.now()}-${Math.random().toString(16).slice(2)}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(uniquePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        console.error("[FileUpload] Upload error:", uploadError.message);
        setErrorMsg(
          uploadError.message.includes("row-level security") || uploadError.message.includes("Unauthorized")
            ? "Upload blocked. Please refresh the page and try again."
            : `Upload failed: ${uploadError.message}`
        );
        setStatus("error");
        if (inputRef.current) inputRef.current.value = "";
        return;
      }

      // Return the storage path — the form stores this, admin accesses via signed URL
      onUpload(uniquePath);
      setStatus("done");
    } catch (err) {
      console.error("[FileUpload] Unexpected error:", err);
      setErrorMsg("Unexpected upload error. Please try again.");
      setStatus("error");
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleReset() {
    setStatus("idle");
    setFileName("");
    setErrorMsg("");
    onUpload("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="grid gap-2">
      <label className="block text-sm font-medium text-slate-700">
        {label} <span className="text-red-500">*</span>
      </label>

      {status === "done" ? (
        // Success state
        <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <svg className="h-4 w-4 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium text-green-700 truncate">{fileName}</span>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="ml-3 shrink-0 text-xs text-green-600 underline hover:text-green-800"
          >
            Change
          </button>
        </div>
      ) : (
        // Upload state
        <label className={`
          flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition
          ${status === "uploading" ? "border-slate-200 bg-slate-50 cursor-not-allowed" : ""}
          ${status === "error"     ? "border-red-300 bg-red-50 hover:border-red-400" : ""}
          ${status === "idle"      ? "border-slate-300 bg-white hover:border-[#0B1F3A] hover:bg-slate-50" : ""}
        `}>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleChange}
            disabled={status === "uploading"}
            className="sr-only"
          />

          {status === "uploading" ? (
            <>
              <svg className="mb-2 h-5 w-5 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm text-slate-500">Uploading...</span>
            </>
          ) : (
            <>
              <svg className="mb-2 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <span className="text-sm font-medium text-slate-600">
                {status === "error" ? "Try again — click to select file" : "Click to upload"}
              </span>
              <span className="mt-1 text-xs text-slate-400">PDF, PNG, JPG — max {MAX_SIZE_MB}MB</span>
            </>
          )}
        </label>
      )}

      {errorMsg && (
        <p className="text-xs font-medium text-red-600">{errorMsg}</p>
      )}
    </div>
  );
}