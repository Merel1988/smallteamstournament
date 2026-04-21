"use client";

import { upload } from "@vercel/blob/client";
import { useState } from "react";

export default function PhotoUpload({ onUploaded }: { onUploaded?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/photos",
        clientPayload: JSON.stringify({
          uploaderName: name || undefined,
          caption: caption || undefined,
        }),
      });
      setDone(true);
      setFile(null);
      setCaption("");
      onUploaded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload mislukt.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="bg-white rounded-2xl p-5 shadow space-y-3"
    >
      <h2 className="font-display text-2xl">Stuur je foto in</h2>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="block w-full text-sm"
      />
      <input
        type="text"
        placeholder="Jouw (derby-)naam (optioneel)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full border border-derby-ink/20 rounded-lg px-3 py-2"
      />
      <input
        type="text"
        placeholder="Korte caption (optioneel)"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        className="w-full border border-derby-ink/20 rounded-lg px-3 py-2"
      />

      {error && <p className="text-sm text-derby-accent">{error}</p>}
      {done && <p className="text-sm text-green-700">Bedankt, foto staat online!</p>}

      <button
        type="submit"
        disabled={!file || busy}
        className="bg-derby-accent text-white rounded-full px-5 py-2 font-bold disabled:opacity-40"
      >
        {busy ? "Bezig…" : "Upload"}
      </button>
    </form>
  );
}
