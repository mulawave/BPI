"use client";

import { useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { FiUploadCloud } from "react-icons/fi";

export default function PluginUploadPanel({ onUploaded }: { onUploaded?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [issues, setIssues] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const fileInfo = useMemo(() => {
    if (!file) return null;
    const sizeInMb = file.size / (1024 * 1024);
    return `${file.name} (${sizeInMb.toFixed(2)} MB)`;
  }, [file]);

  const handleUpload = async () => {
    if (!file) {
      toast.error("Select a plugin archive first");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setIsUploading(true);
      setIssues([]);

      const response = await fetch("/api/upload/plugins", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok) {
        const nextIssues = Array.isArray(payload?.issues)
          ? payload.issues.map((issue: { code?: string; message?: string }) => `${issue.code || "POLICY"}: ${issue.message || "Upload policy failure"}`)
          : [payload?.error || "Upload failed"]; 
        setIssues(nextIssues);
        toast.error(payload?.error || "Upload failed");
        return;
      }

      toast.success("Plugin archive uploaded to quarantine");
      setFile(null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      onUploaded?.();
    } catch (error) {
      console.error("Plugin upload failed", error);
      toast.error("Plugin upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card/70 p-5 shadow-lg shadow-black/5 backdrop-blur-sm dark:shadow-black/20">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Upload Plugin Package</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Artifacts are quarantined first. Validation and lifecycle actions continue in plugin detail.
          </p>
        </div>
        <div className="rounded-xl bg-[hsl(var(--muted))] p-2.5">
          <FiUploadCloud className="h-5 w-5 text-[hsl(var(--primary))]" />
        </div>
      </div>

      <div className="space-y-3">
        <input
          ref={inputRef}
          type="file"
          accept=".zip,.tar,.tar.gz,.tgz,.json"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="block w-full rounded-xl border border-border bg-background/60 px-3 py-2 text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-[hsl(var(--primary))/0.15] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[hsl(var(--primary))]"
        />

        <div className="rounded-xl border border-border bg-background/40 px-3 py-2 text-xs text-muted-foreground">
          {fileInfo || "No file selected"}
        </div>

        <button
          type="button"
          onClick={handleUpload}
          disabled={isUploading}
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploading ? "Uploading..." : "Upload to Quarantine"}
        </button>

        {issues.length ? (
          <div className="rounded-xl border border-rose-300/50 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-700/40 dark:bg-rose-900/20 dark:text-rose-300">
            <p className="font-semibold">Policy checks failed:</p>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              {issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
