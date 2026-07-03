"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { sendPush, type PushFormState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-derby-accent text-white rounded-full px-5 py-2 font-bold disabled:opacity-60"
    >
      {pending ? "Versturen…" : "Verstuur naar iedereen"}
    </button>
  );
}

export default function PushForm() {
  const [state, formAction] = useActionState<PushFormState, FormData>(
    sendPush,
    null,
  );

  return (
    <div className="space-y-4">
      <form action={formAction} className="bg-white rounded-2xl p-5 shadow space-y-3">
        <input
          name="title"
          required
          placeholder="Titel (bv. 'Finale begint over 5 min!')"
          className="w-full border border-derby-ink/20 rounded-lg px-3 py-2"
        />
        <textarea
          name="body"
          required
          placeholder="Berichttekst"
          className="w-full border border-derby-ink/20 rounded-lg px-3 py-2"
          rows={3}
        />
        <input
          name="url"
          placeholder="Link (optioneel, bv. /schema)"
          className="w-full border border-derby-ink/20 rounded-lg px-3 py-2"
        />
        <SubmitButton />
      </form>

      {state && !state.ok && (
        <div
          role="alert"
          className="bg-derby-accent/10 border border-derby-accent/30 text-derby-accent-dark rounded-xl p-4"
        >
          {state.error}
        </div>
      )}

      {state && state.ok && (
        <div
          role="status"
          className="bg-white border border-derby-ink/10 rounded-xl p-4 space-y-2"
        >
          <p className="font-bold">
            {state.sent} verstuurd
            {state.removed > 0 && `, ${state.removed} verlopen abonnee(s) opgeruimd`}
            {state.failed > 0 && `, ${state.failed} mislukt`}.
          </p>
          {state.sent === 0 && state.failed === 0 && state.removed === 0 && (
            <p className="text-derby-ink/70">
              Er waren geen abonnees om naar te versturen.
            </p>
          )}
          {state.errors.length > 0 && (
            <div className="text-sm text-derby-ink/70">
              <p className="font-medium">Fouten:</p>
              <ul className="list-disc list-inside">
                {state.errors.map((e, i) => (
                  <li key={i} className="break-words">
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
