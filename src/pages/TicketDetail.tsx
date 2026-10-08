import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CategoryChip, PriorityBadge, RoleBadge, StatusBadge } from "@/components/badges";
import { EmptyState } from "@/components/EmptyState";
import { PageLoader } from "@/components/PageLoader";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatDateTime, timeAgo } from "@/lib/format";
import { PRIORITY_LABELS, STATUS_LABELS, type CommentWithAuthor, type TicketPriority, type TicketStatus, type TicketWithMeta } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SegmentedOption {
  value: string;
  label: string;
  activeCls?: string;
}

function Segmented({
  value,
  options,
  onChange,
  disabled,
}: {
  value: string | null;
  options: SegmentedOption[];
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-full bg-muted p-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-full px-2 py-2 text-xs font-bold transition-all sm:text-sm",
              active
                ? option.activeCls ?? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground/60 hover:text-foreground",
              disabled && "cursor-not-allowed opacity-60"
            )}
            aria-pressed={active}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const queryClient = useQueryClient();
  const [commentBody, setCommentBody] = useState("");
  const [requestInfo, setRequestInfo] = useState(false);

  const { data: ticket, isLoading } = useQuery({
    queryKey: ["ticket", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select(
          `
          *,
          reporter:profiles!tickets_created_by_fkey ( full_name, phone ),
          completer:profiles!tickets_completed_by_fkey ( full_name ),
          address:addresses ( name )
          `
        )
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as TicketWithMeta | null;
    },
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ["comments", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ticket_comments")
        .select("*, author:profiles!ticket_comments_author_fkey ( full_name, role )")
        .eq("ticket_id", id!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CommentWithAuthor[];
    },
  });

  const updateTicket = useMutation({
    mutationFn: async (patch: Partial<TicketWithMeta>) => {
      const { error } = await supabase.from("tickets").update(patch).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast.success("Billet mis à jour");
    },
    onError: () => toast.error("Impossible de mettre à jour le billet."),
  });

  const addComment = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("ticket_comments").insert({
        ticket_id: id!,
        author_id: profile!.id,
        body: commentBody.trim(),
        is_info_request: isAdmin && requestInfo,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setCommentBody("");
      setRequestInfo(false);
      queryClient.invalidateQueries({ queryKey: ["comments", id] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
    onError: () => toast.error("Impossible d'ajouter le commentaire."),
  });

  if (isLoading || !profile) return <PageLoader label="Chargement du billet…" />;

  if (!ticket) {
    return (
      <EmptyState
        title="Billet introuvable"
        description="Ce billet n'existe plus ou vous n'avez pas les droits pour le consulter."
      >
        <Button asChild className="rounded-full font-bold">
          <Link to="/billets">Retour aux billets</Link>
        </Button>
      </EmptyState>
    );
  }

  const setStatus = (status: TicketStatus) => {
    const patch: Partial<TicketWithMeta> = { status };
    if (status === "termine") {
      patch.completed_at = new Date().toISOString();
      patch.completed_by = profile.id;
    } else {
      patch.completed_at = null;
      patch.completed_by = null;
    }
    updateTicket.mutate(patch);
  };

  const setPriority = (priority: TicketPriority) => updateTicket.mutate({ priority });

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentBody.trim()) return;
    addComment.mutate();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Button asChild variant="ghost" className="-ml-2 rounded-full font-bold text-muted-foreground">
          <Link to="/billets">
            <ArrowLeft className="h-4 w-4" />
            Retour aux billets
          </Link>
        </Button>
      </div>

      {ticket.status === "termine" && (
        <div className="flex items-center gap-3 rounded-3xl border border-[#CDE3CF] bg-[#E3F0E4] px-5 py-4">
          <CheckCircle2 className="h-6 w-6 shrink-0 text-[#3D6B44]" />
          <p className="text-sm font-bold text-[#3D6B44]">
            Ce billet a été complété{ticket.completed_at ? ` le ${formatDate(ticket.completed_at)}` : ""}
            {ticket.completer?.full_name ? ` par ${ticket.completer.full_name}` : ""}. Merci de votre
            patience !
          </p>
        </div>
      )}

      {/* Détails du billet */}
      <div className="space-y-5 rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold leading-snug md:text-3xl">
              {ticket.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <CategoryChip category={ticket.category} />
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
          </div>
        </div>

        <p className="whitespace-pre-line rounded-2xl bg-muted px-5 py-4 text-base leading-relaxed">
          {ticket.description}
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3">
            <User className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0 text-sm">
              <p className="font-bold">Demandé par</p>
              <p className="truncate text-muted-foreground">
                {ticket.reporter?.full_name ?? "Un membre"}
                {isAdmin && ticket.reporter?.phone ? ` · ${ticket.reporter.phone}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3">
            <MapPin className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0 text-sm">
              <p className="font-bold">Adresse</p>
              <p className="truncate text-muted-foreground">
                {ticket.address?.name ?? "Adresse non précisée"}
                {ticket.unit ? ` · Logement ${ticket.unit}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3">
            <CalendarDays className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0 text-sm">
              <p className="font-bold">Créé le</p>
              <p className="text-muted-foreground">{formatDateTime(ticket.created_at)}</p>
            </div>
          </div>
          {isAdmin && ticket.reporter?.phone && (
            <div className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3">
              <Phone className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0 text-sm">
                <p className="font-bold">Téléphone</p>
                <p className="text-muted-foreground">{ticket.reporter.phone}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Panneau administrateur */}
      {isAdmin && (
        <div className="space-y-5 rounded-3xl border-2 border-primary/20 bg-[#FDF6EC] p-6 md:p-8">
          <h2 className="font-display text-lg font-bold text-primary">Traitement par la coordination</h2>
          <div className="space-y-2">
            <p className="text-sm font-bold">Statut du billet</p>
            <Segmented
              value={ticket.status}
              onChange={(v) => setStatus(v as TicketStatus)}
              disabled={updateTicket.isPending}
              options={[
                { value: "nouveau", label: STATUS_LABELS.nouveau },
                { value: "en_cours", label: STATUS_LABELS.en_cours },
                {
                  value: "termine",
                  label: STATUS_LABELS.termine,
                  activeCls: "bg-[#3D6B44] text-white shadow-sm",
                },
              ]}
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-bold">Priorité</p>
            <Segmented
              value={ticket.priority}
              onChange={(v) => setPriority(v as TicketPriority)}
              disabled={updateTicket.isPending}
              options={[
                {
                  value: "normal",
                  label: PRIORITY_LABELS.normal,
                  activeCls: "bg-[#4C7A53] text-white shadow-sm",
                },
                {
                  value: "prioritaire",
                  label: PRIORITY_LABELS.prioritaire,
                  activeCls: "bg-[#C8901D] text-white shadow-sm",
                },
                {
                  value: "urgent",
                  label: PRIORITY_LABELS.urgent,
                  activeCls: "bg-[#C81E3D] text-white shadow-sm",
                },
              ]}
            />
            <p className="text-xs font-semibold text-muted-foreground">
              La priorité est visible par le membre : urgent passe avant tout, prioritaire
              aussitôt que possible, normal selon le plan de travail.
            </p>
          </div>
        </div>
      )}

      {/* Suivi / commentaires */}
      <div className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <MessageCircle className="h-5 w-5 text-primary" />
          Suivi et échanges
        </h2>

        {commentsLoading ? (
          <p className="text-sm text-muted-foreground">Chargement des commentaires…</p>
        ) : comments.length === 0 ? (
          <p className="rounded-2xl bg-muted px-4 py-3 text-sm font-semibold text-muted-foreground">
            Aucun commentaire pour l'instant. Posez une question ou ajoutez un détail utile !
          </p>
        ) : (
          <ul className="space-y-3">
            {comments.map((comment) => (
              <li key={comment.id} className="flex gap-3">
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-xs font-bold",
                    comment.author?.role === "admin"
                      ? "bg-primary text-primary-foreground"
                      : "bg-[#FBE8A6] text-[#7A5A0F]"
                  )}
                >
                  {initials(comment.author?.full_name ?? "?")}
                </span>
                <div className="min-w-0 flex-1 rounded-2xl bg-muted px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold">{comment.author?.full_name ?? "Membre"}</p>
                    {comment.author && <RoleBadge role={comment.author.role} />}
                    <span className="text-xs text-muted-foreground">{timeAgo(comment.created_at)}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{comment.body}</p>
                  {comment.is_info_request && <p className="mt-2 text-xs font-bold text-primary">Précisions demandées au membre</p>}
                </div>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleComment} className="space-y-2.5">
          {isAdmin && <div className="flex items-center gap-2 rounded-xl bg-muted p-3">
            <Checkbox id="request-info" checked={requestInfo} onCheckedChange={value => setRequestInfo(value === true)} />
            <Label htmlFor="request-info" className="text-sm font-bold">Demander des précisions au membre (alerte par courriel)</Label>
          </div>}
          <Textarea
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            className="min-h-20 rounded-xl text-base"
            placeholder="Écrire un commentaire…"
            maxLength={1000}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!commentBody.trim() || addComment.isPending}
              className="rounded-full font-bold"
            >
              {addComment.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Publier
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
