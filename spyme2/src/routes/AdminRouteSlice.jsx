import React, { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { AdminRoutes } from "./index";

const AdminRouteSlice = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        {AdminRoutes.map((v, i) => (
          <Route key={i} path={v.path} element={<v.component />} />
        ))}
      </Routes>
    </Suspense>
  );
};

export default AdminRouteSlice;

