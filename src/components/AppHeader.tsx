import React from "react";
import { Container } from 'react-bootstrap';
import { Link, useLocation, useSearchParams } from 'react-router-dom';

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

// NOTE: the aria-label on the view links is for ac11y reasons
const AppHeader = (props: AppHeaderProps) => {
  const location = useLocation();
  const [params] = useSearchParams();

  // A view is only "active" on the calculator route; other pages highlight nothing.
  // `/fight` is the fight calculator (no ?view= required).
  const activeView = props.onCalculator ? getCalculatorView(location.pathname, params.get('view')) : null;
  // Segment match, so a route like /helpful never marks the help link active.
  const onHelp = location.pathname === '/help' || location.pathname.startsWith('/help/');

  // Real links, not buttons, so crawlers can follow the header to /fight/
  // (a button's onClick is invisible to them, which left /fight/ orphaned).
  function makeViewLink(
    view: CalculatorViewChoice,
    linkName: string,
    label: string,
    img: any,
    imgAlt: string,
  ) {
    const active = activeView === view;
    return (
      <Link
        // Merge into the existing params rather than replacing the query
        // string outright, so switching views doesn't clobber shared
        // calculator state (a1/d1/fa/fb/etc.) already in the URL.
        // Fight goes to /fight/; that path is what unfurls as the fight calculator.
        to={calculatorViewLocation(view, params.toString())}
        // Re-clicking the active view must not push a duplicate history entry.
        replace={active}
        title={linkName}
        // Explicit accessible name: the visible label is hidden on phones, and
        // the icon alt text describes the picture, not the action.
        aria-label={linkName}
        aria-current={active ? 'page' : undefined}
        className={'AppHeader-view' + (active ? ' is-active' : '')}
        >
        <img src={img} alt={imgAlt} width="26" height="26" />
        <span className='AppHeader-view-label'>{label}</span>
      </Link>);
  }

  return <nav className='AppHeader'>
    <Container className='AppHeader-container'>
      <Link to="/" className='AppHeader-brand'>
        <img src={logoSmall} alt='KT Calc logo' height='36' />
        <span className='AppHeader-title'>KT Calc</span>
      </Link>
      <div className='AppHeader-views' role='group' aria-label='Calculator'>
        {makeViewLink(
          CalculatorViewChoice.KtShoot,
          'Kill Team Shoot Calculator',
          'Shoot',
          ktShootIcon,
          'Kill Team ranged weapon icon',
        )}
        {makeViewLink(
          CalculatorViewChoice.KtFight,
          'Kill Team Fight Calculator',
          'Fight',
          ktFightIcon,
          'Kill Team melee weapon icon',
        )}
        {/*makeViewLink(
          CalculatorViewChoice.KtShootMassAnalysis,
          'Kill Team Shooting Mass Analysis',
          'Mass',
          ktShootMassAnalysisIcon,
          'Multiple people targeted.',
        )*/}
      </div>
      <Link
        to="/help"
        className={'AppHeader-help' + (onHelp ? ' is-active' : '')}
        aria-current={onHelp ? 'page' : undefined}
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
