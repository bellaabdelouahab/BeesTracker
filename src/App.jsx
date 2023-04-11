import { useEffect, useState } from "react";

import "./App.css";

// react-router-dom
import { Routes, Route} from "react-router-dom";

//components
import Map from "./components/Map";
import Nav from "./components/Nav";
import Notifications from "./components/Notifications";
import Profile from "./components/Profile";

//pages
import Login from "./pages/Login";

//react-router-dom
import { Outlet } from "react-router-dom";

//guard
import AuthGuard from "./guards/AuthGuard";

const ContainerApp = (props) => {
  const [isNavDisplayed, setIsNavDisplayed] = useState(true);
  const ToggleNav = () => setIsNavDisplayed((prev) => !prev);

 
  return (
    <>
      <Nav ToggleNav={ToggleNav} isNavDisplayed={isNavDisplayed} />
      <div id="layout" style={{marginLeft:isNavDisplayed && window.innerWidth>400 ? "80px" : "0px"}}>
        <Outlet />
      </div>
    </>
  );
};

function App() {
  return (
    <>
      <Routes>
      
        <Route path="/login"  element={<Login />}></Route>
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
