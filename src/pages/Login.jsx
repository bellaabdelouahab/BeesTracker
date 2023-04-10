import React from "react";

const Login = () => {
  const inputClass =
    "outline-none w-full border border-gray-400 rounded-md p-[4px] text-gray-400 !font-thin !font-mono focus:border-[#FFEB3B]";

  return (
    <div className="font-arial   flex justify-center items-center w-[100vw] h-[100vh] bg-cover bg-beeFarm">
      <div className="w-[90vw] sm:w-[400px] h-[300px] bg-white rounded-md flex flex-col justify-center items-start gap-[10px] px-[10px] sm:px-[40px]">
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
            <label>Password</label>

            <br />
            <input
              type="password"
              className={inputClass}
              placeholder="password"
            />
          </div>

          <button className="text-center w-full bg-[#FFEB3B] text-white my-[10px] rounded-xl p-[5px]">
            Connect{" "}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
