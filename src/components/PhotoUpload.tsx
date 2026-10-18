"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { prepareUpload } from "@/lib/image-resize";

type Consent = "yes" | "no";
type Summary = { approved: number; pending: number; failed: number };

const CONCURRENCY = 3;
const PREPARE_TIMEOUT_MS = 3 * 60 * 1000;

export default function PhotoUpload({
  open,
  onUploaded,
}: {
  open: boolean;
  onUploaded?: () => void;
}) {
  const t = useTranslations("Photos.upload");
  const [files, setFiles] = useState<File[]>([]);
  const [name, setName] = useState("");
  const [consent, setConsent] = useState<Consent | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const stop = () => setPreparing(false);
    input.addEventListener("cancel", stop);
    return () => input.removeEventListener("cancel", stop);
  }, [open]);

  useEffect(() => {
    if (!preparing) return;
    const timer = setTimeout(() => setPreparing(false), PREPARE_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [preparing]);

  if (!open) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow">
        <h2 className="font-display text-2xl">{t("heading")}</h2>
        <p className="text-derby-ink/70 mt-1">{t("closed")}</p>
      </div>
    );
  }

  async function uploadOne(file: File, shareable: Consent): Promise<keyof Summary> {
    try {
      const { full, thumb } = await prepareUpload(file, shareable === "yes" ? 2048 : 1280);
      const form = new FormData();
      form.set("full", full.blob, "photo.jpg");
      form.set("thumb", thumb.blob, "thumb.jpg");
      form.set("width", String(full.width));
      form.set("height", String(full.height));
      form.set("shareable", shareable);
      if (name.trim()) form.set("name", name.trim());
      const res = await fetch("/api/photos", { method: "POST", body: form });
      if (res.status === 403) setError(t("closed"));
      if (!res.ok) return "failed";
      const { status } = (await res.json()) as { status: string };
      return status === "approved" ? "approved" : "pending";
    } catch {
      return "failed";
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!files.length || !consent) return;
    setError(null);
    setSummary(null);
    setProgress(0);
    const result: Summary = { approved: 0, pending: 0, failed: 0 };
    const queue = [...files];
    let done = 0;
    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
        for (let file = queue.shift(); file; file = queue.shift()) {
          result[await uploadOne(file, consent)]++;
          setProgress(++done);
        }
      }),
    );
    setProgress(null);
    setSummary(result);
    setFiles([]);
    if (result.approved) onUploaded?.();
  }

  const busy = progress !== null;

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl p-5 shadow space-y-4">
      <h2 className="font-display text-2xl">{t("heading")}</h2>

      <label className="block">
        <span className="block text-sm font-bold mb-1">{t("fileLabel")}</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={busy}
          onClick={() => setPreparing(true)}
          onChange={(e) => {
            setPreparing(false);
            setFiles(Array.from(e.target.files ?? []));
            setSummary(null);
          }}
          className={`block w-full text-sm ${preparing ? "pointer-events-none opacity-50" : ""}`}
        />
        {preparing && (
          <span role="status" className="mt-2 flex items-center gap-2 text-sm">
            <span
              className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden
            />
            {t("preparing")}
          </span>
        )}
        {!preparing && files.length > 0 && (
          <span className="block text-sm text-derby-ink/70 mt-1">
            {t("selected", { count: files.length })}
          </span>
        )}
      </label>

      <input
        type="text"
        aria-label={t("namePlaceholder")}
        placeholder={t("namePlaceholder")}
        value={name}
        maxLength={60}
        disabled={busy}
        onChange={(e) => setName(e.target.value)}
        className="w-full border border-derby-ink/20 rounded-lg px-3 py-2"
      />

      <fieldset className="space-y-2">
        <legend className="text-sm font-bold mb-1">{t("consentLegend")}</legend>
        {(["yes", "no"] as const).map((value) => (
          <label key={value} className="flex items-start gap-2 text-sm">
            <input
              type="radio"
              name="consent"
              value={value}
              checked={consent === value}
              disabled={busy}
              onChange={() => setConsent(value)}
              required
              className="mt-1"
            />
            <span>{value === "yes" ? t("consentYes") : t("consentNo")}</span>
          </label>
        ))}
      </fieldset>

      <p className="text-xs text-derby-ink/60">
        {t.rich("moderationNote", {
          link: (chunks) => (
            <Link href="/privacy#photos" className="underline">
              {chunks}
            </Link>
          ),
        })}
      </p>

      {error && (
        <p role="alert" className="text-sm text-derby-accent">
          {error}
        </p>
      )}
      {busy && (
        <div role="status" className="space-y-1">
          <p className="text-sm">{t("progress", { done: progress, total: files.length })}</p>
          <div className="h-2 rounded-full bg-derby-ink/10 overflow-hidden">
            <div
              className="h-full bg-derby-accent transition-all"
              style={{ width: `${Math.max(4, (progress / files.length) * 100)}%` }}
            />
          </div>
        </div>
      )}
      {summary && (
        <div role="status" className="text-sm space-y-1">
          {summary.approved > 0 && (
            <p className="text-green-700">{t("doneApproved", { count: summary.approved })}</p>
          )}
          {summary.pending > 0 && <p>{t("donePending", { count: summary.pending })}</p>}
          {summary.failed > 0 && (
            <p className="text-derby-accent">{t("doneFailed", { count: summary.failed })}</p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={!files.length || !consent || busy || preparing}
        className="bg-derby-accent text-white rounded-full px-5 py-2 font-bold disabled:opacity-40"
      >
        {busy ? t("busy") : t("submit")}
      </button>
    </form>
  );
}
