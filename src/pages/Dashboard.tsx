import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeAlert,
  CheckCircle2,
  Clock,
  MapPin,
  Plus,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/PageLoader";
import { TicketCard } from "@/components/TicketCard";
import { RoleBadge } from "@/components/badges";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/lib/auth";
import { useAddresses } from "@/lib/queries";
import { useTickets } from "@/pages/Tickets";

function StatCard({
  icon: Icon,
  label,
  value,
  cls,
}: {
  icon: typeof Clock;
  label: string;
  value: number;
  cls: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-border bg-card p-5 shadow-sm">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${cls}`}>
        <Icon className="h-6 w-6" />
      </span>
      <div>
        <p className="font-display text-3xl font-bold leading-none">{value}</p>
        <p className="mt-1 text-sm font-semibold text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { profile } = useAuth();
  const { data: tickets = [], isLoading } = useTickets();
  const { data: addresses = [] } = useAddresses();

  if (!profile) return <PageLoader />;

  const isAdmin = profile.role === "admin";
  const address = addresses.find((a) => a.id === profile.address_id);

  const counts = {
    nouveau: tickets.filter((t) => t.status === "nouveau").length,
    en_cours: tickets.filter((t) => t.status === "en_cours").length,
    termine: tickets.filter((t) => t.status === "termine").length,
    urgent: tickets.filter((t) => t.priority === "urgent" && t.status !== "termine").length,
  };
  const recent = tickets.slice(0, 4);
  const firstName = profile.full_name.split(/\s+/)[0] || "bonjour";

  return (
    <div className="space-y-6">
      {/* Salutation */}
      <div className="wine-pattern flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-primary p-6 text-primary-foreground md:p-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-primary-foreground/70">
            {isAdmin ? "Espace coordination" : "Espace membre"}
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold md:text-4xl">
            Bonjour {firstName} !
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm font-semibold text-primary-foreground/80">
            {isAdmin ? (
              <>Vous gérez les demandes de réparation de la coopérative.</>
            ) : address ? (
              <>
                <MapPin className="h-4 w-4" />
                {address.name}
                {profile.unit ? ` · Logement ${profile.unit}` : ""}
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4" />
                Adresse à préciser dans{" "}
                <Link to="/profil" className="underline underline-offset-2">
                  mon profil
                </Link>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RoleBadge role={profile.role} />
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {isAdmin ? (
          <>
            <StatCard icon={Sparkles} label="Nouveaux billets" value={counts.nouveau} cls="bg-[#FBE8A6] text-[#7A5A0F]" />
            <StatCard icon={BadgeAlert} label="Urgents actifs" value={counts.urgent} cls="bg-[#F9DEE4] text-[#C81E3D]" />
            <StatCard icon={Clock} label="En cours" value={counts.en_cours} cls="bg-[#F7E3E7] text-[#9B1B30]" />
            <StatCard icon={CheckCircle2} label="Complétés" value={counts.termine} cls="bg-[#E3F0E4] text-[#3D6B44]" />
          </>
        ) : (
          <>
            <StatCard icon={Sparkles} label="En attente" value={counts.nouveau} cls="bg-[#FBE8A6] text-[#7A5A0F]" />
            <StatCard icon={Clock} label="En cours" value={counts.en_cours} cls="bg-[#F7E3E7] text-[#9B1B30]" />
            <StatCard icon={CheckCircle2} label="Complétés" value={counts.termine} cls="bg-[#E3F0E4] text-[#3D6B44]" />
            <div className="col-span-2 flex items-center justify-center rounded-3xl border border-dashed border-border bg-card/60 p-4 lg:col-span-1">
              <Button asChild className="w-full rounded-full font-bold">
                <Link to="/billets/nouveau">
                  <Plus className="h-4 w-4" />
                  Nouveau billet
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Billets récents */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">
            {isAdmin ? "Billets récents" : "Mes derniers billets"}
          </h2>
          <Button asChild variant="outline" className="rounded-full font-bold">
            <Link to="/billets">
              Tout voir
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <PageLoader label="Chargement…" />
        ) : recent.length === 0 ? (
          <EmptyState
            title={isAdmin ? "Aucun billet reçu" : "Aucun billet pour l'instant"}
            description={
              isAdmin
                ? "Les demandes des membres apparaîtront ici. En attendant, configurez les adresses de la coop."
                : "Un robinet qui goutte, une fenêtre brisée ? Créez votre premier billet de réparation."
            }
          >
            {isAdmin ? (
              <div className="flex flex-wrap justify-center gap-2">
                <Button asChild className="rounded-full font-bold">
                  <Link to="/admin/adresses">
                    <MapPin className="h-4 w-4" />
                    Gérer les adresses
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full font-bold">
                  <Link to="/admin/parametres">
                    <Settings className="h-4 w-4" />
                    Paramètres
                  </Link>
                </Button>
              </div>
            ) : (
              <Button asChild className="rounded-full font-bold">
                <Link to="/billets/nouveau">
                  <Plus className="h-4 w-4" />
                  Créer un billet
                </Link>
              </Button>
            )}
          </EmptyState>
        ) : (
          <div className="grid gap-3">
            {recent.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        )}
      </div>

      {/* Raccourcis administrateur */}
      {isAdmin && (
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { to: "/admin/adresses", icon: MapPin, label: "Adresses de la coop", text: "Ajouter ou modifier les immeubles" },
            { to: "/admin/membres", icon: Users, label: "Membres", text: "Rôles et coordonnées" },
            { to: "/admin/parametres", icon: Settings, label: "Paramètres", text: "Nom de la coopérative" },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="group flex items-center gap-3 rounded-3xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FBE8A6] text-[#7A5A0F]">
                <item.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-1 font-display font-bold group-hover:text-primary">
                  {item.label}
                </p>
                <p className="truncate text-xs font-semibold text-muted-foreground">{item.text}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
