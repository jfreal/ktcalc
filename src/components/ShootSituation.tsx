import React from 'react';

import ShootOptions from 'src/ShootOptions';
import AttackerControls from "src/components/AttackerControls";
import DefenderControls from "src/components/DefenderControls";
import ShootOptionControls from 'src/components/ShootOptionControls';
import ShootResultsDisplay from 'src/components/ShootResultsDisplay';

import Model from 'src/Model';
import * as Util from "src/Util";

export interface Props {
  attacker: Model;
  setAttacker: Util.Accepter<Model>;
  defender: Model;
  setDefender: Util.Accepter<Model>;
  shootOptions: ShootOptions;
  setShootOptions: Util.Accepter<ShootOptions>;
  saveToDmgToProb: Map<number,Map<number,number>>;
}

// The three blocks (attacker+rounds, defender, results) flow as wrapping flex
// items so they fill the panel's *actual* width. Panel width here is not
// monotonic with the viewport (each situation is ~608px when the two sit side
// by side on wide screens, but ~713px+ when they stack on a tablet), so media
// queries can't size this -- flex-wrap reacting to real available width can.
// Wide panel: all three sit in a row. Medium: results wraps below and grows to
// fill. Narrow/mobile: everything stacks. `justify-content: center` keeps any
// leftover space balanced on both sides instead of pooling on the right.
export const ShootSituation: React.FC<Props> = (props: Props) => {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: '8px 16px',
      }}
    >
      {/* Plain-div flex items: react-bootstrap's <Container> carries `margin: 0
          auto`, and an auto side-margin on a flex item swallows the free space
          (pushing items apart) and defeats justify-content. Wrapping each block
          in a bare div makes the div the flex item; the inner container's auto
          margins then just center it harmlessly within the wrapper. */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <AttackerControls attacker={props.attacker} changeHandler={props.setAttacker} />
        <ShootOptionControls shootOptions={props.shootOptions} changeHandler={props.setShootOptions} />
      </div>
      <div>
        <DefenderControls defender={props.defender} changeHandler={props.setDefender} />
      </div>
      <div style={{ flex: '1 1 320px', minWidth: '280px', maxWidth: '560px' }}>
        <ShootResultsDisplay saveToDmgToProb={props.saveToDmgToProb} defender={props.defender} />
      </div>
    </div>
  );
};
