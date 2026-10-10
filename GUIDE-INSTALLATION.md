# CoopFix — Installation technique

Ce document technique est destiné à la personne responsable de l'installation, désignée par chaque coop. Pour la configuration quotidienne, remettre **GUIDE-COOP.md** à l’administrateur. Pour les mises à jour, suivre **MISES-A-JOUR.md**.

Cette version conserve les couleurs, les illustrations, les polices et les écrans de l'application originale. Elle ajoute les réglages de courriel, une connexion configurable à Supabase et un bouton « Comment ça marche ».

## Choisir votre installation

**Une copie de l'application + un projet Supabase par coopérative.** Les noms, comptes, adresses et billets sont ainsi séparés entre les coops. Ce projet n'est pas une plateforme regroupant plusieurs coops dans une même base.

- Pour une **nouvelle coop**, suivez toutes les étapes ci-dessous.
- Pour votre **base Dyad existante**, sauvegardez-la puis exécutez `supabase/migrations/002_configuration.sql` puis `supabase/migrations/003_member_alerts.sql`. Appliquez aussi `20260926044300_protect_member_accounts.sql` puis `20260926044549_restrict_internal_functions.sql`. N'exécutez pas `001_fresh_install.sql` sur cette base. Conservez votre administrateur actuel et renseignez les variables de cette base. Les données existantes et le nom actuel sont conservés : changez le nom dans Paramètres.

Le ZIP ne contient pas de copie de votre base actuelle. Le schéma de la base existante doit correspondre aux tables utilisées par l'application (settings, profiles, addresses, tickets, ticket_comments). Le script 002 requiert notamment settings.id, coop_name, updated_at et profiles.id, role. Faites un essai sur une copie de la base avant une mise à jour en production.

## 1. Préparer les comptes

La personne responsable de l'installation prépare un projet Supabase et un projet Vercel distincts pour chaque coop. La propriété des comptes, les accès, les frais et la maintenance doivent être convenus avec chaque coop. Pour les notifications, elle configure un compte Resend et un domaine d'envoi vérifié. Aucun domaine commun n'est fourni automatiquement; son utilisation nécessite une entente précisant sa gestion. Chaque coop choisit son courriel de réception dans l'application. Les services peuvent appliquer leurs propres frais et limites.

Décompressez le ZIP et ouvrez le dossier du projet dans Dyad ou dans votre environnement de développement. Utilisez Node.js 22.12 ou ultérieur et pnpm. Installez les dépendances avec `pnpm install --frozen-lockfile`.

## 2. Créer la base d'une nouvelle coop

### Installation automatique sur Vercel

Dans Vercel → Marketplace → Supabase → Install, choisissez **Link Existing Supabase Account**, votre équipe et uniquement votre projet CoopFix. Reliez votre projet Supabase vide. L’intégration fournit les variables de connexion sans les copier dans le code.

Relancez ensuite une publication **Production** dans Deployments → Redeploy. Le script `scripts/build.mjs` installe toutes les migrations SQL dans une transaction avant de construire le site. Les publications suivantes conservent les données et ignorent les migrations déjà appliquées. Les previews n’appliquent aucune migration. Une base contenant déjà des tables sans historique CoopFix est refusée pour protéger ses données.

Une fois la publication réussie, créez votre premier compte sur votre site. Il devient administrateur. Dans Supabase → Authentication → URL Configuration, utilisez l’adresse HTTPS de votre site comme Site URL et autorisez son URL de retour `/login` pour la confirmation par courriel.

### Installation manuelle pour les autres hébergeurs

Dans Supabase, ouvrez SQL Editor :
1. Exécutez `supabase/migrations/001_fresh_install.sql`.
2. Exécutez ensuite `supabase/migrations/002_configuration.sql`.
3. Exécutez `supabase/migrations/003_member_alerts.sql` pour les alertes des membres.

4. Exécutez `supabase/migrations/20260926044300_protect_member_accounts.sql`.
5. Exécutez `supabase/migrations/20260926044549_restrict_internal_functions.sql`.

Le modèle démarre sans adresses ni billets fictifs, avec le nom à inscrire. Le premier compte créé devient administrateur. Les suivants sont membres.

## 3. Connecter l'application

Copiez `.env.example` en `.env.local`, puis renseignez l'URL et la clé publique du projet Supabase :

```dotenv
VITE_SUPABASE_URL=https://VOTRE-PROJET.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=VOTRE_CLE_PUBLIQUE
```

