import { Logo } from "@/components/Logo";

export function PageLoader({ label = "Chargement…" }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8">
      <div className="animate-pulse">
        <Logo size={56} />
      </div>
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
    </div>
  );
}
