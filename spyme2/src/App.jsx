// App.jsx
import { useState } from "react";
import { lazy, Suspense } from "react";
import "./App.css";
const MainSlice=lazy(()=>import("./pages/MainSlice"))

function App() {
  const [count, setCount] = useState(0);

  return (
    <Suspense fallback={<div>Loading routes...</div>}>
      <MainSlice/>
    </Suspense>
  );
}

export default App;
