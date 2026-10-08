import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { HeartHandshake, Loader2, Save, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { HowItWorks } from "@/components/HowItWorks";
import { useAddresses } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";

interface CoopSettings {
  coop_name: string;
  notification_email: string;
  notifications_enabled: boolean;
  app_url: string;
}
const empty: CoopSettings = { coop_name: "", notification_email: "", notifications_enabled: false, app_url: "" };

export default function Settings() {
  const queryClient = useQueryClient();
  const { data: addresses = [] } = useAddresses();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["settings", "admin"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_coop_settings");
      if (error) throw error;
      return { ...empty, ...data } as CoopSettings;
    },
  });
  const [form, setForm] = useState<CoopSettings>(empty);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (data) setForm(data); }, [data]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.coop_name.trim();
    const email = form.notification_email.trim();
    const url = form.app_url.trim().replace(/\/+$/, "");
    if (!name) return toast.error("Inscrivez le nom de votre coopérative.");
    if (form.notifications_enabled && (!email || !url)) return toast.error("Inscrivez le courriel et l'adresse publique du site pour activer les notifications.");
    if (url) {
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.pathname !== "/" || parsed.search || parsed.hash) throw new Error();
      } catch { return toast.error("Utilisez l'adresse du site sous la forme https://votre-coop.ca, sans chemin ni paramètres."); }
    }
    setSaving(true);
    try {
      const { error } = await supabase.rpc("save_coop_settings", {
        p_name: name, p_email: email, p_enabled: form.notifications_enabled, p_url: url,
      });
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Paramètres enregistrés !");
    } catch { toast.error("Impossible d'enregistrer les paramètres. Vérifiez votre connexion et l'installation de la base de données."); }
    finally { setSaving(false); }
  };

  return <div className="mx-auto max-w-2xl space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="font-display text-3xl font-bold">Paramètres</h1><p className="mt-1 text-sm text-muted-foreground">Personnalisez l'application pour votre coopérative.</p></div>
      <HowItWorks />
    </div>
    {isError && <div role="alert" className="space-y-3 rounded-3xl border border-destructive/30 bg-destructive/10 p-5 text-sm">
      <p>Impossible de charger les paramètres. Vérifiez votre connexion. Si c'est la première installation, appliquez le fichier 002_configuration.sql fourni dans le projet.</p>
      <Button variant="outline" onClick={() => refetch()} className="rounded-full">Réessayer</Button>
    </div>}
    <form onSubmit={handleSave} className="space-y-5 rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
      <fieldset disabled={isLoading || isError || saving} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="coop-name" className="font-bold">Nom de la coopérative</Label>
          <Input id="coop-name" value={form.coop_name} onChange={e => setForm({ ...form, coop_name: e.target.value })} className="h-12 rounded-xl text-base" placeholder="Nom de votre coop à inscrire" required maxLength={80} />
          <p className="text-xs font-semibold text-muted-foreground">Ce nom apparaît dans l'en-tête et sur la page de connexion.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notification-email" className="font-bold">Courriel de réception des billets</Label>
          <Input id="notification-email" type="email" value={form.notification_email} onChange={e => setForm({ ...form, notification_email: e.target.value })} className="h-12 rounded-xl text-base" placeholder="coordination@votre-coop.ca" maxLength={254} required={form.notifications_enabled} />
          <p className="text-xs font-semibold text-muted-foreground">La coordination reçoit un courriel pour chaque nouveau billet lorsque le service d'envoi est installé et activé.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="app-url" className="font-bold">Adresse publique de l'application</Label>
          <Input id="app-url" type="url" value={form.app_url} onChange={e => setForm({ ...form, app_url: e.target.value })} className="h-12 rounded-xl text-base" placeholder="https://votre-coop.ca" maxLength={500} required={form.notifications_enabled} />
          <p className="text-xs font-semibold text-muted-foreground">Le lien vers le billet dans les courriels utilisera cette adresse. Elle est aussi nécessaire aux alertes des membres.</p>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-2xl bg-muted p-4">
          <Label htmlFor="notifications-enabled" className="font-bold">Recevoir les nouveaux billets par courriel</Label>
          <Switch id="notifications-enabled" checked={form.notifications_enabled} onCheckedChange={checked => setForm({ ...form, notifications_enabled: checked })} />
        </div>
        <p className="text-xs font-semibold text-muted-foreground">Avant d'activer : suivez l'étape courriels du guide d'installation. Après l'enregistrement, créez un billet de test et vérifiez sa réception. L'activation ne confirme pas la livraison des courriels. Les membres reçoivent leurs propres alertes lors d'une demande de précisions ou d'une clôture, même si la réception par la coordination est désactivée.</p>
        <Button type="submit" className="h-12 rounded-full text-base font-bold">{saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}Enregistrer</Button>
      </fieldset>
    </form>
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div><p className="font-display text-lg font-bold">Adresses de votre coop</p><p className="text-sm text-muted-foreground">{addresses.length} adresse(s) configurée(s)</p></div>
      <Button asChild variant="outline" className="rounded-full font-bold"><Link to="/admin/adresses"><MapPin className="h-4 w-4" />Gérer les adresses</Link></Button>
    </div>
    <div className="space-y-3 rounded-3xl border border-[#F1D98B] bg-[#FBE8A6]/50 p-6 md:p-8">
      <p className="flex items-center gap-2 font-display text-lg font-bold text-[#7A5A0F]"><HeartHandshake className="h-5 w-5" />À propos de CoopFix</p>
      <p className="text-sm font-semibold leading-relaxed text-[#7A5A0F]">CoopFix est un modèle configurable pour votre coopérative d'habitation. Les membres créent des billets de réparation et la coordination les priorise et assure le suivi. Chaque coop utilise sa propre installation et ses propres données.</p>
    </div>
  </div>;
}
