import React from 'react';

export interface Props {
  showInspiration?: boolean;
}

const Credits: React.FC<Props> = (props: Props) => {
  return (
   <p>This project is forked from: 
    <a href="https://github.com/jmegner/KT21Calculator">https://github.com/jmegner/KT21Calculator</a></p>
  );
}

export default Credits;