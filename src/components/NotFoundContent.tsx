import RoadkillLogo from "@/components/RoadkillLogo";

type Props = {
  title: string;
  lead: string;
  actions: React.ReactNode;
};

export default function NotFoundContent({ title, lead, actions }: Props) {
  return (
    <section className="relative overflow-hidden bg-derby-ink text-white rounded-2xl p-6 pb-10 sm:p-10 sm:pb-14 shadow-lg">
      <div
        className="pointer-events-none absolute -right-16 -top-6 w-56 opacity-20 rotate-[-8deg] sm:w-80 sm:opacity-30"
        aria-hidden
      >
        <RoadkillLogo className="w-full h-auto text-white" />
      </div>
      <div className="stripes absolute inset-x-0 bottom-0 h-2" aria-hidden />
      <div className="relative space-y-4 max-w-xl">
        <p className="font-display text-derby-accent text-7xl sm:text-8xl leading-none">404</p>
        <h1 className="font-display text-5xl sm:text-6xl leading-none">{title}</h1>
        <p className="text-lg text-white/80">{lead}</p>
        <div className="flex flex-wrap gap-3 pt-2">{actions}</div>
      </div>
    </section>
  );
}

export const primaryAction =
  "inline-flex items-center rounded-full bg-derby-accent px-5 py-2 font-bold text-white hover:bg-white hover:text-derby-ink transition";
export const secondaryAction =
  "inline-flex items-center rounded-full border-2 border-white/60 px-5 py-2 font-bold text-white hover:bg-white hover:text-derby-ink transition";
