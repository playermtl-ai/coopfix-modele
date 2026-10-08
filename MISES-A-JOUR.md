# Maintenir une version commune de CoopFix

Ce document technique s’adresse à la personne responsable de l’installation et des mises à jour. Il est distinct du guide simple destiné aux administrateurs et aux membres.

## Organisation
Conserver un seul dépôt de référence du code. Chaque coop utilise son propre projet d'hébergement, son propre projet Supabase et ses propres paramètres. Les noms, adresses et courriels se configurent dans la base de chaque coop, jamais en modifiant le code pour cette coop.

Chaque coop désigne une personne ou un fournisseur responsable de son installation et des mises à jour. Ce rôle ne revient pas automatiquement au créateur de CoopFix. La propriété des comptes de services, les accès et la prise en charge des frais doivent être convenus avec chaque coop. Le responsable configure le service d’envoi et un domaine d’envoi vérifié. Un domaine commun peut être utilisé si une entente prévoit sa gestion; il n’est pas fourni automatiquement. Chaque coop choisit son **courriel de réception** dans Paramètres. Ne jamais partager une base de données entre les coops de ce modèle.

## Première installation d'une coop
1. Choisir une version numérotée du code de référence, par exemple une version validée dans Git.
2. Créer une base Supabase séparée et un projet Vercel séparé.
3. Suivre GUIDE-INSTALLATION.md avec les identifiants de cette installation.
4. Préparer le compte administrateur et tester un compte membre et les courriels.
5. Remettre le lien et GUIDE-COOP.md à l'administrateur.
6. Noter les références de projets et la version dans SUIVI-INSTALLATIONS.md. Ne pas y inscrire de mots de passe ou de clés privées.

## Mise à jour du modèle commun
1. Modifier et tester le code dans le dépôt de référence.
2. Numéroter la nouvelle version et noter les changements et éventuels scripts SQL requis.
3. Tester cette version dans une installation d'essai séparée.
4. Sauvegarder la base de la coop qui sera mise à jour et noter sa version actuelle.
5. Appliquer uniquement les nouveaux scripts requis, dans l'ordre. Ne jamais réexécuter le script de création 001 sur une base déjà installée.
6. Déployer la nouvelle version sur le projet Vercel de cette coop, en conservant **ses propres variables** de connexion.
7. Tester connexion, nom, adresses, billet, demande de précisions, clôture et réception des courriels.
8. Mettre à jour le tableau de suivi, puis répéter pour la coop suivante.

Ne pas brancher toutes les installations sur un déploiement automatique non vérifié : une mise à jour doit d'abord passer par l'installation d'essai. Utiliser des versions ou branches de publication identifiées pour contrôler ce qui est déployé sur chaque site.

## Retour arrière
Conserver le précédent déploiement et la sauvegarde de base. Revenir au déploiement précédent uniquement s'il reste compatible avec le schéma de la base. Une restauration de base peut écraser des billets récents : planifier cette opération et faire approuver toute perte de données. Préférer des migrations additives compatibles avec l'ancienne version.

## Ce qui est inclus dans cette livraison
La configuration par installation, les alertes de nouveaux billets, les demandes de précisions et les clôtures. Les scripts 001, 002 et 003 sont fournis. Aucun script de plateforme multi-coop partagée ne fait partie de cette version.
