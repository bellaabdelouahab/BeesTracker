import PropTypes from "prop-types";

import React from "react";

//iconify
import { Icon } from "@iconify/react";

const DataCard = ({ stream }) => {
  let streamValue;
  let previousValue;

  if (stream.title === "État de port") {
    streamValue = stream.currentValue == "1" ? "open" : "close";
    previousValue = stream.lastValue == "1" ? "open" : "close";
  } else {
    streamValue = stream.currentValue;
    previousValue = stream.lastValue;
  }

  return (
    <div className="shadow-lg hover:shadow-xl transition-all border border-gray-100 flex flex-col justify-start items-start w-[220px] p-[20px] rounded-[20px]">
      <h1 className="!font-thin teext-[20px]">{stream.title}</h1>
      <div>
        <div className="h-full flex justify-center items-center">
          {stream.icon}

          <div>
            <div>
              <h2 className="text-[10px]">current value</h2>
              <div className="text-[25px] flex flex-row items-center gap-[5px]">
                <span
                  style={{
                    display: "block",
                    color: stream.color,
                    backgroundColor: stream.background,
                    borderRadius: "10px",
                    minWidth: "40px",
                    padding: "5px",
                    textAlign: "center",
                  }}
                >
                  {streamValue}
                </span>

                <div className="flex flex-col items-center h-[50px] w-fit">
                  <span className="text-[16px]">{stream.unit}</span>
                  <div className="flex flex-row gap-[1px]">
                    {stream.title !== "État de port" && (
                      <Icon
                        icon={"ic:sharp-arrow-drop-up"}
                        className="text-primary-green text-[30px]"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <p>
                <span className="text-[10px]">previous Stream :</span>{" "}
                {previousValue}{" "}
                <span className="text-[10px]"> {stream.unit}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataCard;

DataCard.propTypes = {
  stream: PropTypes.object,
  color: PropTypes.string,
};
