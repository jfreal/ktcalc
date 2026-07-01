import React from "react";
import { Container } from 'react-bootstrap';
import { Link, useSearchParams } from 'react-router-dom';

import "src/components/AppHeader.css"
import { CalculatorViewChoice, getViewFromUrlText, viewToUrlText } from 'src/CalculatorViewChoice';
import ktFightIcon from 'src/images/KtFightIcon.svg';
import ktShootIcon from 'src/images/KtShootIcon.svg';
import logoSmall from 'src/images/logo-small.png';
//import ktShootMassAnalysisIcon from 'src/images/ShootMultipleTargetsIcon.svg';

type AppHeaderProps = {
  rightContent?: React.ReactNode;
  // Whether the calculator ('/') route is the one currently showing. Passed
  // down from Layout (which already knows the route) rather than re-derived
  // here, so there is one place that decides "are we on the calculator".
  onCalculator: boolean;
}

// NOTE: the 'type' and 'name' on the buttons are for ac11y reasons
const AppHeader = (props: AppHeaderProps) => {
  const [params, setParams] = useSearchParams();

  // A view is only "active" on the calculator route; other pages highlight nothing.
  const activeView = props.onCalculator ? getViewFromUrlText(params.get('view')) : null;

  function makeButton(
    view: CalculatorViewChoice,
    buttonName: string,
    img: any,
    imgAlt: string,
  ) : React.HTMLProps<HTMLButtonElement> {
    return (
      <button
        type="button"
        name={buttonName}
        disabled={activeView === view}
        onClick={() => {
          // Merge into the existing params rather than replacing the query
          // string outright, so switching views doesn't clobber shared
          // calculator state (a1/d1/fa/fb/etc.) already in the URL.
          const next = new URLSearchParams(params);
          next.set('view', viewToUrlText.get(view) as string);
          setParams(next);
        }}
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
          title="How KT Calc works (opens in a new tab)"
          target="_blank"
          rel="noopener noreferrer"
        >
          How it works
          <span className="sr-only"> (opens in a new tab)</span>
        </Link>
        </div>
      </div>
      {props.rightContent && <div className='AppHeader-right'>{props.rightContent}</div>}
    </Container>
  </nav>;
};


export default AppHeader;
