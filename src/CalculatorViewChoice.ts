export enum CalculatorViewChoice {
  KtShoot = 'KtShoot',
  KtFight = 'KtFight',
  KtShootMassAnalysis = 'KtShootMassAnalysis',
}

// The canonical ?view= text for each view, and the single source of truth for
// resolving a raw ?view= param back to a view. Anything that needs to read or
// write the ?view= URL param (AppContent, AppHeader) must go through these so
// the "active view" can never disagree between the URL and the UI.
export const viewToUrlText = new Map<CalculatorViewChoice, string>([
  [CalculatorViewChoice.KtShoot, 'shoot'],
  [CalculatorViewChoice.KtFight, 'fight'],
  [CalculatorViewChoice.KtShootMassAnalysis, 'mass'],
]);

const _urlTextToView = new Map<string, CalculatorViewChoice>();
for (const [view, text] of viewToUrlText) {
  _urlTextToView.set(text, view);
  _urlTextToView.set(view, view);
  _urlTextToView.set(view.toLowerCase(), view);
}

// Resolves a raw ?view= param (any recognized alias/enum spelling, or null/absent)
// to a view, defaulting to KtShoot. Always derive the active view through this —
// never cache it in state — so the UI can't get out of sync with the URL.
export function getViewFromUrlText(raw: string | null): CalculatorViewChoice {
  if (raw === null) return CalculatorViewChoice.KtShoot;
  return _urlTextToView.get(raw) ?? CalculatorViewChoice.KtShoot;
}