Utilisez la clé **publishable** ou la clé publique **anon** de votre projet. Ne mettez jamais de clé service_role, de clé Resend ni de secret webhook dans une variable VITE : ces variables sont visibles dans le navigateur.

Lancez `pnpm dev`. Sans ces deux variables, une page d'installation s'affiche. Relancez le serveur après les avoir ajoutées.

## 4. Créer le premier administrateur

Ouvrez le site, cliquez sur **Devenir membre**, puis créez le premier compte avec le courriel et le mot de passe de votre choix. Ce premier compte devient automatiquement administrateur; les suivants sont membres. Configurez ensuite le nom, le courriel de réception et les adresses de votre coop.

## 5. Personnaliser la coop

La personne responsable de l'installation renseigne l'adresse publique du site et vérifie le service de courriel. L'administrateur de la coop peut ensuite, dans **Paramètres**, inscrire le nom de sa coop et son courriel de réception. Dans **Adresses**, ajoutez chaque immeuble et, au besoin, son nombre de logements. Le nom est affiché sur les pages de connexion et dans l'en-tête. Chaque membre choisit son immeuble et son logement dans son profil.

Le courriel de réception et les réglages d'envoi sont conservés dans une table privée, accessibles uniquement par les fonctions réservées aux administrateurs et par le service serveur. Les membres ne peuvent pas modifier ces réglages.

## 6. Publier sur Vercel

Vercel est une option d'hébergement. Si la coop dispose déjà d'un hébergement compatible avec un site Vite statique, elle peut l'utiliser : publier le contenu de `dist`, activer HTTPS et configurer les routes pour renvoyer vers `index.html`. La base et les courriels restent à configurer séparément.

La coop peut utiliser son domaine, par exemple `reparations.macoop.ca`, avec Vercel ou un autre hébergeur. Le responsable configure les enregistrements DNS indiqués par l'hébergeur, vérifie HTTPS et les liens directs vers les billets, puis utilise cette adresse dans CoopFix et dans les réglages de connexion Supabase. Un domaine seul ne remplace pas l'hébergement.

L'aide propose un lien de création de compte Vercel. Pour activer le bouton d'installation du modèle, renseigner `VITE_COOPFIX_TEMPLATE_REPOSITORY` avec l'URL d'un dépôt du modèle accessible aux nouvelles coops, après avoir vérifié son contenu et testé une installation indépendante. Ne pas y mettre de secrets ni les paramètres d'une coop existante. Sans cette variable, l'aide indique que l'installation automatique n'est pas encore disponible.

1. Placez le projet dans un dépôt Git privé, sans node_modules, .env.local ni secrets.
2. Dans Vercel, importez le dépôt et sélectionnez Vite.
3. Commande d'installation : `pnpm install --frozen-lockfile`. Commande de construction : `pnpm build`. Dossier de sortie : `dist`.
4. Ajoutez les deux variables VITE_SUPABASE ci-dessus dans l'environnement de production avant de déployer.
5. Déployez. Le fichier vercel.json fourni permet d'ouvrir directement les liens vers les billets.
6. Dans Supabase → Authentication → URL Configuration, définissez l'adresse publiée comme Site URL et ajoutez les URL de redirection nécessaires. Pour le développement, autorisez aussi l'URL locale affichée par Vite.
7. Vérifiez les réglages de confirmation d'inscription et le service SMTP de Supabase pour les courriels de création de compte. Ce service d'authentification est distinct des notifications de billets décrites ci-dessous.
8. Dans Paramètres de CoopFix, inscrivez l'adresse publiée, par exemple `https://votre-coop.vercel.app`, sans chemin.

Une modification des variables VITE nécessite un nouveau déploiement.

## 7. Activer les notifications de billets

Le champ de courriel dans l'application ne suffit pas : installez une fois le service ci-dessous.

### Service d'envoi

1. Dans Resend, vérifiez votre domaine d'envoi et créez une clé API d'envoi.
2. Dans Supabase → Edge Functions → Secrets, ajoutez :
   - `RESEND_API_KEY` : votre clé Resend.
   - `MAIL_FROM` : par exemple `CoopFix <billets@votre-domaine.ca>`, sur le domaine vérifié.
   - `NOTIFICATION_WEBHOOK_SECRET` : une longue valeur aléatoire (au moins 32 caractères), à conserver privée.
3. Depuis le dossier du projet, avec Supabase CLI installé et connecté à votre compte :

