import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Building2, Loader2, MapPin, Pencil, Plus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/EmptyState";
import { PageLoader } from "@/components/PageLoader";
import { supabase } from "@/integrations/supabase/client";
import type { Address } from "@/lib/types";

interface AddressWithMeta extends Address {
  residents?: { count: number }[] | null;
  tickets?: { count: number }[] | null;
}

export default function Addresses() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [name, setName] = useState("");
  const [unitCount, setUnitCount] = useState("");
  const [deleting, setDeleting] = useState<AddressWithMeta | null>(null);

  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ["addresses", "admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("addresses")
        .select("*, residents:profiles(count), tickets:tickets(count)")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as AddressWithMeta[];
    },
  });

  useEffect(() => {
    if (dialogOpen) return;
    // Réinitialise le formulaire à la fermeture.
    setEditing(null);
    setName("");
    setUnitCount("");
  }, [dialogOpen]);

  const saveAddress = useMutation({
    mutationFn: async () => {
      const payload = {
        name: name.trim(),
        unit_count: unitCount.trim() ? Number(unitCount) : null,
      };
      if (editing) {
        const { error } = await supabase
          .from("addresses")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("addresses").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      setDialogOpen(false);
      toast.success(editing ? "Adresse modifiée." : "Adresse ajoutée !");
    },
    onError: () => toast.error("Impossible d'enregistrer l'adresse."),
  });

  const deleteAddress = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("addresses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      setDeleting(null);
      toast.success("Adresse supprimée.");
    },
    onError: () => toast.error("Impossible de supprimer l'adresse."),
  });

  const openEdit = (address: Address) => {
    setEditing(address);
    setName(address.name);
    setUnitCount(address.unit_count?.toString() ?? "");
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Adresses de la coopérative</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Les immeubles gérés par la coop. Les membres les choisissent à l'inscription.
          </p>
        </div>
        <Button className="rounded-full font-bold" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Ajouter une adresse
        </Button>
      </div>

      {isLoading ? (
        <PageLoader label="Chargement des adresses…" />
      ) : addresses.length === 0 ? (
        <EmptyState
          title="Aucune adresse"
          description="Ajoutez d'abord les immeubles de votre coopérative pour que les membres puissent se localiser."
        >
          <Button className="rounded-full font-bold" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Ajouter la première adresse
          </Button>
        </EmptyState>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="flex items-center gap-4 rounded-3xl border border-border bg-card p-5 shadow-sm"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FBE8A6] text-[#7A5A0F]">
                <Building2 className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-lg font-bold">{address.name}</p>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs font-semibold text-muted-foreground">
                  {address.unit_count != null && <span>{address.unit_count} logements</span>}
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {address.residents?.[0]?.count ?? 0} membres
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {address.tickets?.[0]?.count ?? 0} billets
                  </span>
                </p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  onClick={() => openEdit(address)}
                  aria-label={`Modifier ${address.name}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setDeleting(address)}
                  aria-label={`Supprimer ${address.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editing ? "Modifier l'adresse" : "Nouvelle adresse"}
            </DialogTitle>
            <DialogDescription>
              Ex. : « Adresse de votre immeuble ». C'est ce que verront les membres à l'inscription.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveAddress.mutate();
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="address-name" className="font-bold">
                Adresse de l'immeuble
              </Label>
              <Input
                id="address-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 rounded-xl text-base"
                placeholder="Adresse de votre immeuble"
                required
                maxLength={120}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address-units" className="font-bold">
                Nombre de logements <span className="font-normal text-muted-foreground">(facultatif)</span>
              </Label>
              <Input
                id="address-units"
                type="number"
                min={1}
                max={999}
                value={unitCount}
                onChange={(e) => setUnitCount(e.target.value)}
                className="h-12 rounded-xl text-base"
                placeholder="24"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-full font-bold"
                onClick={() => setDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={saveAddress.isPending}
                className="rounded-full font-bold"
              >
                {saveAddress.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Enregistrer" : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Supprimer « {deleting?.name} » ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Les membres et les billets liés à cette adresse garderont leur historique, mais sans
              adresse associée. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full font-bold">Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-destructive font-bold hover:bg-destructive/90"
              onClick={() => deleting && deleteAddress.mutate(deleting.id)}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
