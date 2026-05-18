import React from 'react';

const Footer: React.FC = () => {
  return (
    <div style={{ fontSize: '12px', color: '#666', textAlign: 'center', padding: '16px 0', borderTop: '1px solid #ddd', marginTop: '16px' }}>
      <a href="https://github.com/jfreal/ktcalc" target="_blank" rel="noopener noreferrer">
        Open source on GitHub
      </a> — Pull requests welcome!
      <br />
      Forked from <a href="https://jmegner.github.io/KT21Calculator/" target="_blank" rel="noopener noreferrer">
        https://jmegner.github.io/KT21Calculator/
      </a>
      <br />
      <a href="/notes/lethal-relentless" target="_blank" rel="noopener noreferrer">
        Why kill chance can rise as BS gets worse with Lethal + Relentless
      </a>
    </div>
  );
};

export default Footer;
