import PropTypes from "prop-types";

import React, { useState } from "react";

//Iconify
import { Icon } from "@iconify/react";

const AlertItem = (props) => {
  const [isFormDisplayed, setIsFormDisplayed] = useState(false);

  const toggleForm = () => setIsFormDisplayed((prev) => !prev);

  const icon = isFormDisplayed
    ? "material-symbols:toggle-on-outline"
    : "material-symbols:toggle-off-outline";
  const inputClass =
    "mt-[5px] mb-[8px] outline-none w-[100px] border border-gray-400 rounded-md p-[4px] text-gray-400 !font-thin !font-mono focus:border-secondary-green";

  return (
    <div className="border border-gray-500 rounded-xl p-[10px]">
      <div>
        <div className="flex items-center gap-[5px]">
          <Icon
            icon={icon}
            className="text-[40px] text-primary-green cursor-pointer"
            onClick={toggleForm}
          />
          <h1>les alertes de {props.title}</h1>
        </div>
        {isFormDisplayed && (
          <div className="flex flex-row items-center flex-wrap gap-[10px]">
            <div>
              <label className="mr-[10px] text-[14px]">Min:</label>
              <input
                className={inputClass}
                type="text"
                placeholder={props.unit}
              ></input>
            </div>
            <div>
              <label className="mr-[10px] text-[14px]">Max:</label>
              <input
                className={inputClass}
                type="text"
                placeholder={props.unit}
              ></input>
            </div>
            <button className="text-white bg-secondary-green px-[10px] h-[33px] rounded-md">
              Set Alert
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertItem;

AlertItem.propTypes = {
  title: PropTypes.string,
  unit: PropTypes.string,
  setAlert: PropTypes.func,
};
