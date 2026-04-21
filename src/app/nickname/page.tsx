import NicknameGenerator from "@/components/NicknameGenerator";

export default function NicknamePage() {
  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <header>
        <h1 className="font-display text-5xl">Derby-naam roller</h1>
        <p className="text-derby-ink/70 mt-1">
          Nog geen derby-name? Geen zorgen — klik en de roller derby goden
          bepalen je lot.
        </p>
      </header>
      <NicknameGenerator />
    </div>
  );
}
