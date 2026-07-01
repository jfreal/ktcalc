import React from "react";
import { Container } from 'react-bootstrap';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import "src/components/AppHeader.css"
import { CalculatorViewChoice } from 'src/CalculatorViewChoice';
import ktFightIcon from 'src/images/KtFightIcon.svg';
import ktShootIcon from 'src/images/KtShootIcon.svg';
import logoSmall from 'src/images/logo-small.png';
//import ktShootMassAnalysisIcon from 'src/images/ShootMultipleTargetsIcon.svg';

type AppHeaderProps = {
  rightContent?: React.ReactNode;
}

// The ?view= text the calculator route understands for each view.
const viewToText = new Map<CalculatorViewChoice, string>([
  [CalculatorViewChoice.KtShoot, 'shoot'],
  [CalculatorViewChoice.KtFight, 'fight'],
  [CalculatorViewChoice.KtShootMassAnalysis, 'mass'],
]);

// Collapse any ?view= spelling (enum value or short alias) to its short text.
function normalizeViewText(raw: string): string {
  const s = raw.toLowerCase();
  if (s.includes('fight')) return 'fight';
  if (s.includes('mass')) return 'mass';
  return 'shoot';
}

// NOTE: the 'type' and 'name' on the buttons are for ac11y reasons
const AppHeader = (props: AppHeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // A view is only "active" on the calculator route; other pages highlight nothing.
  const onCalculator = location.pathname === '/';
  const activeText = onCalculator ? normalizeViewText(params.get('view') ?? 'shoot') : '';

  function makeButton(
    view: CalculatorViewChoice,
    buttonName: string,
    img: any,
    imgAlt: string,
  ) : React.HTMLProps<HTMLButtonElement> {
    const text = viewToText.get(view) as string;
    return (
      <button
        type="button"
        name={buttonName}
        disabled={activeText === text}
        onClick={() => navigate(`/?view=${text}`)}
        >
        <img title={buttonName} src={img} alt={imgAlt} width="40" height="40" />
      </button>);
  }

  return <nav className='AppHeader'>
    <Container className='AppHeader-container'>
      <div className='AppHeader-left'>
        <Link to="/" className='AppHeader-brand'>
          <img src={logoSmall} alt='KT Calc logo' height='45' />
          <span className='AppHeader-title'>KT Calc</span>
        </Link>
        <div className='AppHeader-nav'>
        {makeButton(
          CalculatorViewChoice.KtShoot,
          'Kill Team Shoot Calculator',
          ktShootIcon,
          'Kill Team ranged weapon icon',
        )}
        {makeButton(
          CalculatorViewChoice.KtFight,
          'Kill Team Fight Calculator',
          ktFightIcon,
          'Kill Team melee weapon icon',
        )}
        {/*makeButton(
          CalculatorViewChoice.KtShootMassAnalysis,
          'Kill Team Shooting Mass Analysis',
          ktShootMassAnalysisIcon,
          'Multiple people targeted.',
        )*/}
        <Link
          to="/help"
          className="AppHeader-help"
          title="How KT Calc works"
        >
          How it works
        </Link>
        </div>
      </div>
      {props.rightContent && <div className='AppHeader-right'>{props.rightContent}</div>}
    </Container>
  </nav>;
};


export default AppHeader;
