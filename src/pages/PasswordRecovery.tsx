import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { PasswordField } from "@/components/PasswordField";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export default function PasswordRecovery({ reset = false }: { reset?: boolean }) {
  const { session, loading, finishRecovery, signOut } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const retryKey = reset ? "coopfix-password-update-retry" : "coopfix-recovery-retry";
  const [cooldown, setCooldown] = useState(() => Math.max(0, Math.ceil((Number(sessionStorage.getItem(retryKey)) - Date.now()) / 1000)));
  useEffect(() => {
    const timer = window.setInterval(() => setCooldown(Math.max(0, Math.ceil((Number(sessionStorage.getItem(retryKey)) - Date.now()) / 1000))), 1000);
    return () => window.clearInterval(timer);
  }, [retryKey]);
  function pauseRequests() { sessionStorage.setItem(retryKey, String(Date.now() + 60000)); setCooldown(60); }
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [invalidLink] = useState(() => new URLSearchParams(window.location.hash.slice(1)).has("error"));

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || cooldown > 0) return;
    setError("");
    if (reset && password !== confirmation) {
      setError("Les deux mots de passe doivent être identiques.");
      return;
    }
    setBusy(true);
    try {
      if (reset) {
        if (!session || invalidLink) throw new Error("invalid-link");
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) throw updateError;
        setPassword("");
        setConfirmation("");
        await signOut();
        finishRecovery();
        navigate("/login", { replace: true });
      } else {
        const { error: sendError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/login`,
        });
        if (sendError) throw sendError;
        pauseRequests();
        setSent(true);
      }
    } catch (failure) {
      if (failure && typeof failure === 'object' && 'status' in failure && failure.status === 429) {
        pauseRequests();
        setError("La limite d’envoi ou de tentatives est atteinte. Attendez avant de réessayer; demander plusieurs liens ne débloque pas cette limite.");
        return;
      }
      setError(reset
        ? "Impossible de modifier le mot de passe. Utilisez un nouveau mot de passe d’au moins 6 caractères ou demandez un nouveau lien."
        : "Impossible d’envoyer le lien pour le moment. Attendez un instant puis réessayez.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="grid min-h-screen place-items-center bg-background px-4 py-10">
    <section className="w-full max-w-md space-y-6 rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
      <Logo />
      <h1 className="font-display text-2xl font-bold">{reset ? "Choisir un nouveau mot de passe" : "Mot de passe oublié ?"}</h1>
      {reset && loading ? <p role="status">Vérification du lien…</p> : reset && (!session || invalidLink) ? <div className="space-y-3">
        <p role="alert">Ce lien est invalide ou a expiré. Demandez un nouveau lien.</p>
        <Link className="font-semibold text-primary underline" to="/mot-de-passe-oublie">Recevoir un nouveau lien</Link>
      </div> : sent ? <p role="status">Si un compte correspond à cette adresse, un lien de réinitialisation vous sera envoyé. Consultez votre boîte courriel et vos indésirables.</p> : <form onSubmit={submit} className="space-y-4">
        {reset ? <>
          <div className="space-y-1.5"><Label htmlFor="new-password">Nouveau mot de passe</Label><PasswordField id="new-password" autoComplete="new-password" minLength={6} required value={password} onChange={e => setPassword(e.target.value)} className="h-12 rounded-xl text-base" /></div>
          <div className="space-y-1.5"><Label htmlFor="confirm-password">Confirmer le mot de passe</Label><PasswordField id="confirm-password" autoComplete="new-password" minLength={6} required value={confirmation} onChange={e => setConfirmation(e.target.value)} className="h-12 rounded-xl text-base" /></div>
        </> : <div className="space-y-1.5"><Label htmlFor="recovery-email">Courriel de votre compte</Label><Input id="recovery-email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className="h-12 rounded-xl text-base" /></div>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button disabled={busy || cooldown > 0} type="submit" className="h-12 w-full rounded-full font-bold">{busy && <Loader2 className="h-4 w-4 animate-spin" />}{reset ? "Enregistrer le mot de passe" : "Recevoir le lien par courriel"}</Button>
      </form>}
      {cooldown > 0 && <p role="status" className="text-sm text-muted-foreground">Attendez {cooldown} secondes avant une nouvelle demande. Une limite du service courriel peut durer plus longtemps.</p>}
      {reset ? <button type="button" disabled={busy} className="text-sm font-semibold text-primary underline" onClick={async () => {
        setBusy(true);
        try { await signOut(); finishRecovery(); navigate("/login", { replace: true }); }
        catch { setError("Impossible de fermer la session. Réessayez."); }
        finally { setBusy(false); }
      }}>Annuler et retourner à la connexion</button> : <Link to="/login" className="inline-block text-sm font-semibold text-primary underline underline-offset-4">Retour à la connexion</Link>}
    </section>
  </main>;
}

