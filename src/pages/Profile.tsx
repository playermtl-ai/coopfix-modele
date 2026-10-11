import { UnitSelect } from "@/components/UnitSelect";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Mail, MapPin, Phone, Save, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RoleBadge } from "@/components/badges";
import { PageLoader } from "@/components/PageLoader";
import { useAuth } from "@/lib/auth";
import { useAddresses } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";

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

export default function Profile() {
  const { profile, refreshProfile } = useAuth();
  const { data: addresses = [], isPending: addressesLoading, isError: addressesError } = useAddresses();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressId, setAddressId] = useState(profile?.address_id ?? "");
  const [unit, setUnit] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setPhone(profile.phone ?? "");
    setAddressId(profile.address_id ?? "");
    setUnit(profile.unit ?? "");
  }, [profile]);

  if (!profile) return <PageLoader label="Chargement du profil…" />;
  const memberAddress = addresses.find(address => address.id === profile.address_id);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        ...(profile.role === "admin" ? { address_id: addressId || null, unit: unit.trim() || null } : {}),
      })
      .eq("id", profile.id)
      .select("id,address_id,unit")
      .single();
    setSaving(false);
    if (error) {
      toast.error("Impossible d'enregistrer le profil.");
      return;
    }
    await refreshProfile();
    toast.success("Profil enregistré !");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Mon profil</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vos coordonnées aident la coordination à planifier les interventions.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary font-display text-xl font-bold text-primary-foreground">
          {initials(profile.full_name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg font-bold">{profile.full_name || "Membre"}</p>
          <p className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
            <Mail className="h-3.5 w-3.5" />
            {profile.email ?? "—"}
          </p>
        </div>
        <RoleBadge role={profile.role} />
      </div>

      <form
        onSubmit={handleSave}
        className="space-y-5 rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="profile-name" className="font-bold">
              Nom complet
            </Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="profile-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-12 rounded-xl pl-11 text-base"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-phone" className="font-bold">
              Téléphone
            </Label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="profile-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-12 rounded-xl pl-11 text-base"
                placeholder="418 555-1234"
              />
            </div>
          </div>
        </div>

        {profile.role !== "admin" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1.6fr_1fr]">
            <div className="space-y-1.5">
              <p id="profile-address-label" className="text-sm font-bold">Mon adresse</p>
              <p aria-labelledby="profile-address-label" className="flex min-h-12 items-center gap-3 rounded-xl border border-input bg-background px-4 py-3 text-base">
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>{addressesLoading ? "Chargement de l’adresse…" : addressesError ? "Impossible de charger l’adresse. Réessayez en actualisant la page." : memberAddress?.name ?? "Aucune adresse associée à votre profil"}</span>
              </p>
            </div>
            <div className="space-y-1.5">
              <p id="profile-unit-label" className="text-sm font-bold">Logement</p>
              <p aria-labelledby="profile-unit-label" className="flex min-h-12 items-center rounded-xl border border-input bg-background px-4 py-3 text-base">{profile.unit || "Sans numéro de logement"}</p>
            </div>
          </div>
        ) : addressesLoading ? (
          <p role="status" className="text-sm text-muted-foreground">Chargement des adresses…</p>
        ) : addressesError ? (
          <p role="alert" className="text-sm text-destructive">Impossible de charger les adresses. Actualisez la page avant de modifier votre profil.</p>
        ) : addresses.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1.6fr_1fr]">
            <div className="space-y-1.5">
              <Label htmlFor="profile-admin-address" className="font-bold">Mon adresse</Label>
              <select id="profile-admin-address" value={addressId} onChange={event => { setAddressId(event.target.value); setUnit(""); }} className="h-12 w-full rounded-xl border border-input bg-background px-3 text-base">
                <option value="">Sans adresse de logement</option>
                {addresses.map(address => <option key={address.id} value={address.id}>{address.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-unit" className="font-bold">
                Logement
              </Label>
              <UnitSelect id="profile-unit" address={addresses.find(a => a.id === addressId)} value={unit} onChange={setUnit} disabled={profile.role !== "admin"} />
            </div>
          </div>
        ) : (
          <p className="rounded-2xl bg-muted px-4 py-3 text-sm font-semibold text-muted-foreground">
            Aucune adresse n'a encore été ajoutée par la coordination.
          </p>
        )}

        {profile.role !== "admin" && (
          <p className="rounded-2xl bg-muted px-4 py-3 text-xs font-semibold text-muted-foreground">
            Vous déménagez ? Demandez à un administrateur de modifier votre adresse et votre logement.
          </p>
        )}

        {profile.role === "admin" && (
          <p className="rounded-2xl bg-[#FBE8A6]/60 px-4 py-3 text-xs font-semibold text-[#7A5A0F]">
            En tant qu'administrateur, l'adresse de logement est facultative pour vous.
          </p>
        )}

        <Button type="submit" disabled={saving || (profile.role === "admin" && (addressesLoading || addressesError))} className="h-12 w-full rounded-full text-base font-bold">
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          Enregistrer mon profil
        </Button>
      </form>
    </div>
  );
}
