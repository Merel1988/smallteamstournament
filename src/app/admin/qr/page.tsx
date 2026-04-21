"use client";

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";

export default function AdminQrPage() {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUrl(window.location.origin);
    }
  }, []);

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <h1 className="font-display text-4xl">QR code</h1>
      <p className="text-derby-ink/70">
        Print uit op A5 en hang op bij de ingang / de bar. Wanneer bezoekers
        scannen, komen ze direct op de homepage van de app.
      </p>

      <div className="bg-white rounded-2xl p-6 shadow text-center">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full border border-derby-ink/20 rounded-lg px-3 py-2 mb-4 text-center text-sm"
        />
        {url && (
          <QRCodeSVG value={url} size={256} className="mx-auto" level="M" />
        )}
        <p className="font-display text-2xl mt-4">STT Nijmegen</p>
        <p className="text-sm text-derby-ink/70 break-all">{url}</p>
      </div>
    </div>
  );
}
