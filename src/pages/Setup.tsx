import { Logo } from "@/components/Logo";
import { HowItWorks } from "@/components/HowItWorks";

export default function Setup() {
  return <div className="grid min-h-screen place-items-center bg-background p-6">
    <main className="w-full max-w-xl space-y-5 rounded-3xl border border-border bg-card p-8 shadow-sm">
      <Logo size={46} />
      <h1 className="font-display text-3xl font-bold">Connecter votre coop</h1>
      <p className="text-muted-foreground">Il reste à relier votre base Supabase à ce site dans Vercel.</p>
      <ol className="list-decimal space-y-3 pl-5 text-sm text-muted-foreground">
        <li>Dans votre projet Vercel, ouvrez Storage et connectez votre base avec l’intégration Supabase.</li>
        <li>Relancez la publication de production dans Deployments → Redeploy.</li>
        <li>Les tables s’installent automatiquement pendant la publication. Revenez ici pour créer vos accès.</li>
      </ol>
      <p className="text-sm text-muted-foreground">Le premier compte créé devient l’administrateur de votre coop.</p>
      <HowItWorks />
    </main>
  </div>;
}
