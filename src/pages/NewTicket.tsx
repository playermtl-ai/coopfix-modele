import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Check, Loader2, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORY_META } from "@/components/badges";
import { useAuth } from "@/lib/auth";
import { useAddresses } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { PRIORITY_LABELS, type TicketCategory, type TicketPriority } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function NewTicket() {
  const { profile } = useAuth();
  const { data: addresses = [] } = useAddresses();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TicketCategory>("plomberie");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("normal");
  const [submitting, setSubmitting] = useState(false);

  const address = addresses.find((a) => a.id === profile?.address_id);
  const hasAddress = !!profile?.address_id || profile?.role === "admin";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSubmitting(true);
    const { data, error } = await supabase
      .from("tickets")
      .insert({
        created_by: profile.id,
        address_id: profile.address_id,
        unit: profile.unit,
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
      })
      .select("id")
      .single();
    setSubmitting(false);
    if (error) {
      toast.error("Impossible de créer le billet. Réessayez.");
      return;
    }
    toast.success("Billet enregistré ! Il est accessible à la coordination.");
    queryClient.invalidateQueries({ queryKey: ["tickets"] });
    navigate(`/billets/${data.id}`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Button asChild variant="ghost" className="-ml-2 rounded-full font-bold text-muted-foreground">
          <Link to="/billets">
            <ArrowLeft className="h-4 w-4" />
            Retour aux billets
          </Link>
        </Button>
        <h1 className="mt-2 font-display text-3xl font-bold">Nouveau billet de réparation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Décrivez le problème : plus c'est précis, plus c'est rapide à régler.
        </p>
      </div>

      {!hasAddress && (
        <div className="flex items-start gap-2 rounded-3xl border border-[#F1D98B] bg-[#FBE8A6]/60 px-5 py-4 text-sm font-semibold text-[#7A5A0F]">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Votre adresse n'est pas encore définie. Demandez à un administrateur
            de compléter votre adresse pour que la coordination sache où intervenir.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
        <div className="space-y-1.5">
          <Label htmlFor="ticket-title" className="font-bold">
            Titre du billet
          </Label>
          <Input
            id="ticket-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-12 rounded-xl text-base"
            placeholder="Ex. : robinet de la cuisine qui goutte"
            required
            maxLength={120}
          />
        </div>

        <div className="space-y-2">
          <Label className="font-bold">Catégorie</Label>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {CATEGORY_META.map((meta) => {
              const selected = category === meta.value;
              const Icon = meta.icon;
              return (
                <button
                  key={meta.value}
                  type="button"
                  onClick={() => setCategory(meta.value)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-2xl border-2 px-3.5 py-3 text-left text-sm font-bold transition-all",
                    selected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-background hover:border-primary/40"
                  )}
                  aria-pressed={selected}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                      meta.cls
                    )}
                  >
                    <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                  </span>
                  <span className="flex-1">{meta.label}</span>
                  {selected && <Check className="h-4 w-4 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>

        <fieldset className="space-y-2">
          <legend className="font-bold">Priorité</legend>
          <div className="grid grid-cols-3 gap-2.5">
            {(["normal", "prioritaire", "urgent"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={priority === value}
                onClick={() => setPriority(value)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-2xl border-2 px-2 py-3 text-sm font-bold transition-all",
                  priority === value ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-background hover:border-primary/40"
                )}
              >
                {PRIORITY_LABELS[value]}
                {priority === value && <Check className="h-4 w-4 shrink-0 text-primary" />}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="space-y-1.5">
          <Label htmlFor="ticket-description" className="font-bold">
            Description du problème
          </Label>
          <Textarea
            id="ticket-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-32 rounded-xl text-base"
            placeholder="Où est le problème ? Depuis quand ? Y a-t-il eu des dégâts d'eau, une perte de chauffage… ?"
            required
            maxLength={2000}
          />
        </div>

        {address && (
          <p className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3 text-sm font-semibold text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            Billet créé pour : {address.name}
            {profile?.unit ? ` · Logement ${profile.unit}` : ""}
          </p>
        )}

        <Button
          type="submit"
          disabled={submitting}
          className="h-12 w-full rounded-full text-base font-bold"
        >
          {submitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
          Envoyer à la coordination
        </Button>
      </form>
    </div>
  );
}
