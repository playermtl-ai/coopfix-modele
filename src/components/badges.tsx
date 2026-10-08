import {
  CheckCircle2,
  Droplets,
  Flame,
  Flag,
  Hammer,
  Loader2,
  ShieldCheck,
  Siren,
  Sparkles,
  TreePine,
  User,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PRIORITY_LABELS,
  ROLE_LABELS,
  STATUS_LABELS,
  type Role,
  type TicketCategory,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/types";

export function StatusBadge({ status }: { status: TicketStatus }) {
  const cfg = {
    nouveau: {
      icon: Sparkles,
      cls: "bg-[#FBE8A6] text-[#7A5A0F] border-[#F1D98B]",
    },
    en_cours: {
      icon: Loader2,
      cls: "bg-[#F7E3E7] text-[#9B1B30] border-[#EFCBD4]",
    },
    termine: {
      icon: CheckCircle2,
      cls: "bg-[#E3F0E4] text-[#3D6B44] border-[#CDE3CF]",
    },
  }[status];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold",
        cfg.cls
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {STATUS_LABELS[status]}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TicketPriority | null }) {
  if (!priority) {
    return (
      <span className="inline-flex shrink-0 items-center rounded-full border border-dashed border-border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
        Priorité à définir
      </span>
    );
  }
  const cfg = {
    urgent: { icon: Siren, cls: "bg-[#C81E3D] text-white border-transparent" },
    prioritaire: {
      icon: Flag,
      cls: "bg-[#FFF1C9] text-[#8A6D1A] border-[#F3DE9C]",
    },
    normal: {
      icon: CheckCircle2,
      cls: "bg-[#EDF4EC] text-[#4C7A53] border-[#D8E7D9]",
    },
  }[priority];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold",
        cfg.cls
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

export function RoleBadge({ role }: { role: Role }) {
  const isAdmin = role === "admin";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold",
        isAdmin
          ? "bg-[#9B1B30] text-white"
          : "bg-muted text-muted-foreground"
      )}
    >
      {isAdmin ? <ShieldCheck className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
      {ROLE_LABELS[role]}
    </span>
  );
}

export const CATEGORY_META: {
  value: TicketCategory;
  label: string;
  icon: LucideIcon;
  cls: string;
}[] = [
  { value: "plomberie", label: "Plomberie", icon: Droplets, cls: "bg-sky-100 text-sky-700" },
  { value: "electricite", label: "Électricité", icon: Zap, cls: "bg-amber-100 text-amber-700" },
  { value: "chauffage", label: "Chauffage", icon: Flame, cls: "bg-orange-100 text-orange-700" },
  { value: "menuiserie", label: "Menuiserie", icon: Hammer, cls: "bg-[#F3E9D2] text-[#7A5A0F]" },
  { value: "exterieur", label: "Extérieur", icon: TreePine, cls: "bg-emerald-100 text-emerald-700" },
  { value: "autre", label: "Autre", icon: Wrench, cls: "bg-[#F7E3E7] text-[#9B1B30]" },
];

export function categoryMeta(category: TicketCategory) {
  return CATEGORY_META.find((c) => c.value === category) ?? CATEGORY_META[CATEGORY_META.length - 1];
}

export function CategoryChip({ category }: { category: TicketCategory }) {
  const meta = categoryMeta(category);
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold",
        meta.cls
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}
