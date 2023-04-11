import React from "react";

const Profile = () => {
  const inputClass =
    "mt-[5px] mb-[8px] outline-none w-[250px] border border-gray-400 rounded-md p-[5px] text-gray-400 !font-thin !font-mono focus:border-secondary-green";

  return (
   <div className="w-full flex justify-center items-center">
    <div className="p-[20px] mt-[100px] mb-[20px] border border-gray-500 rounded-md w-[90%]">
      <div className="flex flex-col justify-center  h-full">
        <h1 className="text-[40px] mb-[10px]">Profile</h1>
        <div className="w-full flex sm:w-[80%] justify-start flex-wrap gap-[40px]  ">
          <div
            className={`text-[40px] bg-secondary-green grid justify-center items-center w-[100px] h-[100px] text-white rounded-full`}
          >
            MM
          </div>
          <div className="w-full sm:w-[80%] flex flex-row flex-wrap  items-center content-stretch gap-[10px]">
            <div>
              <label className="mr-[10px] text-[14px]">Email:</label>
              <br />
              <input className={inputClass} type="text" defaultValue={"moulaymohamed@gmail.com"}></input>
            </div>
            <div>
              <label className="mr-[10px] text-[14px]">First Name:</label>
              <br />
              <input className={inputClass} type="text" defaultValue={"Mohamed"}></input>
            </div>
            <div>
              <label className="mr-[10px] text-[14px]">Last Name:</label>
              <br />
              <input className={inputClass} type="text" defaultValue={"Moulay"}></input>
            </div>
            <div className="w-[250px] flex justify-end sm:justify-start items-center mt-[20px]">
              <button className="text-white bg-secondary-green px-[10px] h-[33px] rounded-md">
                Update
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default Profile;
