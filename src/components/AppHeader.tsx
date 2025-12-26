import React from "react";

import "src/components/AppHeader.css"
import { CalculatorViewChoice } from 'src/CalculatorViewChoice';
import ktFightIcon from 'src/images/KtFightIcon.svg';
import ktShootIcon from 'src/images/KtShootIcon.svg';
import logoSmall from 'src/images/logo-small.png';
//import ktShootMassAnalysisIcon from 'src/images/ShootMultipleTargetsIcon.svg';

type AppHeaderProps = {
  currentView: CalculatorViewChoice;
  navCallback: (navType: CalculatorViewChoice) => void;
}

// NOTE: the 'type' and 'name' on the buttons are for ac11y reasons
const AppHeader = (props: AppHeaderProps) => {
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
        disabled={props.currentView === view}
        onClick={() => props.navCallback(view)}
        >
        <img title={buttonName} src={img} alt={imgAlt} width="40" height="40" />
      </button>);
  }

  return <nav className='AppHeader'>
    <a href="/" className='AppHeader-brand'>
      <img src={logoSmall} alt='KT Calc logo' height='45' />
      <span className='AppHeader-title'>KT Calc</span>
    </a>
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
    </div>
  </nav>
};


export default AppHeader;