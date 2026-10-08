import type { ReactNode } from "react";
import { Illustration } from "@/components/Illustration";

export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-border bg-card/60 px-6 py-12 text-center">
      <Illustration className="h-44 w-auto max-w-[260px]" />
      <h3 className="mt-2 font-display text-lg font-bold">{title}</h3>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
