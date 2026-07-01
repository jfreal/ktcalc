import { Col, Container, Row } from 'react-bootstrap';
import { ErrorBoundary } from 'react-error-boundary';
import { Route, Routes, useSearchParams } from 'react-router-dom';

import { CalculatorViewChoice, getViewFromUrlText } from 'src/CalculatorViewChoice';
import { centerHoriz, } from 'src/Util';
import kofiIcon from 'src/images/kofi.svg';
import FightSection from 'src/components/FightSection';
import HelpPage from 'src/components/HelpPage';
import Layout from 'src/components/Layout';
import RuleDocPage from 'src/components/RuleDocPage';
import LethalRelentlessNote from 'src/components/notes/LethalRelentlessNote';
import MysticScryBuffNote from 'src/components/notes/MysticScryBuffNote';
import ShootMassAnalysisSection from 'src/components/ShootMassAnalysisSection';
import ShootSection from 'src/components/ShootSection';
import { ShareProvider } from 'src/context/ShareContext';

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
  const [urlParams] = useSearchParams();
  // Derived fresh on every render — never cached in state — so this can never
  // disagree with AppHeader's own read of the same ?view= param.
  const currentView = getViewFromUrlText(urlParams.get('view'));

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
          <Row>
            <Col className={centerHoriz + ' p-0'} style={{fontSize: '11px'}}>
              Starred (*) items have explanations in hovertext and 'Notes' at bottom; geared (⚙️) items are advanced — tick 'Advanced' to show them.
            </Col>
          </Row>
          <Row>
            <Col className={centerHoriz + ' p-0'} style={{fontSize: '11px'}}>
              <a
                href='https://ko-fi.com/jfreal'
                target='_blank'
                rel='noopener noreferrer'
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', whiteSpace: 'nowrap' }}
              >
                <img src={kofiIcon} alt='Ko-fi' width='16' height='16' />
                buy me <s>a coffee</s> grey plastic
              </a>
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
      <Route path="*" element={<AppContent />} />
      </Route>
    </Routes>
  </ShareProvider>
);

export default App;