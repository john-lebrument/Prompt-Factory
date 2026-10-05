# 🏭 Prompt Factory

Bienvenue dans **Prompt Factory**, votre atelier modulaire pour concevoir, stocker et assembler vos briques de prompts réutilisables.

🌐 **Tester directement en ligne :** [https://john-lebrument.github.io/Prompt-Factory/](https://john-lebrument.github.io/Prompt-Factory/)

---

## 🚀 Comment lancer l'application en local ?

Vous avez deux méthodes très simples :
1. **Méthode 1 (Le plus simple sous Windows) :** Double-cliquez sur le fichier `Lancer Prompt Factory.bat`.
2. **Méthode 2 :** Double-cliquez directement sur le fichier `index.html`.

L'application s'ouvre immédiatement dans votre navigateur habituel (Edge, Chrome, Firefox, Brave...). **Aucune installation de logiciel n'est nécessaire.**

---

## ✨ Fonctionnalités Clés

### 1. Bibliothèque de Blocs (Volet Gauche)
* **Création d'un bloc (+)** : Cliquez sur **"+ Nouveau Bloc"** pour ajouter une brique. Renseignez un titre évocateur (ex: `🎯 Rôle`, `⚡ Contrainte`, `📊 Format`) et le texte du prompt.
* **Aperçu aéré** : Le texte est tronqué par défaut pour ne pas encombrer l'écran. Un bouton *"Voir tout le texte"* permet de déplier le bloc.
* **Sélection intuitive** : Cliquez n'importe où sur un bloc pour l'ajouter ou le retirer de votre prompt assemblé. Un badge avec le numéro d'ordre (`#1`, `#2`...) apparaît dès qu'il est sélectionné.
* **Actions rapides** :
  * ✏️ **Modifier** : Modifiez le titre ou le contenu à tout moment.
  * 📋 **Dupliquer** : Créez une variante en un clic.
  * 🗑️ **Supprimer** : Supprimez les blocs obsolètes.

### 2. Atelier d'Assemblage & Copie (Volet Droit)
* **Réorganisation facile** : Changez l'ordre des blocs sélectionnés via les flèches (Monter/Descendre) ou en les faisant glisser (**Drag & Drop**).
* **Séparateur personnalisé** : Choisissez comment lier vos blocs (Double saut de ligne, simple saut, ligne séparatrice Markdown `---`, ou liste numérotée).
* **Aperçu en temps réel** : Visualisez instantanément le prompt complet avant de l'envoyer.
* **Compteur & Statistiques** : Suivez le nombre de mots, de caractères et l'estimation des tokens.
* **📋 Bouton "Copier le Prompt"** : Copie l'intégralité du résultat dans votre presse-papier. Collez-le ensuite directement (`Ctrl + V`) dans ChatGPT, Claude, Gemini, Mistral ou DeepSeek.

### 3. Sauvegarde & Sécurité
* **Sauvegarde automatique locale** : Vos blocs sont automatiquement enregistrés dans votre navigateur (`LocalStorage`). Vous ne perdez rien en fermant l'onglet.
* **Bouton Exporter (JSON)** : Téléchargez une copie de sauvegarde de votre collection sur votre disque local ou votre espace cloud.
* **Bouton Importer (JSON)** : Restaurez ou fusionnez une bibliothèque de blocs depuis un fichier JSON.
* **Exporter en Markdown (.md)** : Téléchargez directement le prompt assemblé sous forme de document texte.

---

## ⚖️ Licence

Le code original de Prompt Factory est distribué sous **GNU GPL version 3 ou toute version ultérieure** (`GPL-3.0-or-later`), conformément au fichier [`LICENSE`](LICENSE). Les bibliothèques tierces intégrées conservent leurs licences propres, détaillées dans [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

---

## 🎒 Version Portable

Pour utiliser Prompt Factory sans installer de logiciel :
* **Fichier autonome unique** : [`portable/PromptFactory-Standalone.html`](portable/PromptFactory-Standalone.html) intègre le HTML, le CSS, les icônes et le JavaScript dans un seul fichier. Après téléchargement, il peut être ouvert sans connexion Internet.
* **Archive ZIP complète** : [`portable/PromptFactory-Portable.zip`](portable/PromptFactory-Portable.zip) contient les fichiers et bibliothèques locales nécessaires, ainsi que les notices de licences tierces.
* La version en ligne et la version locale utilisent les bibliothèques CSS et icônes conservées dans le dépôt ; aucune police, feuille de style ou bibliothèque d'icônes n'est chargée depuis un CDN.

---

## ⌨️ Raccourcis Clavier Utiles

| Raccourci | Action |
| :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>Entrée</kbd> | **Copier le prompt assemblé** (ou Enregistrer dans la fenêtre d'édition) |
| <kbd>Échap</kbd> | Fermer la fenêtre d'édition |
| <kbd>Ctrl</kbd> + <kbd>V</kbd> | Coller le prompt dans votre outil d'IA |

---

*Conçu pour une productivité maximale avec les modèles de langage actuels.*

---

## 🛠️ Tests et reconstruction

Pour régénérer la feuille CSS et les fichiers portables, installer Node.js et Python, puis lancer à la racine du projet :

```bash
npm ci
npm run build:css
python build_portable.py
npm test
```

Les dépendances de développement sont verrouillées dans `package-lock.json`. Les licences des bibliothèques intégrées sont détaillées dans [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

Le script **Mettre à jour GitHub** affiche les changements, demande une première confirmation, puis réaffiche la liste effectivement préparée avant de demander une seconde confirmation pour le commit et le push vers le dépôt public. Il recontrôle le contenu exact du commit et vérifie que `origin/main` n’a pas changé avant l’envoi ; après le push, il relit la référence distante pour confirmer le résultat. En cas d’annulation ou de divergence, aucun changement inattendu n’est envoyé. Si la seconde étape est annulée, les fichiers restent préparés localement, mais aucun commit ni push n’est effectué.