```sh
supabase login
supabase link --project-ref VOTRE-REFERENCE-PROJET
supabase functions deploy notify-ticket --no-verify-jwt
```

La fonction utilise les variables serveur SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY fournies par Supabase. La vérification JWT est désactivée pour ce webhook; la fonction exige à la place l'en-tête secret `x-coopfix-secret`. N'exposez pas ce secret dans le navigateur.

### Déclenchement à chaque nouveau billet

Dans Supabase → Database → Webhooks, créez un webhook :
- Nom : `nouveau-billet`.
- Table : `public.tickets`.
- Événement : **INSERT uniquement**.
- Méthode : POST.
- URL : `https://VOTRE-PROJET.supabase.co/functions/v1/notify-ticket`.
- En-têtes : `Content-Type: application/json` et `x-coopfix-secret: VOTRE_SECRET` (identique à NOTIFICATION_WEBHOOK_SECRET).

Dans CoopFix → Paramètres, inscrivez le courriel destinataire et l'adresse publique du site, activez les notifications puis enregistrez. Vous pourrez ensuite changer le destinataire depuis l'application, sans modifier le code.

Ajoutez aussi deux webhooks vers la même fonction, avec les mêmes en-têtes : **public.tickets → UPDATE** (clôture) et **public.ticket_comments → INSERT** (demande de précisions). La fonction ignore les changements qui ne nécessitent pas une alerte.

Les nouveaux billets sont envoyés à la coordination lorsque son interrupteur de réception est activé. Elles contiennent le titre, la description, l'adresse, le logement et un lien vers le billet (connexion requise). Un billet reste enregistré même si l'envoi du courriel échoue. Le succès affiché lors de la création d'un billet ne garantit donc pas sa livraison par courriel.

### Vérification et incidents

Créez un billet de test, vérifiez sa présence dans le tableau de bord administrateur ET sa réception dans la boîte courriel. Consultez les indésirables, les journaux Edge Functions et Resend en cas d'échec. Un retour HTTP 200 signifie que l'envoi est désactivé ou que Resend a accepté le message; il ne prouve pas une livraison dans la boîte de réception.

Les membres reçoivent aussi un courriel à l'adresse actuelle de leur compte quand un administrateur coche « Demander des précisions au membre » avant de publier un commentaire, ou quand il marque leur billet comme complété. Ces deux alertes ne dépendent pas de l'interrupteur de réception de la coordination. Le service d'envoi et l'adresse publique doivent être configurés. Un commentaire ordinaire ne déclenche pas d'alerte. Une simple modification d'un billet déjà complété ne déclenche pas une nouvelle alerte; une réouverture suivie d'une nouvelle clôture en déclenche une.

Il n'y a pas de file de reprise automatique dans cette version. Pour relancer un billet après correction d'une panne, appelez la fonction depuis un outil serveur avec le secret et le corps JSON suivant, en utilisant l'UUID réel du billet :

```json
{"type":"INSERT","table":"tickets","schema":"public","record":{"id":"UUID-DU-BILLET"}}
```

Pour relancer une alerte membre, utilisez le corps de l'événement original : UPDATE de tickets avec record et old_record pour une clôture, ou INSERT de ticket_comments pour une demande de précisions.

Resend utilise une clé d'idempotence par événement pour limiter les doublons pendant 24 heures. Une relance après ce délai peut créer un doublon. Si vous modifiez les réglages de courriel entre deux tentatives dans ce délai, un conflit d'idempotence peut être signalé : vérifiez d'abord les journaux Resend avant toute nouvelle tentative.

## 8. Tester avant d'inviter les membres

- Modifier le nom, recharger la page et vérifier la page de connexion.
- Ajouter une adresse et la sélectionner depuis un compte membre.
- Créer un billet et vérifier que seuls son auteur et les administrateurs peuvent le consulter.
- Recevoir la notification à l'adresse configurée; changer le destinataire et créer un nouveau billet.
- Désactiver les notifications et vérifier qu'un nouveau billet reste visible sans nouvel envoi.
- Demander des précisions avec la case prévue dans les commentaires et vérifier que le membre reçoit le courriel.
- Marquer le billet comme complété et vérifier la seconde alerte au membre.
- Vérifier sur téléphone et ouvrir directement un lien de billet après rechargement.
- Partager le lien public de l'application aux membres.

## Documentation des services

