import React from "react";
import { Container } from 'react-bootstrap';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import "src/components/AppHeader.css"
import { CalculatorViewChoice, calculatorViewLocation, getCalculatorView } from 'src/CalculatorViewChoice';
import ktFightIcon from 'src/images/KtFightIcon.svg';
import ktShootIcon from 'src/images/KtShootIcon.svg';
import logoSmall from 'src/images/logo-small.png';
//import ktShootMassAnalysisIcon from 'src/images/ShootMultipleTargetsIcon.svg';

type AppHeaderProps = {
  rightContent?: React.ReactNode;
  // Whether a calculator route ('/' or '/fight') is the one currently showing.
  // Passed down from Layout (which already knows the route) rather than
  // re-derived here, so there is one place that decides "are we on the calculator".
  onCalculator: boolean;
}

// NOTE: the 'type' and 'name' on the buttons are for ac11y reasons
const AppHeader = (props: AppHeaderProps) => {
  const location = useLocation();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  // A view is only "active" on the calculator route; other pages highlight nothing.
  // `/fight` is the fight calculator (no ?view= required).
  const activeView = props.onCalculator ? getCalculatorView(location.pathname, params.get('view')) : null;

  function makeButton(
    view: CalculatorViewChoice,
    buttonName: string,
    label: string,
    img: any,
    imgAlt: string,
  ) : React.HTMLProps<HTMLButtonElement> {
    return (
      <button
        type="button"
        name={buttonName}
        title={buttonName}
        // Explicit accessible name: the visible label is hidden on phones, and
        // the icon alt text describes the picture, not the action.
        aria-label={buttonName}
        className='AppHeader-view'
        disabled={activeView === view}
        onClick={() => {
          // Merge into the existing params rather than replacing the query
          // string outright, so switching views doesn't clobber shared
          // calculator state (a1/d1/fa/fb/etc.) already in the URL.
          // Fight goes to /fight; that path is what unfurls as the fight calculator.
          navigate(calculatorViewLocation(view, params.toString()));
        }}
        >
        <img src={img} alt={imgAlt} width="26" height="26" />
        <span className='AppHeader-view-label'>{label}</span>
      </button>);
  }

  return <nav className='AppHeader'>
    <Container className='AppHeader-container'>
      <Link to="/" className='AppHeader-brand'>
        <img src={logoSmall} alt='KT Calc logo' height='36' />
        <span className='AppHeader-title'>KT Calc</span>
      </Link>
      <div className='AppHeader-views' role='group' aria-label='Calculator'>
        {makeButton(
          CalculatorViewChoice.KtShoot,
          'Kill Team Shoot Calculator',
          'Shoot',
          ktShootIcon,
          'Kill Team ranged weapon icon',
        )}
        {makeButton(
          CalculatorViewChoice.KtFight,
          'Kill Team Fight Calculator',
          'Fight',
          ktFightIcon,
          'Kill Team melee weapon icon',
        )}
        {/*makeButton(
          CalculatorViewChoice.KtShootMassAnalysis,
          'Kill Team Shooting Mass Analysis',
          'Mass',
          ktShootMassAnalysisIcon,
          'Multiple people targeted.',
        )*/}
      </div>
      <Link
        to="/help"
        className="AppHeader-help"
        title="How KT Calc works (opens in a new tab)"
        target="_blank"
        rel="noopener noreferrer"
      >
        How it works
        <span className="sr-only"> (opens in a new tab)</span>
      </Link>
      {props.rightContent && <div className='AppHeader-right'>{props.rightContent}</div>}
    </Container>
  </nav>;
};


export default AppHeader;
