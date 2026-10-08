import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Info, Loader2, Mail, MapPin, Pencil, Phone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RoleBadge } from "@/components/badges";
import { PageLoader } from "@/components/PageLoader";
import { useAuth } from "@/lib/auth";
import { useAddresses } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/format";
import type { Profile, Role } from "@/lib/types";

interface ProfileWithMeta extends Profile {
  address?: { name: string } | null;
  tickets?: { count: number }[] | null;
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

export default function Members() {
  const { profile: me, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const { data: addresses = [] } = useAddresses();

  const [editing, setEditing] = useState<ProfileWithMeta | null>(null);
  const [form, setForm] = useState({ full_name: "", phone: "", role: "client" as Role, address_id: "", unit: "" });

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["members"],
    enabled: !!me?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*, address:addresses(name), tickets:tickets!tickets_created_by_fkey(count)")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ProfileWithMeta[];
    },
  });

  useEffect(() => {
    if (!editing) return;
    setForm({
      full_name: editing.full_name ?? "",
      phone: editing.phone ?? "",
      role: editing.role,
      address_id: editing.address_id ?? "",
      unit: editing.unit ?? "",
    });
  }, [editing]);

  const updateMember = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name.trim(),
          phone: form.phone.trim() || null,
          role: form.role,
          address_id: form.address_id || null,
          unit: form.unit.trim() || null,
        })
        .eq("id", editing!.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      if (editing?.id === me?.id) await refreshProfile();
      setEditing(null);
      toast.success("Membre mis à jour.");
    },
    onError: () => toast.error("Impossible de mettre à jour le membre."),
  });

  const changeRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: Role }) => {
      const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, variables) => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      if (variables.id === me?.id) refreshProfile();
      toast.success(variables.role === "admin" ? "Administrateur nommé." : "Rôle remis à membre.");
    },
    onError: () => toast.error("Impossible de changer le rôle."),
  });

  if (isLoading) return <PageLoader label="Chargement des membres…" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Membres de la coopérative</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gérez les rôles et les coordonnées des membres inscrits.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-3xl border border-[#F1D98B] bg-[#FBE8A6]/50 px-5 py-4 text-sm font-semibold text-[#7A5A0F]">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        Astuce : nommez administrateurs les membres du conseil d'administration ou de la
        coordination des entretiens.
      </div>

      <div className="grid gap-3">
        {members.map((member) => {
          const isSelf = member.id === me?.id;
          return (
            <div
              key={member.id}
              className="flex flex-wrap items-center gap-4 rounded-3xl border border-border bg-card p-5 shadow-sm"
            >
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-display font-bold ${
                  member.role === "admin"
                    ? "bg-primary text-primary-foreground"
                    : "bg-[#FBE8A6] text-[#7A5A0F]"
                }`}
              >
                {initials(member.full_name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-display text-base font-bold">
                  {member.full_name || "Sans nom"}
                  {isSelf && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">
                      Vous
                    </span>
                  )}
                </p>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs font-semibold text-muted-foreground">
                  <span className="inline-flex min-w-0 items-center gap-1">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{member.email ?? "—"}</span>
                  </span>
                  {member.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {member.phone}
                    </span>
                  )}
                  <span className="inline-flex min-w-0 items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {member.address?.name ?? "Sans adresse"}
                      {member.unit ? ` · ${member.unit}` : ""}
                    </span>
                  </span>
                  <span>Membre depuis {formatDate(member.created_at)}</span>
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Select
                  value={member.role}
                  onValueChange={(v) => changeRole.mutate({ id: member.id, role: v as Role })}
                  disabled={isSelf || changeRole.isPending}
                >
                  <SelectTrigger
                    className="h-10 w-[170px] rounded-full text-sm font-bold disabled:opacity-70"
                    aria-label={`Rôle de ${member.full_name}`}
                  >
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="client" className="rounded-lg">
                      Membre
                    </SelectItem>
                    <SelectItem value="admin" className="rounded-lg">
                      Administrateur
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  onClick={() => setEditing(member)}
                  aria-label={`Modifier ${member.full_name}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
        {members.length === 0 && (
          <p className="rounded-3xl border border-dashed border-border px-6 py-10 text-center text-sm font-semibold text-muted-foreground">
            Aucun membre inscrit pour l'instant.
          </p>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Modifier le membre</DialogTitle>
            <DialogDescription>{editing?.email}</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateMember.mutate();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="member-name" className="font-bold">
                  Nom complet
                </Label>
                <Input
                  id="member-name"
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  className="h-12 rounded-xl text-base"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="member-phone" className="font-bold">
                  Téléphone
                </Label>
                <Input
                  id="member-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="h-12 rounded-xl text-base"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-bold">Rôle</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm((f) => ({ ...f, role: v as Role }))}
                disabled={editing?.id === me?.id}
              >
                <SelectTrigger className="h-12 w-full rounded-xl text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="client" className="rounded-lg">
                    Membre
                  </SelectItem>
                  <SelectItem value="admin" className="rounded-lg">
                    Administrateur
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1.6fr_1fr]">
              <div className="space-y-1.5">
                <Label className="font-bold">Adresse</Label>
                <Select
                  value={form.address_id}
                  onValueChange={(v) => setForm((f) => ({ ...f, address_id: v }))}
                >
                  <SelectTrigger className="h-12 w-full rounded-xl text-base">
                    <SelectValue placeholder="Aucune" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {addresses.map((a) => (
                      <SelectItem key={a.id} value={a.id} className="rounded-lg">
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="member-unit" className="font-bold">
                  Logement
                </Label>
                <Input
                  id="member-unit"
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  className="h-12 rounded-xl text-base"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-full font-bold"
                onClick={() => setEditing(null)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={updateMember.isPending}
                className="rounded-full font-bold"
              >
                {updateMember.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
