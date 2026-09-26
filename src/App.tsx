import { Col, Container, Row } from 'react-bootstrap';
import { ErrorBoundary } from 'react-error-boundary';
import { Route, Routes, useLocation, useSearchParams } from 'react-router-dom';

import { CalculatorViewChoice, calculatorCanonicalPath, getCalculatorView } from 'src/CalculatorViewChoice';
import LegacyFightViewRedirect from 'src/LegacyFightViewRedirect';
import { centerHoriz, } from 'src/Util';
import FightSection from 'src/components/FightSection';
import HelpPage from 'src/components/HelpPage';
import Layout from 'src/components/Layout';
import RuleDocPage from 'src/components/RuleDocPage';
import Seo from 'src/components/Seo';
import LethalRelentlessNote from 'src/components/notes/LethalRelentlessNote';
import MysticScryBuffNote from 'src/components/notes/MysticScryBuffNote';
import PunishingNote from 'src/components/notes/PunishingNote';
import ShootMassAnalysisSection from 'src/components/ShootMassAnalysisSection';
import ShootSection from 'src/components/ShootSection';
import { ShareProvider } from 'src/context/ShareContext';

// Per-view <head> + on-page heading copy. Keyed off the same view the
// calculator switches on (`/fight`, or ?view= everywhere else), so the title,
// description, canonical, and H1 can never disagree about which tool is showing.
const VIEW_SEO: Record<CalculatorViewChoice, { title: string; description: string; h1: string }> = {
  [CalculatorViewChoice.KtShoot]: {
    title: 'Kill Team 2024 Shooting Calculator — Ranged Attack Odds | ktcalc',
    description:
      'Calculate Kill Team 2024 shooting odds. Enter BS, attacks, and weapon rules to get the chance of hits, crits, damage, and kills against any defensive profile.',
    h1: 'Kill Team 2024 Shooting Calculator',
  },
  [CalculatorViewChoice.KtFight]: {
    title: 'Kill Team 2024 Fight Calculator — Melee Combat Odds | ktcalc',
    description:
      'Calculate Kill Team 2024 fighting odds. Model the alternating strike-and-parry melee sequence between two fighters and see who is likely to win the combat.',
    h1: 'Kill Team 2024 Fight Calculator',
  },
  [CalculatorViewChoice.KtShootMassAnalysis]: {
    title: 'Kill Team 2024 Mass Analysis — Compare Weapons vs Profiles | ktcalc',
    description:
      'Compare one Kill Team 2024 attacker across many defensive profiles at once. A matrix of expected damage and kill odds for fast weapon-vs-profile matchup analysis.',
    h1: 'Kill Team 2024 Mass Matchup Analysis',
  },
};

function fallbackRender({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

const AppContent = () => {
  const location = useLocation();
  const [urlParams] = useSearchParams();
  // Derived fresh on every render — never cached in state — so this can never
  // disagree with AppHeader's own read of the same location.
  const currentView = getCalculatorView(location.pathname, urlParams.get('view'));
  const viewSeo = VIEW_SEO[currentView];
  const canonicalPath = calculatorCanonicalPath(currentView);

  function sectionDiv(
    view: CalculatorViewChoice,
    child: JSX.Element,
  ) : JSX.Element {
    return (
      <ErrorBoundary fallbackRender={fallbackRender}>
        <div style={{ display: currentView === view ? 'block' : 'none' }}>
          {child}
        </div>
      </ErrorBoundary>
    );
  }

  return (
        <Container fluid>
          <Seo title={viewSeo.title} description={viewSeo.description} path={canonicalPath} />
          <Row>
            <Col className={centerHoriz + ' p-0'} style={{ paddingTop: '6px' }}>
              <div style={{ textAlign: 'center', maxWidth: '680px' }}>
                <h1 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 2px' }}>{viewSeo.h1}</h1>
              </div>
            </Col>
          </Row>
          <Row>
            <Col className={centerHoriz + ' p-0'} style={{fontSize: '11px'}}>
              Starred (*) items have explanations in hovertext and 'Notes' at bottom; geared (⚙️) items are advanced — tick 'Advanced' to show them.
            </Col>
          </Row>
          <Row>
            <Col>
              {sectionDiv(CalculatorViewChoice.KtShoot, <ShootSection isActive={currentView === CalculatorViewChoice.KtShoot} />)}
              {sectionDiv(CalculatorViewChoice.KtFight, <FightSection isActive={currentView === CalculatorViewChoice.KtFight} />)}
              {sectionDiv(CalculatorViewChoice.KtShootMassAnalysis, <ShootMassAnalysisSection/>)}
            </Col>
          </Row>
        </Container>
  );
};

const App = () => (
  <ShareProvider>
    <Routes>
      <Route element={<Layout />}>
      <Route
        path="/notes/lethal-relentless"
        element={
          <ErrorBoundary fallbackRender={fallbackRender}>
            <LethalRelentlessNote />
          </ErrorBoundary>
        }
      />
      <Route
        path="/notes/mystic-scry-buff"
        element={
          <ErrorBoundary fallbackRender={fallbackRender}>
            <MysticScryBuffNote />
          </ErrorBoundary>
        }
      />
      <Route
        path="/notes/punishing"
        element={
          <ErrorBoundary fallbackRender={fallbackRender}>
            <PunishingNote />
          </ErrorBoundary>
        }
      />
      <Route
        path="/help"
        element={
          <ErrorBoundary fallbackRender={fallbackRender}>
            <HelpPage />
          </ErrorBoundary>
        }
      />
      <Route
        path="/rules/combat"
        element={
          <ErrorBoundary fallbackRender={fallbackRender}>
            <RuleDocPage file="COMBAT_RULES.md" />
          </ErrorBoundary>
        }
      />
      <Route
        path="/rules/fight"
        element={
          <ErrorBoundary fallbackRender={fallbackRender}>
            <RuleDocPage file="FIGHT_RULES.md" />
          </ErrorBoundary>
        }
      />
      <Route
        path="/rules/weapon"
        element={
          <ErrorBoundary fallbackRender={fallbackRender}>
            <RuleDocPage file="WEAPON_RULES.md" />
          </ErrorBoundary>
        }
      />
      <Route
        path="/rules/cover-saves"
        element={
          <ErrorBoundary fallbackRender={fallbackRender}>
            <RuleDocPage file="COVER_SAVES.md" />
          </ErrorBoundary>
        }
      />
      <Route
        path="/rules/weapon-balance"
        element={
          <ErrorBoundary fallbackRender={fallbackRender}>
            <RuleDocPage file="WEAPON_BALANCE.md" />
          </ErrorBoundary>
        }
      />
      <Route
        path="/rules/retained-vs-modified"
        element={
          <ErrorBoundary fallbackRender={fallbackRender}>
            <RuleDocPage file="RETAINED_VS_MODIFIED_DICE.md" />
          </ErrorBoundary>
        }
      />
      <Route path="*" element={<LegacyFightViewRedirect><AppContent /></LegacyFightViewRedirect>} />
      </Route>
    </Routes>
  </ShareProvider>
);

export default App;