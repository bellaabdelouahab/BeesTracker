import React from "react";

// react-router-dom
import { Link } from "react-router-dom";

const Login = () => {
  const inputClass =
    "mt-[5px] mb-[8px] outline-none w-full border border-gray-400 rounded-md p-[4px] text-gray-400 !font-thin !font-mono focus:border-[#FFEB3B]";

  //bg-cover bg-beeFarm
  // linear-gradient(to top, rgba(255,0,0,0), #646464)
  return (
    <>
    <div className="font-arial flex justify-center items-center w-[100vw] h-[100vh] bg-cover bg-[bottom] bg-[url('./assets/images/beeBackground.jpg')]">
      <div className="z-[100] w-[90vw] sm:w-[400px] h-[300px] bg-white rounded-md flex flex-col justify-center items-start gap-[10px] px-[10px] sm:px-[40px]">
        <h1 className="text-[25px] font-bold">Log In</h1>
        <form className="w-full">
          <div>
            <label>Email</label>
            <br />

            <input
              type="text"
              className={inputClass}
              placeholder="email"
            ></input>
          </div>
          <div>
            <label >Password</label>
            
            <input
              type="password"
              className={inputClass}
              placeholder="password"
            />
          </div>

          <Link to="/map" className="block text-center w-full bg-[#FFEB3B] text-white my-[10px] rounded-xl p-[5px]">
            Connect
          </Link>
        </form>
      </div>
    </div>
    <div className="fixed top-[0px] left-[0px] w-[100vw] h-[100vh] bg-gradient-to-b from-[rgba(255,0,0,0)] to-[#000000]">

    </div>
    </>
  );
};

export default Login;
