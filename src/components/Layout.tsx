import React from 'react';
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

  const copyShareUrl = () => {
    navigator.clipboard.writeText(getShareUrl());
  };

  return (
    <>
      <Button variant="outline-light" size="sm" onClick={addParamsToUrl}>Add Share Params</Button>
      <Button variant="outline-light" size="sm" onClick={copyShareUrl}>📋 Copy Share Link</Button>
    </>
  );
};

// One header + footer wrapped around every route via <Outlet />.
const Layout: React.FC = () => {
  const location = useLocation();
  const onCalculator = location.pathname === '/';

  return (
    <>
      <AppHeader onCalculator={onCalculator} rightContent={onCalculator ? <ShareButtons /> : undefined} />
      <Outlet />
      <Footer />
    </>
  );
};

export default Layout;
