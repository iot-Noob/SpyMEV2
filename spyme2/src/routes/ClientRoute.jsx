import React, { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { ClientRoutes } from "./index";

const AdminRouteSlice = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        {ClientRoutes.map((v, i) => (
          <Route key={i} path={v.path} element={<v.component />} />
        ))}
      </Routes>
    </Suspense>
  );
};

export default AdminRouteSlice;

