import React,{useEffect} from 'react'

//react-router-dom
import { useNavigate,Navigate } from "react-router-dom";


const AuthGuard = (props) => {

    const User = JSON.parse(localStorage.getItem("user"));
    const navigate = useNavigate();
  
   
      
      if (!User) {
        return <Navigate to="/login" replace={true}/>;
      }
  
  
    return <>{props.children}</>;
 
}

export default AuthGuard