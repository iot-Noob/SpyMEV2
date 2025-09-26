// routes/index.js
import { lazy } from "react";
const Blank = lazy(() => import("../pages/Blank"));
const AdminRouteSlice=lazy(()=>import("./AdminRouteSlice"))
const AdminConfig=lazy(()=>import("../pages/AdminConfig"))
const ClientConfig=lazy(()=>import("../pages/ClientConfig"))
const ClientRouteSlice=lazy(()=>import("./ClientRoute"))
export const mainRoutes = [
  {
    path: "/",
    component: Blank
  },
   {
    path: "/admin/*",
    component: AdminRouteSlice
  },
   {
    path: "/client/*",
    component: ClientRouteSlice
  }
];

export const AdminRoutes=[
  {
    path:"/config",
    component:AdminConfig
  }
]


export const ClientRoutes=[
  {
    path:"/config",
    component:ClientConfig
  }
]