import React from "react";

//components
import AlertItem from "./AlertItem";

const HiveAlerts = () => {
  return (
    <div className="flex flex-col gap-[10px]">
      <AlertItem title="température" unit="°C" />
      <AlertItem title="Humdité" unit="%" />
      <AlertItem title="Poids" unit="kg" />
    </div>
  );
};

export default HiveAlerts;
