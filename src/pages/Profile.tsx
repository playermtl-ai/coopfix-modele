import { UnitSelect } from "@/components/UnitSelect";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Mail, MapPin, Phone, Save, User } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const { data: addresses = [] } = useAddresses();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressId, setAddressId] = useState("");
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
      .eq("id", profile.id);
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

        {addresses.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1.6fr_1fr]">
            <div className="space-y-1.5">
              <Label className="font-bold">Mon adresse</Label>
              <Select value={addressId} onValueChange={value => { setAddressId(value); setUnit(""); }} disabled={profile.role !== "admin"}>
                <SelectTrigger className="h-12 w-full rounded-xl text-base">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Choisir mon adresse" />
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

        <Button type="submit" disabled={saving} className="h-12 w-full rounded-full text-base font-bold">
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          Enregistrer mon profil
        </Button>
      </form>
    </div>
  );
}
