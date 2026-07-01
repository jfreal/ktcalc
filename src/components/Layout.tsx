import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { Outlet, useLocation } from 'react-router-dom';

import AppHeader from 'src/components/AppHeader';
import Footer from 'src/components/Footer';
import { useShareContext } from 'src/context/ShareContext';

// Share buttons only do something on the calculator route (they read the share
// functions the active calculator section registers), so they live in the header
// only there.
const ShareButtons: React.FC = () => {
  const { getShareUrl, addParamsToUrl } = useShareContext();
  const [copyFailed, setCopyFailed] = useState(false);

  const copyShareUrl = () => {
    navigator.clipboard.writeText(getShareUrl())
      .then(() => setCopyFailed(false))
      .catch(() => setCopyFailed(true));
  };

  return (
    <>
      <Button variant="outline-light" size="sm" onClick={addParamsToUrl}>Add Share Params</Button>
      <Button variant="outline-light" size="sm" onClick={copyShareUrl}>📋 Copy Share Link</Button>
      {copyFailed && <span style={{ color: '#ffcdd2', fontSize: '12px' }}>Copy failed — copy the URL manually</span>}
    </>
  );
};

// Routes that are NOT the calculator — everything else falls through App.tsx's
// wildcard route to the calculator, so "on calculator" is defined as "not one
// of these" rather than an exact-match on '/' (which would miss that fallback).
const NON_CALCULATOR_PATH_PREFIXES = ['/help', '/notes', '/rules'];

// One header + footer wrapped around every route via <Outlet />.
const Layout: React.FC = () => {
  const location = useLocation();
  const onCalculator = !NON_CALCULATOR_PATH_PREFIXES.some((p) => location.pathname.startsWith(p));

  return (
    <>
      <AppHeader onCalculator={onCalculator} rightContent={onCalculator ? <ShareButtons /> : undefined} />
      <Outlet />
      <Footer />
    </>
  );
};

export default Layout;
