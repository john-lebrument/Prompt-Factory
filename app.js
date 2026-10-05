/**
 * Prompt Factory - Moteur principal
 * Application modulaire de conception et d'assemblage de prompts
 */

// Blocs par défaut pour démarrer immédiatement
const DEFAULT_BLOCKS = [
  {
    id: "blk-1",
    title: "🎯 Rôle : Expert Senior & Mentor",
    content: "Tu agis en tant qu'expert senior reconnu dans ton domaine. Adopte une posture pragmatique, méthodique, bienveillante et orientée vers des solutions concrètes et éprouvées.",
    createdAt: Date.now() - 50000
  },
  {
    id: "blk-2",
    title: "⚡ Contrainte : Clarté & Concision",
    content: "Va directement au but. Évite les introductions creuses, les flatteries et les formules de politesse inutiles. Privilégie des phrases percutantes et des listes à puces faciles à scanner.",
    createdAt: Date.now() - 40000
  },
  {
    id: "blk-3",
    title: "📊 Format : Tableau Comparatif Markdown",
    content: "Structure la synthèse finale sous la forme d'un tableau Markdown clair comprenant les colonnes suivantes : Critère | Option A | Option B | Avantages | Recommandation.",
    createdAt: Date.now() - 30000
  },
  {
    id: "blk-4",
    title: "🧠 Méthode : Réflexion Pas-à-Pas",
    content: "Avant de fournir le résultat final, détaille ton raisonnement étape par étape (Chain of Thought). Identifie d'abord les prérequis, puis les risques potentiels, et enfin la solution optimale.",
    createdAt: Date.now() - 20000
  },
  {
    id: "blk-5",
    title: "🇫🇷 Langue & Ton : Français Professionnel",
    content: "Rédige l'intégralité de ta réponse en français soigné, naturel et professionnel. Traduis les termes techniques quand un équivalent clair existe.",
    createdAt: Date.now() - 10000
  }
];

class PromptFactoryApp {
  constructor() {
    this.storageKey = 'prompt_factory_data_v1';
    this.themeKey = 'prompt_factory_theme';

    this.state = {
      blocks: [],
      selectedIds: [],
      searchQuery: '',
      separator: 'double',
      expandedCards: new Set(),
      editingBlockId: null,
      draggedIndex: null
    };

    this.init();
  }

  init() {
    this.loadState();
    this.initTheme();
    this.bindEvents();
    this.render();
  }

  /* ----------------- PERSISTANCE ----------------- */

