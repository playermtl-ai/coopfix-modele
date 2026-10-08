import { Logo } from "@/components/Logo";
import { HowItWorks } from "@/components/HowItWorks";

export default function Setup() {
  return <div className="grid min-h-screen place-items-center bg-background p-6">
    <main className="w-full max-w-xl space-y-5 rounded-3xl border border-border bg-card p-8 shadow-sm">
      <Logo size={46} />
      <h1 className="font-display text-3xl font-bold">Nom de votre coop à inscrire</h1>
      <p className="text-muted-foreground">Votre modèle CoopFix est prêt à être configuré. La personne chargée de l'installation doit d'abord connecter la base de données de votre coop.</p>
      <p className="text-sm text-muted-foreground">Suivez le fichier GUIDE-INSTALLATION.md fourni avec l'application, puis relancez ou redéployez le projet.</p>
      <HowItWorks />
    </main>
  </div>;
}
