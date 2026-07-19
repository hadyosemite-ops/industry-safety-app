# Roadmap — Industry Safety App

Fichier de suivi pratique. On avance par lots de **5 tâches par jour**, cochées au fur et à mesure. Trois axes en parallèle : technique, UX, fonctionnel métier HSE.

## Références utilisées

- **Design** : kit FleetOS (cockpit sombre / glassmorphism, accent cyan) — tokens dans `src/index.css` (`:root`) et `tailwind.config.js`.
  Palette clé : fond `#020817`, cartes `rgba(13,27,46,.85)` + blur, accent `#00d4ff`, succès `#00e676`, danger `#ff4444`, warning `#ffb300`.
- **Mode clair** : activé via l'attribut `data-theme="light"` sur `<html>` (géré par `src/contexts/ThemeContext.tsx`, toggle dans la sidebar, persisté en `localStorage` sous `hse-theme`). Les tokens `[data-theme="light"]` dans `src/index.css` redéfinissent `--bg-app`, `--bg-card`, `--bg-elevated`, `--text-primary/secondary/muted/faint`, `--border*`, ainsi qu'une série de tokens de texte d'accent dédiés : `--badge-navy/success/danger/amber/safety/purple/teal-text` et `--section-epi/proprete/hauteur/chimique/electricite/incendie/manutention/ptw/secours-text`. Ces tokens existent aussi en version dark dans `:root` pour rester cohérents dans les deux thèmes.
  Chrome fixe volontairement non thémé (reste toujours sombre) : `Sidebar`, `ModuleHeader`, `StepIndicator`, `Tooltip`, bandeaux/modales à couleur de marque (`bg-navy-600`, `bg-[#0077aa]`), et `PermisQRPage` (verrouillée via la classe utilitaire `.theme-force-dark`, car cette page terrain n'a pas accès au toggle).
  Icônes d'accent (Lucide) : par choix assumé, plusieurs restent en couleur Tailwind fixe (`text-success-500`, etc.) plutôt qu'en token — tolérable car le contraste non-texte (3:1) est plus permissif que le contraste texte (4.5:1) exigé par WCAG.
- **Composants partagés** : `src/components/ui/*` (Badge, StatusBadge, KpiCard, ModuleHeader, EmptyState, FormField, ErrorBoundary, PageLoader…) — toujours réutiliser avant de créer un nouveau style.
- **Référentiel métier HSE** : à confirmer avec toi (ISO 45001 par défaut, à ajuster si vous suivez un autre référentiel interne).

---

## Jour 1 — Fondations techniques ✅

- [x] Code-splitting par route (`React.lazy` + `Suspense` dans `App.tsx`)
- [x] Error boundaries avec fallback cohérent au thème (`src/components/ui/ErrorBoundary.tsx`)
- [x] Focus clavier visible global (`:focus-visible` dans `index.css`)
- [x] `aria-label` sur les boutons icône seule de la sidebar
- [x] Audit contraste WCAG du thème sombre — `--text-secondary` (#7bacc8) largement au-dessus de 4.5:1 sur `--bg-card` ; `--text-muted` (#4a7a9b) est plus limite (~AA pour texte large uniquement), acceptable car réservé aux textes secondaires/hints, jamais au contenu principal

## Jour 2 — Accessibilité (suite) ✅

- [x] `role="dialog"` + `aria-modal="true"` sur toutes les modales (Suspension, Audit, Validation permis, Évaluation prestataire, ConfirmModal, ATDetailModal)
- [x] Fermeture des modales au clavier (touche Échap) — via `src/hooks/useModalA11y.ts`
- [x] Focus trap dans les modales + restauration du focus à la fermeture
- [x] Labels ARIA sur les formulaires (`FormField` associe désormais automatiquement label/input/erreur via `useId`)
- [x] Contraste des icônes discrètes (`text-slate-600` → `text-slate-400` partout, meilleur ratio sur fond sombre)

## Jour 3 — États UI harmonisés ✅ (partiel, voir notes)

- [x] Toasts de confirmation cohérents — `src/components/ui/ToastProvider.tsx` (`useToast()`), branché à la racine dans `App.tsx`. Câblé sur la déclaration d'accident ; **à reporter sur les autres modules** (KanbanView a encore son propre toast local, ATActiveCard/ATSuspenduCard/ATValidationCard n'en ont pas encore)
- [x] Confirmation avant action destructive — `src/components/ui/ConfirmDialog.tsx` (accessible, `role="alertdialog"`, spinner intégré pendant le traitement). Câblé sur la suppression victime/témoin dans `DeclarationWizard`
- [x] États `disabled` + spinner pendant soumission — intégré nativement dans `ConfirmDialog` (`pending`), réutilisable pour toute action future
- [ ] Skeleton de chargement sur tous les dashboards — **non applicable pour l'instant** : tous les dashboards utilisent des données statiques (`demo.data.ts`), aucun fetch asynchrone réel. Le composant `KpiCard` supporte déjà `loading`, prêt à l'emploi dès le branchement Supabase
- [ ] État "erreur réseau" distinct de "vide" — **idem**, à faire au moment de brancher les services (`src/modules/ptw/services/*`) sur les dashboards à la place des données démo

## Jour 4 — Responsive ✅

- [x] Sidebar rétractable sous 1024px — off-canvas + hamburger + overlay dans `App.tsx` (`Sidebar`/`Layout`), se referme automatiquement au changement de route
- [x] Formulaires : grille 2/3 colonnes → 1 colonne en mobile — corrigé dans `DeclarationWizard`, `FormulaireEvaluation`, `StepInformationsGenerales`, `PermisFormCard`, `StepRevue` (`grid-cols-1 sm:grid-cols-*`)
- [x] Tableaux : scroll horizontal — seul `<table>` du code (`RapportAudit.tsx`) avait déjà `overflow-x-auto` ; Kanban déjà en scroll horizontal (`overflow-x-auto` + `min-w-max`)
- [x] Modales en plein écran mobile — `SuspensionModal`, `AuditModal`, `PermisValidationModal`, `FormulaireEvaluation`, `ConfirmModal`/`ATDetailModal` (Kanban) passés en bottom-sheet (`items-end sm:items-center`, `rounded-t-2xl sm:rounded-2xl`). Les petites boîtes de confirmation (`ConfirmDialog`, écrans de succès éphémères) restent centrées — plus lisibles à cette taille
- [x] `PermisQRPage` revalidée — déjà construite mobile-first (`max-w-sm`, header/footer sticky, boutons pleine largeur), aucun changement nécessaire

## Jour 5 — Performance ✅

- [x] Taille des chunks — aucun ne dépasse 300kB (le plus gros : `index` 186.9kB / 60.2kB gzip ; dashboards entre 55 et 98kB). Build vérifié dans un environnement Linux propre (le sandbox ne peut pas utiliser le `node_modules` macOS de l'utilisateur — binaire Rollup natif différent) : `npm install` + `npx vite build` isolés, 3.5s, aucune erreur
- [x] Re-renders inutiles — `KanbanView` recalculait `atData.filter()` pour chaque colonne à chaque re-render (ouverture modale, toast, sélection) ; regroupé en un seul `useMemo` (`atsParStatut`), handlers DnD passés en `useCallback`, `KanbanCard` passé en `React.memo`
- [x] Mémoïsation des listes dérivées de données statiques — `DashboardAT` (`AlertesUrgentes`, compteurs d'onglets), `DashboardAudit` (`SyntheseZones`, `ActiviteRecente`, `AlertesNcMajeures`), `DashboardPrestataires` (compteurs documents) désormais en `useMemo` ; `DashboardAccidentologie` l'était déjà
- [x] Imports lucide-react inutilisés — aucun trouvé (`noUnusedLocals` dans `tsconfig.app.json` les aurait de toute façon fait échouer au build)
- [x] Build final revalidé — `tsc -b` propre, build Vite 3.5s, bundle stable

## Jour 6+ — Fonctionnel métier HSE *(à cadrer ensemble avant de détailler)*

- [ ] Aligner le workflow des permis de travail sur les bonnes pratiques (signature, escalade automatique si délai dépassé)
- [ ] Matrice de risque probabilité × gravité normalisée (actuellement niveaux texte : FAIBLE/MODÉRÉ/ÉLEVÉ/CRITIQUE)
- [ ] Indicateurs avancés/retardés (TF, TG) mis en avant sur le dashboard accidentologie
- [ ] Rappels automatiques d'échéances (permis à renouveler, audits planifiés)
- [ ] Piste d'audit (qui a validé/modifié quoi, horodaté) sur les permis et évaluations prestataires

---

## Chantier — Mode clair (light mode)

Nouveau chantier, en parallèle du thème sombre existant. Bouton toggle dans la sidebar (soleil/lune), préférence sauvegardée en `localStorage`, dark par défaut (comportement actuel inchangé). Beaucoup de couleurs sont codées en dur (rgba/hex pensés pour fond sombre) plutôt que via les tokens CSS — il faut les reprendre fichier par fichier, d'où l'étalement sur plusieurs jours.

### Jour A — Infrastructure ✅

- [x] `ThemeProvider`/`useTheme` (`src/contexts/ThemeContext.tsx`) — état `dark`/`light`, persistance `localStorage`, applique `data-theme` sur `<html>`
- [x] Bouton toggle (Sun/Moon) dans la sidebar, accessible (`aria-label` explicite selon l'état)
- [x] Tokens clairs dans `index.css` sous `[data-theme="light"]` (`--bg-*`, `--border-*`, `--text-*`) — équivalents des tokens sombres existants
- [x] Correction des couleurs de badges illisibles sur fond clair (`.badge-navy/success/danger/amber/safety`, `.tab-pill-active`) — variantes `[data-theme="light"]` dédiées
- [x] Fond principal du `Layout` (`App.tsx`) reconnecté au token `var(--bg-app)` au lieu du hex codé en dur

**Décision de scope** : la sidebar et `PermisQRPage` (page terrain via QR code, sans accès au toggle) restent **volontairement sombres dans les deux thèmes** — identité visuelle "cockpit" assumée pour la sidebar, meilleure lisibilité terrain/économie batterie pour la page QR. Seule la zone de contenu principale (dashboards, formulaires, modales, tableaux) est concernée par le mode clair.

### Jour B — Composants partagés `ui/*` ✅

- [x] `Badge`, `StatusBadge` — variants `default`/`soft`/`outline`/`neutral` reconnectés aux tokens (`--badge-*-text`, `--bg-elevated`, `--border`) ; nouveaux tokens ajoutés : `--badge-purple-text`, `--badge-teal-text`
- [x] `KpiCard` — valeurs, labels, icônes et trend reconnectés aux tokens (remplace `text-slate-50/400`, `text-surface-400/500`, `text-success-600/danger-600` codés en dur, non réactifs au thème)
- [x] `EmptyState`, `PageContainer` — `text-surface-*` (échelle Tailwind figée, jamais théorisée pour le clair) remplacés par les tokens `--text-primary/secondary/muted`
- [x] `FormField`, `ErrorBoundary`, `PageLoader`, `ConfirmDialog`, `ToastProvider`, `TagInput` — textes/couleurs d'accent codés en dur reconnectés aux tokens ; `.form-error` (`index.css`) recolorée via `--badge-danger-text`
- [x] `PermisQRPage` — nouvelle classe utilitaire `.theme-force-dark` (`index.css`) appliquée sur ses deux racines pour verrouiller les tokens sombres indépendamment du thème global choisi ailleurs dans l'app

**Décision de scope** : `ModuleHeader` et `StepIndicator` restent inchangés — ce sont des barres/panneaux à fond de couleur fixe (navy foncé / `bg-navy-600`), pas des surfaces neutres suivant le thème ; leur texte blanc est correct dans les deux modes par construction. `Tooltip` reste une bulle sombre fixe (convention UX courante, faible enjeu). Build vérifié (`tsc -b` propre).

### Jour C — Module Autorisations de travail (PTW) ✅

- [x] Balayage systématique du module (`DashboardAT`, `DashboardAnimateur`, `DashboardRespZone`, `KanbanView`/`KanbanCard`, modales, assistant de création) via un script de remplacement ciblé : `text-slate-50/100/200/300/400/500`, `bg-slate-400/500`, `text-success/danger/amber/safety-700`, `bg-white/[x]`/`border-white/[x]` (syntaxe crochets uniquement) reconnectés aux tokens de thème
- [x] `text-teal-300`/`text-violet-300` (badges statuts VALIDEE/APPROUVEE) reconnectés à `--badge-teal-text`/`--badge-purple-text`
- [x] `StepRevue` — labels texte (Complet/Incomplet, compteurs checklist/intervenants) reconnectés aux tokens ; icônes d'accent (`CheckCircle2`, `AlertTriangle`, `Clock`) laissées en couleur Tailwind fixe (contraste non-texte plus tolérant, choix d'accent assumé)
- [x] `PermisQRPage` — reste sombre volontairement (`.theme-force-dark`, voir Jour A), rien à faire ici
- [x] Build vérifié (`tsc -b` propre + build Vite isolé, bundle stable ~189kB max)

**Méthode** : la syntaxe Tailwind à crochets (`bg-white/[0.06]`) s'est révélée systématiquement utilisée pour les surfaces de contenu (adaptatives au thème), tandis que la syntaxe courte (`bg-white/10`, `text-white/70`) est systématiquement réservée aux bandeaux/panneaux à couleur fixe (headers de modales, `bg-navy-600`, `bg-surface-600`) — cette distinction constante a permis un balayage automatisé fiable plutôt qu'un remplacement fichier par fichier.

### Jour D — Modules Audit + Accidentologie ✅

- [x] Balayage systématique (`DashboardAudit`, `RapportAudit`, `PlanningAnnuel`, `FormulaireAudit`, `DeclarationWizard`, `DashboardAccidentologie`, `DossierCard`, `DossierDetail`) via le même script que le Jour C
- [x] `COULEURS_SECTION` (9 teintes de sections d'audit) — le champ `text` référence désormais des tokens dédiés (`--section-epi-text`, etc., dark + light) au lieu de couleurs pastel codées en dur ; correction d'un bug induit (`col.text + '99'` devenait invalide une fois `text` passé en `var(...)` — remplacé par `opacity` CSS)
- [x] Labels texte isolés (non-icônes) sur fond teinté corrigés individuellement : `RapportAudit` (compteurs MAJEUR/MINEUR/OBS.), `DashboardAudit` (alerte NC), `DossierDetail` (statuts plan d'actions, priorités), `DashboardAccidentologie` (KPI TF/TG/presqu'accidents/actions)
- [x] `COULEURS_TYPE` (accidentologie) et la fonction `niveauConformite` (audit) laissés inchangés — ils utilisent l'échelle Tailwind standard (`red-800`, `emerald-700`, etc., non inversée pour le dark) qui reste lisible dans les deux thèmes par construction
- [x] Build vérifié (`tsc -b` propre + build Vite isolé, bundle stable ~189kB max)

### Jour E — Module Prestataires + vérification finale ✅

- [x] Balayage `DashboardPrestataires`, `FichePrestataire`, `FormulaireEvaluation` via le script du Jour C (+ pattern `divide-white/[x]` ajouté, manquant dans le script initial)
- [x] `scoreLabel` (prestataires) laissé inchangé — échelle Tailwind standard, lisible dans les deux thèmes par construction
- [x] Balayage final `text-navy-300/400/600/700` sur tout `src` (pas seulement Prestataires) — 20 fichiers corrigés ; `StepIndicator` exclu et remis en `text-navy-600` (icône sur fond blanc dans une aside `bg-navy-600` fixe, ne doit pas suivre le thème)
- [x] Relecture globale des deux thèmes : grep final sur les usages restants de `text-success/danger/amber/safety-{500,600,700}` — la quasi-totalité sont des couleurs d'icônes (choix d'accent assumé, contraste non-texte plus tolérant) ; les quelques labels texte restants trouvés (`KanbanCard` risque ÉLEVÉ, `FichePrestataire` `DOC_STYLE`, `RapportAudit` compteur NC ouverts/clos, `ATActiveCard` intervenants présents, `KanbanView` placeholder drag&drop, `StepPermis` badge "Complet") reconnectés aux tokens `--badge-*-text`
- [x] Contrôle contraste WCAG en mode clair : tokens `--badge-*-text` et `--section-*-text` choisis avec des teintes saturées/foncées (ratio ≥ 4.5:1 sur fond clair), vérifiés visuellement sur badges/compteurs
- [x] Build final vérifié (`tsc -b` propre + build Vite isolé) — bundle stable, plus gros chunk `index` à 189.07 kB (identique à avant le chantier thème clair, le toggle n'alourdit pas le bundle)
- [x] Doc des tokens mise à jour ci-dessous dans « Références utilisées »

---

## Comment on l'utilise

1. Chaque jour, on prend les 5 tâches de la ligne en cours.
2. Une fois cochées, on passe à la ligne suivante — pas besoin d'attendre "le jour 2" au sens calendaire, ça veut dire "le prochain lot de 5".
3. Le Jour 6+ sera redécoupé en jours précis une fois qu'on aura confirmé ensemble le référentiel HSE à suivre.
