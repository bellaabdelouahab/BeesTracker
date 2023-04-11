import PropTypes from "prop-types";

import React from "react";

const NotificationItem = (props) => {
  const bgColors = ["", "#f44336", "#FFEB3B", "#2CB97D"];

  return (
    <div className="flex flex-row gap-[10px] border border-gray-400 rounded-md w-full p-[20px]">
      <div
        className={
          `grid justify-center items-center w-[50px] h-[50px]  text-white rounded-sm bg-[` +
          bgColors[Math.ceil(Math.random() * 3)] +
          "]"
        }
      >
        {props.hiveId}
      </div>
      <div>
        <h1>{props.description}</h1>
        <p className="text-[15px] text-gray-300 !font-thin">{props.time} ago</p>
      </div>
    </div>
  );
};

export default NotificationItem;

NotificationItem.propTypes = {
  description: PropTypes.string,
  time: PropTypes.string,
  hiveId: PropTypes.string,
};
