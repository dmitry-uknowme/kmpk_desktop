import { useEffect, useState } from "react";
import io from "socket.io-client";
import DevicesListContext, {
  IDevice,
  IDevicesListContext,
} from "./DevicesListContext";

const socket = io("ws://localhost:8081");
const settings = window.api.getSettings();

const DevicesListContextProvider: React.FC = ({ children }) => {
  const [devicesList, setDevicesList] = useState<IDevice[]>([]);

  const tryConnectDevice = () => {
    devicesList.map((device) => {
      socket.emit("UI:DEVICE_TRY_CONNECT", { address: device.address });
      setDevicesList((state) => [
        ...state.filter((d) => d.address !== device.address),
        {
          ...state.find((d) => d.address === device.address),
          isWaiting: true,
        },
      ]);
    });
  };

  useEffect(() => {
    if (settings?.devices?.length) {
      setDevicesList(settings.devices);
    }
  }, [settings]);

  useEffect(() => {
    console.log("con");
    if (devicesList.length) {
      console.log("conn");
      setTimeout(() => tryConnectDevice(), 1500);

      // setIsWaiting(true));
    }

    socket.on("UI:DEVICE_CONNECTED", (data) => {
      console.log("connecteddddd", data);
      setTimeout(
        () =>
          setDevicesList((state) => [
            ...state.filter((d) => d.address !== data.address),
            {
              ...state.find((d) => d.address === data.address),
              isWaiting: false,
              isConnected: true,
              isPaused: false,
            },
          ]),
        100
      );
    });

    socket.on("UI:DEVICE_DISCONNECTED", (data) => {
      console.log("disconnecteddddd", data);
      setDevicesList((state) => [
        ...state.filter((d) => d.address !== data.address),
        {
          ...state.find((d) => d.address === data.address),
          isWaiting: false,
          isConnected: false,
          isPaused: true,
        },
      ]);

      // }
    });
  }, []);

  return (
    <DevicesListContext.Provider value={{ devicesList, setDevicesList }}>
      {children}
    </DevicesListContext.Provider>
  );
};

export default DevicesListContextProvider;
