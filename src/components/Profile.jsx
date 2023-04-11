import React from "react";

const Profile = () => {
  const inputClass =
    "mt-[5px] mb-[8px] outline-none w-[250px] border border-gray-400 rounded-md p-[4px] text-gray-400 !font-thin !font-mono focus:border-secondary-green";

  return (
    <div className="ml-[90px] mt-[100px] mb-[20px]">
      <div className="flex flex-col justify-center items-start h-full">
        <h1 className="text-[40px] mb-[10px]">Profile</h1>
        <div className="flex w-[80%] justify-start gap-[40px] border border-gray-400 p-[40px] ">
          <div
            className={`text-[40px] bg-secondary-green grid justify-center items-center w-[100px] h-[100px] text-white rounded-full`}
          >
            MM
          </div>
          <div className="w-[80%] flex flex-row flex-wrap  items-center content-stretch gap-[10px]">
            <div>
              <label className="mr-[10px] text-[14px]">Email:</label>
              <br />
              <input className={inputClass} type="text"></input>
            </div>
            <div>
              <label className="mr-[10px] text-[14px]">First Name:</label>
              <br />
              <input className={inputClass} type="text"></input>
            </div>
            <div>
              <label className="mr-[10px] text-[14px]">Last Name:</label>
              <br />
              <input className={inputClass} type="text"></input>
            </div>
            <div className="w-[250px] flex justify-end items-center mt-[20px]">
              <button className="text-white bg-secondary-green px-[10px] h-[33px] rounded-md">
                Update
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
