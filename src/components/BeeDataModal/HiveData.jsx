import React from "react";

//iconify
import { Icon } from "@iconify/react";
import DataCard from "./DataCard";
import Chart from "./Chart";

const HiveData = () => {
  const Data = [
    {
      title: "Température",
      currentValue: 30,
      unit: "°C",
      lastValue: 20,
      color: "#DC2626",
      background: "#F8D4D4",
      icon: (
        <div className="border border-red-400 h-fit p-[10px] rounded-full m-[10px]">
          <Icon
            icon={"mdi:temperature-approve"}
            className="text-[30px] text-red-600"
          />
        </div>
      ),
    },
    {
      title: "Humidité",
      currentValue: 30,
      color: "#2563EB",
      background: "#E9EFFD",
      unit: "%",
      lastValue: 20,
      icon: (
        <div className="border border-blue-400 h-fit p-[10px] rounded-full m-[10px]">
          <Icon
            icon={"material-symbols:humidity-percentage"}
            className="text-[30px] text-blue-600"
          />
        </div>
      ),
    },
    {
      title: "État de port",
      currentValue: "0",
      unit: " ",
      color: "#16A34A",
      background: "#D0EDDB",
      lastValue: "1",
      icon: (
        <div className="border border-green-400 h-fit p-[10px] rounded-full m-[10px]">
          <Icon
            icon={"ic:round-sensor-door"}
            className="text-[30px] text-green-600"
          />
        </div>
      ),
    },
    {
      title: "Poids",
      currentValue: 30,
      unit: "kg",
      color: "#9CA3AF",
      background: "#EBEDEF",
      lastValue: 20,
      icon: (
        <div className="border border-gray-400 h-fit p-[10px] rounded-full m-[10px]">
          <Icon
            icon={"material-symbols:weight"}
            className="text-[30px] text-gray-600"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="w-full ">
      <h1>
        Id: <span className="text-gray-400 !font-thin text-[22px]">123467</span>{" "}
      </h1>
      <h1>
        Stream date:
        <span className="text-gray-400 !font-thin text-[22px]">
          2022/02/23
        </span>{" "}
      </h1>
      <div className="flex flex-row justify-center flex-wrap gap-[10px] mt-[20px]">
        {Data.map((stream, index) => {
          return <DataCard key={index} stream={stream} />;
        })}
        <div className="w-full mt-[30px]">
          <div className="flex justify-between mb-[10px]">
          <h1>Historique des streams</h1>
          <select className=" border border-gray-400 rounded-md">
            <option>Last day</option>
            <option>Last 7 days</option>
            <option>Last 30 days</option>
          </select>
          </div>
          <Chart />
        </div>
      </div>
    </div>
  );
};

export default HiveData;
