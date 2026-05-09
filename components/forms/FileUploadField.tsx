"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface Props {
  label: string;
  bucket: string;
  folder: string;
  accept?: string; // defaults to pdf,png,jpg,jpeg
  onUpload: (url: string) => void;
}

const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export default function FileUploadField({
  label,
  bucket,
  folder,
  accept = ".pdf,.png,.jpg,.jpeg",
  onUpload,
}: Props) {
  const [status, setStatus] = useState<
    "idle" | "uploading" | "done" | "error"
  >("idle");
  const [msg, setMsg] = useState("");
  const [fileName, setFileName] = useState("");

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setMsg("");
    setStatus("idle");

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setMsg("Only PDF, PNG, JPG or JPEG files are allowed.");
      setStatus("error");
      return;
    }

    // Validate size
    if (file.size > MAX_SIZE) {
      setMsg("File size must not exceed 5MB.");
      setStatus("error");
      return;
    }

    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    try {
      setStatus("uploading");

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);

      onUpload(data.publicUrl);
      setFileName(file.name);
      setStatus("done");
      setMsg("Uploaded successfully.");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMsg("Upload failed. Please try again.");
    }
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label} <span className="text-red-500">*</span>
      </label>

      <div
        className={`relative rounded-xl border-2 border-dashed px-5 py-5 transition ${
          status === "done"
            ? "border-green-400 bg-green-50"
            : status === "error"
            ? "border-red-300 bg-red-50"
            : "border-slate-300 bg-slate-50 hover:border-[#0B1F3A]"
        }`}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleChange}
          disabled={status === "uploading"}
          className="absolute inset-0 cursor-pointer opacity-0"
        />

        <div className="flex items-center gap-4">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              status === "done"
                ? "bg-green-100 text-green-600"
                : status === "error"
                ? "bg-red-100 text-red-600"
                : "bg-slate-200 text-slate-500"
            }`}
          >
            {status === "uploading" ? (
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            ) : status === "done" ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-700">
              {status === "uploading"
                ? "Uploading..."
                : status === "done"
                ? fileName
                : "Click to upload or drag file here"}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              PDF, PNG, JPG — max 5MB
            </p>
          </div>
        </div>
      </div>

      {msg && (
        <p
          className={`mt-2 text-xs font-medium ${
            status === "done" ? "text-green-600" : "text-red-600"
          }`}
        >
          {msg}
        </p>
      )}
    </div>
  );
}