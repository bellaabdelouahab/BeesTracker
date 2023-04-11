import { useEffect, useState } from "react";

import "./App.css";

// react-router-dom
import { Routes, Route } from "react-router-dom";

//components
import Map from "./components/Map";
import Nav from "./components/Nav";
import Notifications from "./components/Notifications";
import Profile from "./components/Profile";

//pages
import Login from "./pages/Login";

//react-router-dom
import { Outlet } from "react-router-dom";

const ContainerApp = (props) => {
  const [isNavDisplayed, setIsNavDisplayed] = useState(true);
  const ToggleNav = () => setIsNavDisplayed((prev) => !prev);

  const layOutClass = `ml-[${isNavDisplayed ? "90px" : "0px"}] text-black`;

  return (
    <>
      <Nav ToggleNav={ToggleNav} isNavDisplayed={isNavDisplayed} />
      <div className={layOutClass}>
        <Outlet />
      </div>
    </>
  );
};

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Login />}></Route>
        <Route path="/" element={<ContainerApp />}>
          <Route path="/Map" element={<Map />} />
          <Route path="/Profile" element={<Profile />}></Route>
          <Route path="/Notifications" element={<Notifications />}></Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;
