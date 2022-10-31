import { createContext } from "react";

export enum DeviceType {
  Hydro = "Hydro",
  Ground = "Ground",
}

export interface IDevice {
  address: string;
  type: DeviceData;
  data: DeviceData;
  isWaiting: boolean;
  isConnected: boolean;
  isPaused: boolean;
}

export interface DeviceData {
  pointNumber: number;
  H2?: number;
  La: string;
  Lo: string;
  PH?: number;
  T?: number;
  Moi?: number;
}

export interface IDevicesListContext {
  devicesList: IDevice[];
  setDevicesList: React.Dispatch<React.SetStateAction<IDevice[]>>;
}

const DevicesListContext = createContext(null);

export default DevicesListContext;
