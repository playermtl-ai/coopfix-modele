import { useUnreadComments } from "@/lib/unread-comments";
import { Link } from "react-router-dom";
import { ChevronRight, MessageCircle } from "lucide-react";
import { CategoryChip, PriorityBadge, StatusBadge, categoryMeta } from "@/components/badges";
import { formatDate } from "@/lib/format";
import type { TicketWithMeta } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

export function TicketCard({ ticket }: { ticket: TicketWithMeta }) {
  const { profile } = useAuth();
  const { data: unread } = useUnreadComments();
  const isUnread = unread?.has(ticket.id);
  const isAdmin = profile?.role === "admin";
  const meta = categoryMeta(ticket.category);
  const Icon = meta.icon;
  const commentCount = ticket.comments?.[0]?.count ?? 0;

  return (
    <Link
      to={`/billets/${ticket.id}`}
      className={cn(
        "group flex items-center gap-4 rounded-3xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md md:p-5"
      )}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-background">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate font-display text-base font-bold group-hover:text-primary md:text-lg">
            {ticket.title}
          </h3>
          <CategoryChip category={ticket.category} />
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          {isAdmin && ticket.reporter && (
            <span className="font-semibold text-foreground/70">{ticket.reporter.full_name}</span>
          )}
          {isAdmin && ticket.reporter && <span aria-hidden>·</span>}
          {ticket.address && <span>{ticket.address.name}</span>}
          {ticket.address && ticket.unit && <span aria-hidden>·</span>}
          {ticket.unit && <span>Logement {ticket.unit}</span>}
          <span aria-hidden>·</span>
          <span>{formatDate(ticket.created_at)}</span>
          {commentCount > 0 && (
            <span className="inline-flex items-center gap-1 font-semibold text-primary">
              <span className="relative"><MessageCircle className="h-3.5 w-3.5" />{isUnread && <><span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-green-500 ring-2 ring-card" /><span className="sr-only">Nouveaux commentaires non lus</span></>}</span>
              {commentCount}
            </span>
          )}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <PriorityBadge priority={ticket.priority} />
        <StatusBadge status={ticket.status} />
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}
