import React,{lazy,Suspense} from 'react'
const MainRouteSlice = lazy(() => import("../routes/MainRouteSlice"));

const MainSlice = () => {
  return (
     <>
         <Suspense fallback={<div>Loading routes...</div>}>
      <MainRouteSlice />
    </Suspense>
     </>
  )
}

export default MainSlice