  loadState() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state.blocks = Array.isArray(parsed.blocks) && parsed.blocks.length > 0 
          ? parsed.blocks 
          : DEFAULT_BLOCKS;
        this.state.selectedIds = Array.isArray(parsed.selectedIds) ? parsed.selectedIds : ['blk-1', 'blk-2'];
        this.state.separator = parsed.separator || 'double';
      } else {
        this.state.blocks = [...DEFAULT_BLOCKS];
        this.state.selectedIds = ['blk-1', 'blk-2'];
        this.saveState();
      }
    } catch (e) {
      console.error("Erreur lors du chargement local:", e);
      this.state.blocks = [...DEFAULT_BLOCKS];
      this.state.selectedIds = ['blk-1', 'blk-2'];
    }
  }

  saveState() {
    try {
      const data = {
        blocks: this.state.blocks,
        selectedIds: this.state.selectedIds,
        separator: this.state.separator
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (e) {
      console.error("Erreur de sauvegarde:", e);
    }
  }

  /* ----------------- GESTION DU THÈME ----------------- */

  initTheme() {
    const savedTheme = localStorage.getItem(this.themeKey);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme ? savedTheme === 'dark' : prefersDark;
    
    this.setTheme(isDark ? 'dark' : 'light');
  }

  setTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(this.themeKey, theme);
    this.updateThemeButton();
  }

  toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    this.setTheme(isDark ? 'light' : 'dark');
  }

  updateThemeButton() {
    const isDark = document.documentElement.classList.contains('dark');
    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
      btn.innerHTML = isDark 
        ? `<i data-lucide="sun" class="w-4 h-4 text-amber-400"></i><span class="hidden sm:inline">Mode Clair</span>`
        : `<i data-lucide="moon" class="w-4 h-4 text-slate-600"></i><span class="hidden sm:inline">Mode Sombre</span>`;
      if (window.lucide) window.lucide.createIcons();
    }
  }

  /* ----------------- ACTIONS SUR LES BLOCS ----------------- */

  createBlock(title, content) {
    const newBlock = {
      id: 'blk-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      title: title.trim() || 'Sans titre',
      content: content.trim(),
      createdAt: Date.now()
    };
    this.state.blocks.unshift(newBlock);
    // Sélectionner automatiquement le nouveau bloc
    this.state.selectedIds.push(newBlock.id);
    this.saveState();
    this.render();
    this.showToast('Nouveau bloc ajouté avec succès !', 'success');
  }

  updateBlock(id, title, content) {
    const block = this.state.blocks.find(b => b.id === id);
    if (block) {
      block.title = title.trim() || 'Sans titre';
      block.content = content.trim();
      block.updatedAt = Date.now();
      this.saveState();
      this.render();
      this.showToast('Bloc mis à jour.', 'info');
    }
  }

  duplicateBlock(id) {
    const original = this.state.blocks.find(b => b.id === id);
    if (!original) return;

    const copy = {
      id: 'blk-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      title: `${original.title} (Copie)`,
      content: original.content,
      createdAt: Date.now()
    };
    
    // Insérer juste après l'original
    const idx = this.state.blocks.findIndex(b => b.id === id);
    this.state.blocks.splice(idx + 1, 0, copy);
    this.saveState();
    this.render();
    this.showToast('Bloc dupliqué.', 'info');
  }

  deleteBlock(id) {
    const block = this.state.blocks.find(b => b.id === id);
    const title = block ? `"${block.title}"` : 'ce bloc';
    if (!confirm(`Voulez-vous vraiment supprimer définitivement ${title} ?`)) return;

    this.state.blocks = this.state.blocks.filter(b => b.id !== id);
    this.state.selectedIds = this.state.selectedIds.filter(selId => selId !== id);
    this.state.expandedCards.delete(id);
    this.saveState();
    this.render();
    this.showToast('Bloc supprimé.', 'warning');
  }

  /* ----------------- SÉLECTION & RÉORDONNANCEMENT ----------------- */

  toggleSelection(id) {
    const index = this.state.selectedIds.indexOf(id);
    if (index > -1) {
      this.state.selectedIds.splice(index, 1);
    } else {
      this.state.selectedIds.push(id);
    }
    this.saveState();
    this.render();
  }

  selectAll() {
    const visibleIds = this.getFilteredBlocks().map(b => b.id);
    const set = new Set([...this.state.selectedIds, ...visibleIds]);
    this.state.selectedIds = Array.from(set);
    this.saveState();
    this.render();
  }

  deselectAll() {
    this.state.selectedIds = [];
    this.saveState();
    this.render();
    this.showToast('Toutes les sélections ont été retirées.', 'info');
  }

  moveSelected(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= this.state.selectedIds.length) return;

    const temp = this.state.selectedIds[index];
    this.state.selectedIds[index] = this.state.selectedIds[newIndex];
    this.state.selectedIds[newIndex] = temp;

    this.saveState();
    this.renderAssemblyPane();
    this.renderCardsList();
  }

  /* ----------------- TEXTE FINAL & COPIE ----------------- */

  getAssembledPrompt() {
    const blockMap = new Map(this.state.blocks.map(b => [b.id, b]));
    const texts = this.state.selectedIds
      .map(id => blockMap.get(id))
      .filter(Boolean)
      .map(b => b.content.trim())
      .filter(t => t.length > 0);

    let sep = this.state.separator;
    if (sep === 'double') sep = '\n\n';
    else if (sep === 'single') sep = '\n';
    else if (sep === 'divider') sep = '\n\n---\n\n';
    else if (sep === 'numbered') {
      return texts.map((t, i) => `${i + 1}. ${t}`).join('\n\n');
    }

    return texts.join(sep);
  }

  async copyAssembledPrompt() {
    const text = this.getAssembledPrompt();
    if (!text.trim()) {
      this.showToast('Aucun bloc sélectionné à copier !', 'warning');
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      this.triggerCopyAnimation();
      this.showToast('✨ Prompt copié ! Prêt à être collé dans votre IA.', 'success');
    } catch (err) {
      // Fallback pour anciens navigateurs ou contextes sécurisés
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        this.triggerCopyAnimation();
        this.showToast('✨ Prompt copié !', 'success');
      } catch (e) {
        alert("Impossible de copier automatiquement. Veuillez copier le texte manuellement.");
      }
      document.body.removeChild(textArea);
    }
  }

  triggerCopyAnimation() {
    const btn = document.getElementById('copyBtn');
    if (btn) {
      btn.classList.add('animate-copy-pulse', 'ring-4', 'ring-emerald-400');
      const originalText = btn.innerHTML;
      btn.innerHTML = `<i data-lucide="check" class="w-5 h-5"></i><span>Copié dans le presse-papier !</span>`;
      if (window.lucide) window.lucide.createIcons();

      setTimeout(() => {
        btn.classList.remove('animate-copy-pulse', 'ring-4', 'ring-emerald-400');
        btn.innerHTML = originalText;
        if (window.lucide) window.lucide.createIcons();
      }, 1600);
    }
  }

  /* ----------------- FILTRAGE & RECHERCHE ----------------- */

  getFilteredBlocks() {
    const q = this.state.searchQuery.toLowerCase().trim();
    if (!q) return this.state.blocks;

    return this.state.blocks.filter(b => 
      b.title.toLowerCase().includes(q) || 
      b.content.toLowerCase().includes(q)
    );
  }

  /* ----------------- EXPORT & IMPORT ----------------- */

  exportJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.state.blocks, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `prompt_factory_sauvegarde_${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchorElem.click();
    this.showToast('Fichier JSON de sauvegarde téléchargé !', 'success');
  }

  exportMarkdown() {
    const text = this.getAssembledPrompt();
    if (!text.trim()) {
      this.showToast('Rien à exporter (aucun bloc actif).', 'warning');
      return;
    }
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const dlAnchor = document.createElement('a');
    dlAnchor.href = url;
    dlAnchor.download = `prompt_assemble_${new Date().toISOString().slice(0, 10)}.md`;
    dlAnchor.click();
    URL.revokeObjectURL(url);
    this.showToast('Prompt exporté en fichier Markdown (.md) !', 'success');
  }

  importJSON(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (Array.isArray(imported)) {
          // Valider et fusionner
          const validBlocks = imported.filter(b => b && typeof b.title === 'string' && typeof b.content === 'string');
          if (validBlocks.length === 0) {
            alert("Aucun bloc valide trouvé dans le fichier.");
            return;
          }

          const mode = confirm(`Importer ${validBlocks.length} blocs.\n\nCliquez sur OK pour AJOUTER ces blocs à votre bibliothèque existante.\nCliquez sur Annuler pour REMPLACER votre bibliothèque actuelle.`);
          
          if (mode) {
            // Ajouter
            this.state.blocks = [...validBlocks, ...this.state.blocks];
          } else {
            // Remplacer
            this.state.blocks = validBlocks;
            this.state.selectedIds = [];
          }

          this.saveState();
          this.render();
          this.showToast(`${validBlocks.length} blocs importés avec succès !`, 'success');
        } else {
          alert("Le format du fichier JSON n'est pas un tableau de blocs valide.");
        }
      } catch (err) {
        alert("Erreur lors de la lecture du fichier JSON : " + err.message);
      }
      // Reset input
      event.target.value = '';
    };
    reader.readAsText(file);
  }

  resetToDefault() {
    if (confirm("Réinitialiser avec les blocs d'exemple ? Vos blocs personnalisés actuels seront remplacés.")) {
      this.state.blocks = [...DEFAULT_BLOCKS];
      this.state.selectedIds = ['blk-1', 'blk-2'];
      this.saveState();
      this.render();
      this.showToast("Modèles réinitialisés avec succès !", "info");
    }
  }

  /* ----------------- MODALE ÉDITION / CRÉATION ----------------- */

  openModal(blockId = null) {
    this.state.editingBlockId = blockId;
    const modal = document.getElementById('blockModal');
    const modalTitle = document.getElementById('modalTitle');
    const titleInput = document.getElementById('blockTitleInput');
    const contentInput = document.getElementById('blockContentInput');

    if (blockId) {
      const block = this.state.blocks.find(b => b.id === blockId);
      if (block) {
        modalTitle.textContent = "Modifier le Bloc";
        titleInput.value = block.title;
        contentInput.value = block.content;
      }
    } else {
      modalTitle.textContent = "Nouveau Bloc de Prompt";
      titleInput.value = "";
      contentInput.value = "";
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    titleInput.focus();
    this.updateModalCharCount();
  }

  closeModal() {
    const modal = document.getElementById('blockModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    this.state.editingBlockId = null;
  }

  saveModal() {
    const titleInput = document.getElementById('blockTitleInput');
    const contentInput = document.getElementById('blockContentInput');
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    if (!title && !content) {
      this.showToast('Veuillez renseigner au moins un titre ou du texte.', 'warning');
      return;
    }

    if (this.state.editingBlockId) {
      this.updateBlock(this.state.editingBlockId, title, content);
    } else {
      this.createBlock(title, content);
    }

    this.closeModal();
  }

  updateModalCharCount() {
    const contentInput = document.getElementById('blockContentInput');
    const countSpan = document.getElementById('modalCharCount');
    if (contentInput && countSpan) {
      const len = contentInput.value.length;
      countSpan.textContent = `${len} caractère${len > 1 ? 's' : ''}`;
    }
  }

  /* ----------------- NOTIFICATIONS TOAST ----------------- */

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    const bgColors = {
      success: 'bg-emerald-600 text-white border-emerald-500',
      warning: 'bg-amber-600 text-white border-amber-500',
      info: 'bg-indigo-600 text-white border-indigo-500'
    };

    const icons = {
      success: 'check-circle',
      warning: 'alert-triangle',
      info: 'info'
    };

    toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium transition-all duration-300 transform translate-y-3 opacity-0 ${bgColors[type] || bgColors.info}`;
    toast.innerHTML = `
      <i data-lucide="${icons[type] || 'info'}" class="w-5 h-5 flex-shrink-0"></i>
      <span>${this.escapeHtml(message)}</span>
    `;

    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    // Trigger enter animation
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-3', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
    });

    // Auto dismiss after 3.5s
    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  /* ----------------- DRAG AND DROP DANS L'ASSEMBLAGE ----------------- */

  handleDragStart(e, index) {
    this.state.draggedIndex = index;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
    e.currentTarget.classList.add('opacity-40');
  }

  handleDragOver(e, index) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  handleDrop(e, targetIndex) {
    e.preventDefault();
    const fromIndex = this.state.draggedIndex;
    if (fromIndex !== null && fromIndex !== targetIndex) {
      const movedItem = this.state.selectedIds.splice(fromIndex, 1)[0];
      this.state.selectedIds.splice(targetIndex, 0, movedItem);
      this.saveState();
      this.renderAssemblyPane();
      this.renderCardsList();
    }
    this.state.draggedIndex = null;
  }

  handleDragEnd(e) {
    e.currentTarget.classList.remove('opacity-40');
    this.state.draggedIndex = null;
  }

  /* ----------------- RENDU DE L'INTERFACE ----------------- */

  render() {
    this.renderCardsList();
    this.renderAssemblyPane();
    this.updateThemeButton();
    if (window.lucide) window.lucide.createIcons();
  }

  renderCardsList() {
    const listEl = document.getElementById('blocksList');
    const countBadge = document.getElementById('blocksCountBadge');
    if (!listEl) return;

    const filtered = this.getFilteredBlocks();
    if (countBadge) {
      countBadge.textContent = `${filtered.length} bloc${filtered.length > 1 ? 's' : ''}`;
    }

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40">
          <div class="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
            <i data-lucide="layers" class="w-7 h-7"></i>
          </div>
          <h3 class="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">Aucun bloc trouvé</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-5">
            ${this.state.searchQuery ? `Aucun résultat pour "${this.state.searchQuery}". Essayez un autre mot-clé.` : 'Votre bibliothèque est vide. Créez votre première brique de prompt !'}
          </p>
          <button onclick="app.openModal()" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-md transition-all">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>Créer un premier bloc</span>
          </button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    const cardsHtml = filtered.map(block => {
      const isSelected = this.state.selectedIds.includes(block.id);
      const selectionIndex = isSelected ? this.state.selectedIds.indexOf(block.id) + 1 : null;
      const isExpanded = this.state.expandedCards.has(block.id);

      return `
        <div class="block-card relative group rounded-2xl p-4 transition-all duration-200 border ${
          isSelected 
            ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-400 dark:border-indigo-600/80 shadow-md ring-1 ring-indigo-400/30' 
            : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
        }" data-block-id="${block.id}">
          
          <!-- Header de la carte : Sélecteur + Titre -->
          <div class="flex items-start gap-3">
            
            <!-- Checkbox de sélection visuelle avec numéro d'ordre -->
            <button 
              type="button"
              onclick="app.toggleSelection('${block.id}')"
              title="${isSelected ? 'Désélectionner ce bloc' : 'Sélectionner pour le prompt'}"
              class="flex-shrink-0 mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs transition-all ${
                isSelected 
                  ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600/30' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-indigo-100 dark:hover:bg-slate-700 hover:text-indigo-600'
              }">
              ${isSelected ? `#${selectionIndex}` : '<i data-lucide="plus" class="w-4 h-4"></i>'}
            </button>

            <!-- Titre et statut -->
            <div class="flex-grow min-w-0" onclick="app.toggleSelection('${block.id}')" style="cursor: pointer;">
              <h4 class="font-semibold text-sm leading-snug text-slate-800 dark:text-slate-100 truncate hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                ${this.escapeHtml(block.title)}
              </h4>
              <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                ${block.content.length} caractères · ${block.content.split(/\s+/).filter(Boolean).length} mots
              </p>
            </div>

            <!-- Actions rapides -->
            <div class="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              <button 
                onclick="app.openModal('${block.id}')"
                title="Modifier ce bloc"
                class="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
              </button>

              <button 
                onclick="app.duplicateBlock('${block.id}')"
                title="Dupliquer"
                class="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <i data-lucide="copy" class="w-3.5 h-3.5"></i>
              </button>

              <button 
                onclick="app.deleteBlock('${block.id}')"
                title="Supprimer"
                class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>

          <!-- Contenu du bloc (Aperçu tronqué ou complet) -->
          <div class="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-normal pl-10">
            <div class="${isExpanded ? '' : 'line-clamp-3'} whitespace-pre-wrap bg-slate-50/80 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60 font-mono text-[11px]">
              ${this.escapeHtml(block.content)}
            </div>
            
            ${block.content.length > 120 ? `
              <button 
                onclick="app.toggleExpand('${block.id}')" 
                class="mt-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1">
                ${isExpanded ? 'Réduire' : 'Voir tout le texte'}
                <i data-lucide="${isExpanded ? 'chevron-up' : 'chevron-down'}" class="w-3 h-3"></i>
              </button>
            ` : ''}
          </div>

        </div>
      `;
    }).join('');

    listEl.innerHTML = cardsHtml;
    if (window.lucide) window.lucide.createIcons();
  }

  toggleExpand(id) {
    if (this.state.expandedCards.has(id)) {
      this.state.expandedCards.delete(id);
    } else {
      this.state.expandedCards.add(id);
    }
    this.renderCardsList();
  }

  renderAssemblyPane() {
    const blockMap = new Map(this.state.blocks.map(b => [b.id, b]));
    const selectedBlocks = this.state.selectedIds
      .map(id => blockMap.get(id))
      .filter(Boolean);

    const countBadge = document.getElementById('selectedCountBadge');
    if (countBadge) {
      countBadge.textContent = `${selectedBlocks.length} sélectionné${selectedBlocks.length > 1 ? 's' : ''}`;
    }

    // Rendu de la liste réordonnable
    const reorderListEl = document.getElementById('selectedBlocksList');
    if (reorderListEl) {
      if (selectedBlocks.length === 0) {
        reorderListEl.innerHTML = `
          <div class="text-center py-6 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
            <p class="text-xs text-slate-400 dark:text-slate-500">
              Aucun bloc sélectionné. Cochez les blocs à gauche pour commencer à assembler votre prompt.
            </p>
          </div>
        `;
      } else {
        reorderListEl.innerHTML = selectedBlocks.map((block, idx) => `
          <div 
            draggable="true"
            ondragstart="app.handleDragStart(event, ${idx})"
            ondragover="app.handleDragOver(event, ${idx})"
            ondrop="app.handleDrop(event, ${idx})"
            ondragend="app.handleDragEnd(event)"
            class="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xs group transition-all">
            
            <!-- Poignée Drag & Drop -->
            <div class="drag-handle text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-grab px-0.5" title="Glisser pour réordonner">
              <i data-lucide="grip-vertical" class="w-3.5 h-3.5"></i>
            </div>

            <!-- Numéro d'ordre -->
            <span class="w-5 h-5 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-[10px]">
              ${idx + 1}
            </span>

            <!-- Titre tronqué -->
            <span class="flex-grow font-medium text-slate-700 dark:text-slate-200 truncate" title="${this.escapeHtml(block.title)}">
              ${this.escapeHtml(block.title)}
            </span>

            <!-- Boutons Monter / Descendre -->
            <div class="flex items-center">
              <button 
                onclick="app.moveSelected(${idx}, -1)" 
                ${idx === 0 ? 'disabled class="opacity-20 cursor-not-allowed"' : 'class="hover:text-indigo-600 text-slate-400"'} 
                title="Monter" 
                class="p-1">
                <i data-lucide="chevron-up" class="w-3.5 h-3.5"></i>
              </button>
              <button 
                onclick="app.moveSelected(${idx}, 1)" 
                ${idx === selectedBlocks.length - 1 ? 'disabled class="opacity-20 cursor-not-allowed"' : 'class="hover:text-indigo-600 text-slate-400"'} 
                title="Descendre" 
                class="p-1">
                <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
              </button>
            </div>

            <!-- Retirer de la sélection -->
            <button 
              onclick="app.toggleSelection('${block.id}')"
              title="Retirer ce bloc de la sélection"
              class="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors">
              <i data-lucide="x" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        `).join('');
      }
    }

    // Aperçu du texte assemblé
    const assembledText = this.getAssembledPrompt();
    const previewEl = document.getElementById('assembledPreview');
    if (previewEl) {
      previewEl.value = assembledText;
    }

    // Statistiques
    const charCount = assembledText.length;
    const wordCount = assembledText.trim() ? assembledText.trim().split(/\s+/).length : 0;
    const estimatedTokens = Math.ceil(charCount / 3.8);

    const statsEl = document.getElementById('promptStats');
    if (statsEl) {
      statsEl.textContent = `${wordCount} mot${wordCount > 1 ? 's' : ''} · ${charCount} car. · ~${estimatedTokens} tokens`;
    }

    if (window.lucide) window.lucide.createIcons();
  }

  /* ----------------- GESTIONNAIRES D'ÉVÉNEMENTS ----------------- */

  bindEvents() {
    // Recherche en temps réel
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.state.searchQuery = e.target.value;
        this.renderCardsList();
      });
    }

    // Séparateur de texte
    const sepSelect = document.getElementById('separatorSelect');
    if (sepSelect) {
      sepSelect.value = this.state.separator;
      sepSelect.addEventListener('change', (e) => {
        this.state.separator = e.target.value;
        this.saveState();
        this.renderAssemblyPane();
      });
    }

    // Compteur caractères dans la modale
    const modalContent = document.getElementById('blockContentInput');
    if (modalContent) {
      modalContent.addEventListener('input', () => this.updateModalCharCount());
    }

    // Raccourcis clavier globaux
    window.addEventListener('keydown', (e) => {
      // Ctrl + Entrée pour valider la modale si ouverte
      const modal = document.getElementById('blockModal');
      if (modal && !modal.classList.contains('hidden')) {
        if (e.key === 'Escape') {
          this.closeModal();
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          this.saveModal();
        }
        return;
      }

      // Ctrl + Entrée pour copier le prompt depuis l'accueil
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        this.copyAssembledPrompt();
      }
    });
  }

  /* ----------------- UTILITAIRE ----------------- */

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

// Initialisation globale
let app;
window.addEventListener('DOMContentLoaded', () => {
  app = new PromptFactoryApp();
});
