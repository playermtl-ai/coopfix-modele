import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/EmptyState";
import { PageLoader } from "@/components/PageLoader";
import { TicketCard } from "@/components/TicketCard";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import type { TicketStatus, TicketWithMeta } from "@/lib/types";

const TICKETS_SELECT = `
  *,
  reporter:profiles!tickets_created_by_fkey ( full_name ),
  address:addresses ( name ),
  comments:ticket_comments ( count )
`;

export function useTickets() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  return useQuery({
    queryKey: ["tickets", profile?.id, isAdmin],
    enabled: !!profile,
    queryFn: async () => {
      let query = supabase.from("tickets").select(TICKETS_SELECT);
      if (!isAdmin) query = query.eq("created_by", profile!.id);
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TicketWithMeta[];
    },
  });
}

export default function Tickets() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const { data: tickets = [], isLoading } = useTickets();
  const [filter, setFilter] = useState<"tous" | TicketStatus>("tous");

  const filtered =
    filter === "tous" ? tickets : tickets.filter((t) => t.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">
            {isAdmin ? "Billets de réparation" : "Mes billets"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAdmin
              ? "Toutes les demandes des membres de la coopérative."
              : "Vos demandes de réparation et leur progression."}
          </p>
        </div>
        <Button asChild className="rounded-full font-bold">
          <Link to="/billets/nouveau">
            <Plus className="h-4 w-4" />
            Nouveau billet
          </Link>
        </Button>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList className="h-auto w-full max-w-md rounded-full bg-muted p-1">
          <TabsTrigger
            value="tous"
            className="flex-1 rounded-full py-2 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Tous
          </TabsTrigger>
          <TabsTrigger
            value="nouveau"
            className="flex-1 rounded-full py-2 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Nouveaux
          </TabsTrigger>
          <TabsTrigger
            value="en_cours"
            className="flex-1 rounded-full py-2 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            En cours
          </TabsTrigger>
          <TabsTrigger
            value="termine"
            className="flex-1 rounded-full py-2 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Complétés
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <PageLoader label="Chargement des billets…" />
      ) : filtered.length === 0 ? (
        filter === "tous" ? (
          <EmptyState
            title={isAdmin ? "Aucun billet pour l'instant" : "Vous n'avez aucun billet"}
            description={
              isAdmin
                ? "Les demandes de réparation des membres apparaîtront ici dès leur création."
                : "Signalez un bris ou une réparation nécessaire : la coordination s'en occupe."
            }
          >
            <Button asChild className="rounded-full font-bold">
              <Link to="/billets/nouveau">
                <Plus className="h-4 w-4" />
                Créer mon premier billet
              </Link>
            </Button>
          </EmptyState>
        ) : (
          <EmptyState
            title="Rien dans cette catégorie"
            description="Aucun billet ne correspond à ce filtre pour le moment."
          />
        )
      ) : (
        <div className="grid gap-3">
          {filtered.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  );
}
