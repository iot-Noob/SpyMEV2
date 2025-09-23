// routes/MainRouteSlice.jsx
import React, { Suspense } from "react";
import { mainRoutes } from "./index";
import { Routes, Route } from "react-router-dom";

const MainRouteSlice = () => {
  return (
    <Suspense fallback={<div>Loading page...</div>}>
      <Routes>
        {mainRoutes.map((v, i) => (
          <Route key={i} path={v.path} element={<v.component />} />
        ))}
      </Routes>
    </Suspense>
  );
};

export default MainRouteSlice;
