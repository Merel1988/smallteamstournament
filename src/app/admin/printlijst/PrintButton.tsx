"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="bg-derby-ink text-white rounded-full px-4 py-2 font-bold print:hidden"
    >
      Printen
    </button>
  );
}
