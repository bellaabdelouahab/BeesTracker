import React from "react";

//components
import NotificationItem from "./NotificationItem";

const Notifications = () => {
  return (
    <div className="ml-[90px] mt-[100px] mb-[20px]">
      <div className="flex flex-col justify-center items-start h-full">
        <h1 className="text-[40px] mb-[10px]">Notifications</h1>
        <div className="w-[80%] flex flex-col gap-[10px]">
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
  );
};

export default Notifications;
