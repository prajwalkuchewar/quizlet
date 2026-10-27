import React, { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { PageLoader } from "./Loader";

const Layout = () => {
  return (
    <main className="App">
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </main>
  );
};

export default Layout;
