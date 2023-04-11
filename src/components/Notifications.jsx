import React from "react";

//components
import NotificationItem from "./NotificationItem";

const Notifications = () => {
  return (
    <div className="w-full flex justify-center items-center">
    <div className="p-[20px] mt-[100px] mb-[20px] border border-gray-500 rounded-md w-[90%]">
      <div className="flex flex-col justify-center  h-full">
        <h1 className="text-[40px] mb-[10px]">Notifications</h1>
        <div className="w-[100%] flex flex-col justify-center items-center  gap-[10px]">
          <NotificationItem
            hiveId={"R4"}
            description={"R4 has passed max of weight with 4kg"}
            time={"1h"}
          />
          <NotificationItem
            hiveId={"R1"}
            description={"R1 has passed max of Temperature with 3°C"}
            time={"2h"}
          />
          <NotificationItem
            hiveId={"R2"}
            description={"R2 has passed max of Humidity with 10%"}
            time={"3h"}
          />
          <NotificationItem
            hiveId={"R2"}
            description={"R2 has passed max of Humidity with 10%"}
            time={"3h"}
          />
          <NotificationItem
            hiveId={"R2"}
            description={"R2 has passed max of Humidity with 10%"}
            time={"3h"}
          />
          <NotificationItem
            hiveId={"R2"}
            description={"R2 has passed max of Humidity with 10%"}
            time={"3h"}
          />
        </div>
      </div>
    </div>
    </div>
  );
};

export default Notifications;
