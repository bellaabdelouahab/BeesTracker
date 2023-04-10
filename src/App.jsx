import { useState } from "react";

import "./App.css";

// react-router-dom
import { Routes, Route } from "react-router-dom";

//components
import Map from "./components/Map";
import Login from "./pages/Login";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Login />}></Route>
        <Route path="/map" element={<Map />} />
      </Routes>
    </>
  );
}

export default App;
