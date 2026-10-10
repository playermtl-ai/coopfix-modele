import { CircleHelp, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const steps = [
  ["Ouvrir le site de votre coop", "Une fois le site installé, ouvrez le lien du site de votre coop. Ouvrez ce lien sur votre ordinateur ou votre téléphone. Vous n'avez rien à télécharger."],
  ["Inscrire le nom et le courriel", "Administrateur : connectez-vous, puis cliquez sur Paramètres. Inscrivez le nom de votre coop et le courriel qui doit recevoir les nouveaux billets. Cliquez sur Enregistrer. La personne responsable de l'installation renseigne l'adresse publique du site."],
  ["Ajouter les adresses", "Administrateur : cliquez sur Adresses, puis Ajouter une adresse. Inscrivez chaque immeuble de votre coop et enregistrez. Vous pouvez aussi préciser le nombre de logements."],
  ["Laisser les membres s'inscrire", "Partagez le lien du site de votre coop. Chaque membre clique sur Devenir membre, entre ses coordonnées et choisit son adresse et son logement. Il confirme son courriel si demandé. L'administrateur n'a pas à créer les comptes."],
  ["Créer un premier billet", "Membre : cliquez sur Nouveau billet. Donnez un titre au problème, choisissez une catégorie, décrivez la réparation et envoyez. Vous retrouvez votre demande dans Mes billets."],
  ["Suivre les réponses et les alertes", "Administrateur : ouvrez le billet. Pour poser une question, cochez Demander des précisions au membre, écrivez votre question et cliquez sur Publier. Une fois la réparation faite, cliquez sur Complété. Le membre reçoit une alerte par courriel dans ces deux cas, lorsque le service de courriel est activé. Il répond dans les commentaires du billet."],
];

// Set this only after verifying that the template is accessible to new coops.
const templateRepository = import.meta.env.VITE_COOPFIX_TEMPLATE_REPOSITORY?.trim() || 'https://github.com/playermtl-ai/coopfix-modele';
const deployUrl = templateRepository
  ? `https://vercel.com/new/clone?${new URLSearchParams({ "repository-url": templateRepository, "project-name": "coopfix-ma-coop", "repository-name": "coopfix-ma-coop" })}`
  : null;

export function HowItWorks() {
  return <Dialog>
    <DialogTrigger asChild><Button type="button" variant="outline" className="rounded-full font-bold"><CircleHelp className="h-4 w-4" />Comment ça marche</Button></DialogTrigger>
    <DialogContent className="max-h-[85dvh] overflow-y-auto rounded-3xl sm:max-w-2xl">
      <DialogHeader><DialogTitle className="font-display text-2xl">Comment ça marche</DialogTitle><DialogDescription>Votre coop a son propre site. Après l'installation, voici les étapes pour l'utiliser.</DialogDescription></DialogHeader>
      <section className="space-y-3 rounded-2xl bg-muted p-4" aria-labelledby="install-coop-title">
        <h2 id="install-coop-title" className="font-bold">Installer CoopFix pour ma coop</h2>
        <p className="text-sm text-muted-foreground">Chaque coop crée son propre site et conserve ses données dans sa propre base.</p>
        <ol className="list-decimal space-y-2 pl-5 text-sm">
          <li>Choisissez votre hébergement : Vercel, ou l'hébergement de votre coop s'il permet d'installer CoopFix.</li>
          <li>Installez le modèle CoopFix. Dans Vercel, reliez votre base avec l’intégration Supabase, puis relancez la publication de production : les tables s’installent automatiquement.</li>
          <li>Choisissez votre adresse : celle fournie par l'hébergeur, ou votre propre domaine, par exemple reparations.macoop.ca. Sur Vercel, vous pouvez aussi utiliser l'adresse fournie en .vercel.app.</li>
          <li>Copiez cette adresse, sans /login, dans Paramètres → Adresse publique de l'application. Configurez ensuite le nom de votre coop et ses immeubles.</li>
        </ol>
        <details className="rounded-xl border border-border p-3 text-sm">
          <summary className="cursor-pointer font-bold">J'ai déjà un domaine ou un hébergement</summary>
          <p className="mt-2 text-muted-foreground">Vous pouvez conserver votre domaine et votre site actuel. Une adresse comme reparations.macoop.ca permet d'ouvrir CoopFix séparément. La personne responsable relie cette adresse à l'hébergement choisi, puis l'inscrit dans les paramètres de CoopFix.</p>
          <p className="mt-2 text-muted-foreground">Un domaine est une adresse : il faut aussi un hébergement pour le site. Si votre hébergement actuel convient, vous n'avez pas besoin de Vercel. La base de données et les courriels doivent aussi être configurés pour votre coop.</p>
        </details>
        <Button asChild variant="outline" className="h-auto whitespace-normal rounded-full font-bold">
          <a href="https://vercel.com/signup" target="_blank" rel="noopener noreferrer">Créer mon compte Vercel<ExternalLink className="h-4 w-4 shrink-0" /></a>
        </Button>
        {deployUrl ? <Button asChild className="h-auto whitespace-normal rounded-full font-bold">
          <a href={deployUrl} target="_blank" rel="noopener noreferrer">Installer CoopFix pour ma coop<ExternalLink className="h-4 w-4 shrink-0" /></a>
        </Button> : <p className="text-sm text-muted-foreground">L'installation automatique sera disponible lorsque le modèle sera publié. Pour le moment, la personne responsable suit le guide d'installation fourni avec CoopFix.</p>}
        <p className="text-xs text-muted-foreground">Le compte Vercel ne configure pas à lui seul la base ni les courriels. Vérifiez les offres et les frais des services avant de choisir votre formule.</p>
      </section>
      <Accordion type="single" collapsible defaultValue="step-0">
        {steps.map(([title, text], i) => <AccordionItem key={title} value={`step-${i}`}>
          <AccordionTrigger className="text-left font-bold">{i + 1}. {title}</AccordionTrigger>
          <AccordionContent className="space-y-3 leading-relaxed text-muted-foreground">
            <p>{text}</p>
            {i === 1 && <details className="rounded-xl bg-muted p-3">
              <summary className="cursor-pointer font-bold text-foreground">Voir un exemple en image</summary>
              <img src="/guide/parametres-exemple.png" alt="Exemple de la page Paramètres : nom de la coop, courriel de réception et bouton Enregistrer." className="mx-auto mt-3 h-auto w-full max-w-xs rounded-xl border border-border" loading="lazy" />
              <p className="mt-2 text-xs">Capture d'exemple avec des informations fictives. Inscrivez les informations de votre coop.</p>
            </details>}
          </AccordionContent>
        </AccordionItem>)}
      </Accordion>
      <p className="text-xs text-muted-foreground">Votre coop désigne la personne responsable de l'installation technique. L'administrateur gère les réglages de sa coop; les membres s'inscrivent et créent leurs billets.</p>
    </DialogContent>
  </Dialog>;
}
