type SearchParams = Promise<{ error?: string; next?: string }>;

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { error, next } = await searchParams;

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <form
        method="POST"
        action="/api/admin/login"
        className="bg-white rounded-2xl p-6 shadow max-w-sm w-full space-y-4"
      >
        <h1 className="font-display text-3xl">Admin login</h1>
        <p className="text-sm text-derby-ink/70">
          Gedeeld wachtwoord voor organisatoren.
        </p>

        {next && <input type="hidden" name="next" value={next} />}

        <input
          type="password"
          name="password"
          required
          autoFocus
          placeholder="Wachtwoord"
          className="w-full border border-derby-ink/20 rounded-lg px-3 py-2"
        />

        {error && (
          <p className="text-sm text-derby-accent">
            Onjuist wachtwoord, probeer opnieuw.
          </p>
        )}

        <button
          type="submit"
          className="w-full bg-derby-ink text-derby-yellow rounded-full py-2 font-bold"
        >
          Inloggen
        </button>
      </form>
    </div>
  );
}
