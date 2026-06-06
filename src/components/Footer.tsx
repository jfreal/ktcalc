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
      <div style={{
        maxWidth: '420px',
        margin: '16px auto',
        padding: '12px 16px',
        border: '2px solid #b8860b',
        borderRadius: '8px',
        background: 'linear-gradient(135deg, #fffaf0 0%, #fdf3df 100%)',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
        textAlign: 'left',
      }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#8a6400', marginBottom: '8px', textAlign: 'center' }}>
          ⚔️ Alternative Tools
        </div>
        <div style={{ marginBottom: '8px' }}>
          <a
            href="https://brandongreen00.github.io/ballistica-imperialis/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '14px', fontWeight: 600 }}
          >
            Ballistica Imperialis →
          </a>
          <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>
            Alternative KT math tool with preloaded weapon &amp; defence profiles and a cool design.
          </div>
        </div>
        <div>
          <a
            href="https://nemesisforge.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '14px', fontWeight: 600 }}
          >
            NemesisForge →
          </a>
          <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>
            Build your own nemesis operatives.
          </div>
        </div>
      </div>
      <a href="/notes/lethal-relentless" target="_blank" rel="noopener noreferrer">
        Why kill chance can rise as BS gets worse with Lethal + Relentless
      </a>
    </div>
  );
};

export default Footer;