- Webhooks Supabase : https://supabase.com/docs/guides/database/webhooks
- Configuration des fonctions : https://supabase.com/docs/guides/functions/function-configuration
- Courriels et idempotence : https://resend.com/docs/dashboard/emails/idempotency-keys
- Vite sur Vercel : https://vercel.com/docs/frameworks/frontend/vite

La mise en ligne et l'envoi réel doivent être vérifiés avec vos comptes. Cette archive ne déploie rien automatiquement.

## Activation des nouveaux comptes par courriel

Cette activation s'applique aux membres et au premier administrateur. Le rôle du premier inscrit est réservé lors de sa création; l'accès au site attend ensuite la confirmation du courriel.

Avant d'activer cette exigence, configurer un fournisseur SMTP dans Supabase > Authentication > Emails > SMTP Settings et vérifier la réception d'un message. Le service par défaut de Supabase ne permet pas l'envoi aux membres externes de la coop. Définir Site URL sur l'adresse publique du site et autoriser l'adresse de connexion `/login`. Activer ensuite **Confirm email** dans Authentication > Sign In / Providers. Pour une base Dyad utilisant la confirmation automatique, exécuter `supabase/activation-apres-smtp.sql` pour supprimer cette confirmation automatique. Ne pas l'exécuter avant que le service SMTP fonctionne.

Les comptes déjà créés restent accessibles. Vérifier avec un nouveau compte que l'accès est refusé avant activation, puis permis après le clic sur le lien reçu. Ne jamais saisir une clé secrète dans les paramètres publics de l'application.

## Priorité choisie par le membre

Appliquer `supabase/migrations/20260926050701_member_ticket_priority.sql` après les migrations précédentes. Le nouveau billet permet de choisir Normal, Prioritaire ou Urgent. La coordination peut toujours ajuster la priorité.

## Connecter les courriels — marche à suivre

### Pour une boîte Google / Google Workspace

Cette option exige que le compte permette les **mots de passe d’application** et que la validation en deux étapes soit activée. Les règles de l’organisation peuvent empêcher cette option. Dans ce cas, la personne qui administre les courriels de la coop doit fournir un service d’envoi autorisé. Une clé API Google ne remplace pas ces réglages.

1. Le titulaire ouvre https://myaccount.google.com/apppasswords et sélectionne sa boîte de coop.
2. Il confirme lui-même son identité auprès de Google. Si l’option existe, il crée un mot de passe d’application nommé **CoopFix**. Il ne partage pas ce secret dans une conversation.
3. Dans Supabase, la personne responsable ouvre **Authentication → Emails → SMTP Settings** et prépare :
   - **Sender email address** : l’adresse complète choisie par la coop;
   - **Sender name** : le nom de la coop;
   - **Host** : `smtp.gmail.com`;
   - **Port** : `465` (connexion sécurisée SSL/TLS);
   - **Username** : l’adresse complète de la boîte Google;
   - **Password** : le mot de passe d’application, saisi directement dans le champ sécurisé.
4. Elle enregistre les réglages, définit l’adresse publique du site dans **Authentication → URL Configuration**, puis active **Confirm email** dans **Sign In / Providers**. Pour une base Dyad avec confirmation automatique, elle applique aussi `supabase/activation-apres-smtp.sql`.
5. Elle teste avec un nouveau compte : le message invitant à consulter la boîte doit apparaître; la connexion doit rester impossible avant activation; le lien reçu doit ramener au vrai site et permettre la connexion.
6. Elle vérifie le premier compte administrateur sur une installation neuve et un compte membre. Les comptes déjà confirmés ne reçoivent pas de nouveau message automatiquement.

### Alertes des billets : configuration distincte

Le réglage SMTP ci-dessus concerne les inscriptions Supabase. À lui seul, il **n’active pas les alertes des billets**. La version actuelle de `notify-ticket` utilise Resend : suivre la section consacrée à Resend, au domaine vérifié et aux webhooks dans ce guide. Si la coop utilise uniquement Google pour l’envoi, le transport des alertes doit être adapté et testé avant d’annoncer ces alertes comme actives.

Le manuel simple explique l’inscription et la réception des messages. Les secrets d’envoi restent dans les services serveur; ils ne sont jamais inscrits dans les réglages publics de CoopFix.

Références officielles : [Google — mots de passe d’application](https://support.google.com/accounts/answer/185833?hl=fr), [Google — envoyer depuis une application](https://support.google.com/a/answer/176600?hl=fr), [Supabase — SMTP](https://supabase.com/docs/guides/auth/auth-smtp).
