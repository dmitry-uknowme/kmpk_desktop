// @ts-nocheck
import styles from "./index.module.sass";
import io from "socket.io-client";
import { useContext, useEffect, useRef, useState } from "react";
import TimerIcon from "../../../public/timer_icon.png";
import PauseIcon from "@mui/icons-material/Pause";
import PlayIcon from "@mui/icons-material/PlayArrow";
import { toast } from "react-toastify";
import DevicesListContext from "@/context/DevicesListContext";

const socket = io("ws://localhost:8081");

export interface IDevice {
  number: number;
  address: string;
  type: "Hydro" | "Ground";
  isConnected: boolean;
  isWorking: boolean;
  isPaused: boolean;
  h2: string;
  Lat: string;
  Long: string;
  moi: string;
  ph: string;
  temp: string;
  // gps: { N: string; E: string };
  pointNumber: number;
  isWaiting: boolean;
  // workingTime: string;
}

const DeviceCard: React.FC<IDevice> = ({
  number,
  address,
  isConnected,
  isWaiting,
  isWorking,
  isPaused,
  h2,
  Lat,
  Long,
  moi,
  ph,
  temp,
  type,
  pointNumber,
  // workingTime,
}) => {
  const [data, setData] = useState<IDevice>();
  const [workingTime, setWorkingTime] = useState(0);
  const { devicesList, setDevicesList } = useContext(DevicesListContext);
  //const [isConnected, setIsConnected] = useState(false);
  const timerRef = useRef();
  const [awaitTime, setAwaitTime] = useState(0);
  const awaitTimer = useRef();
  //const [isWaiting, setIsWaiting] = useState<boolean>(false);
  //const [isPaused, setIsPaused] = useState<boolean>(false);

  useEffect(() => {
    clearInterval(awaitTimer, awaitTimer.current);

    awaitTimer.current = setInterval(() => {
      setAwaitTime((state) => (state += 1));
    }, 1000);
    // tryConnectDevice()
    // setTimeout(
    //   () =>
    //     !devicesList.find((d) => d.address === address).isConnected &&
    //     tryConnectDevice(),
    //   1500
    // );
  }, []);

  const tryConnectDevice = () => {
    devicesList.map((device) => {
      socket.emit("UI:DEVICE_TRY_CONNECT", { address: address });
      setDevicesList((state) => [
        ...state.filter((d) => d.address !== device.address),
        {
          ...state.find((d) => d.address === device.address),
          isWaiting: true,
        },
      ]);
    });
  };

  // const tryConnectDevice = () => {
  //   socket.emit("UI:DEVICE_TRY_CONNECT", { address });
  //   //setIsWaiting(true);
  // };

  const tryDisconnectDevice = () => {
    socket.emit("UI:DEVICE_TRY_DISCONNECT", { address: address });
    setDevicesList((state) => [
      ...state.filter((d) => d.address !== address),
      {
        ...state.find((d) => d.address === address),
        isWaiting: true,
      },
    ]);
    // socket.emit("UI:DEVICE_TRY_DISCONNECT", { address });
    //setIsWaiting(true);
  };

  useEffect(() => {
    if (!isConnected) {
    }
    socket.on("UI:DEVICE_DATA_RECIEVE", (data) => {
      //if (!isConnected && !isWaiting) setIsConnected(true);
      if (data.address === address && !isPaused) {
        // console.log("dataaa", data);
        setAwaitTime(0);
        clearInterval(awaitTimer.current);
        awaitTimer.current = setInterval(() => {
          setAwaitTime((state) => (state += 1));
        }, 1000);

        setData((state) => ({
          ...state,
          ...data.data,
          pointNumber: data.pointNumber,
        }));
      }
      // console.log("dataaaaa", data);
    });
    // socket.on("UI:DEVICE_CONNECTED", (data) => {
    //   if (data.address === address) {
    //     socket.emit("UI:DEVICE_NEW_POINT", { address });
    //     //console.log("cn", data, { ...data, pointNumber: data.pointNumber });
    //     setData((state) => ({ ...state, pointNumber: data.pointNumber }));
    //     // setData((state) => ({ ...state }));
    //     //setIsConnected(true);
    //     //setIsWaiting(false);
    //     //setIsPaused(false);
    //   }
    // });
    // socket.on("UI:DEVICE_DISCONNECTED", (data) => {
    //   if (data.address === address) {
    //     //setIsWaiting(false);
    //     //console.log("ddddddd", address);
    //     toast.error(
    //       "Невозможно подключиться к устройству с адресом " + data.address
    //     );
    //     //setIsConnected(false);
    //     //setIsWaiting(false);
    //   }
    //   clearInterval(timerRef.current);
    //   timerRef.current = setInterval(() => {
    //     setWorkingTime((state) => (state += 1));
    //   }, 1000);
    //   if (awaitTime > 30000) {
    //     console.log("больше 30 сек нет данных");
    //     tryConnectDevice();
    //   }
    // });

    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    setWorkingTime(0);
    clearInterval(timerRef.current);
    if (isConnected && !isPaused) {
      timerRef.current = setInterval(() => {
        setWorkingTime((state) => (state += 1));
      }, 1000);
    }
    // if (!isConnected) {
    //   setIsPaused(true);
    // }
    return () => clearInterval(timerRef.current);
  }, [isConnected, isPaused]);

  useEffect(() => {
    if (!isPaused && isConnected) {
      setWorkingTime(0);
      setData({});
    }
  }, [isPaused]);

  return (
    <div className={`card ${styles.deviceCard}`}>
      <div className="card-header d-flex" style={{ background: "inherit" }}>
        <div className="d-flex justify-content-space-between align-items-center">
          <div
            className="form-check form-switch d-flex align-items-center"
            style={{ position: "relative", paddingLeft: 0, marginLeft: 0 }}
          >
            <span
              style={{
                height: "20px",
                width: "40px",
                // marginLeft: "2.5rem",
                position: "relative",
              }}
            >
              <input
                className="form-check-input"
                type="checkbox"
                id="toggleDevice"
                checked={isConnected}
                style={{ height: 20, width: 40, paddingLeft: 0, marginLeft: 0 }}
                onChange={(e) =>
                  e.target.checked ? tryConnectDevice() : tryDisconnectDevice()
                }
                // onChange={(e) => setIsConnected((state) => !state)}
              />
              {isWaiting && (
                <div class="lds-ring">
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
              )}
            </span>

            <label
              className={`form-check-label ${styles.card__name}`}
              htmlFor="toggleDevice"
              style={{ marginLeft: "0.4rem" }}
            >
              {type === "Hydro" ? "Индикатор водорода" : "Параметры грунта"}
            </label>
          </div>

          <span className={styles.card__number}>
            {isPaused ? (
              <span
                onClick={() => {
                  isConnected &&
                    setDevicesList((state) => [
                      ...state.filter((d) => d.address !== address),
                      {
                        ...state.find((d) => d.address === address),
                        isPaused: false,
                      },
                    ]);
                  socket.emit("UI:DEVICE_NEW_POINT", { address });
                  //  socket.emit("UI:DEVICE_TRY_DISCONNECT", {
                  //    address: address,
                  //  });
                  //  setDevicesList((state) => [
                  //    ...state.filter((d) => d.address !== address),
                  //    {
                  //      ...state.find((d) => d.address === address),
                  //      isWaiting: true,
                  //    },
                  //  ]);
                }}
                style={{ cursor: "pointer" }}
              >
                <PlayIcon />
              </span>
            ) : (
              <span
                onClick={() =>
                  setDevicesList((state) => [
                    ...state.filter((d) => d.address !== address),
                    {
                      ...state.find((d) => d.address === address),
                      isPaused: true,
                    },
                  ])
                }
                style={{ cursor: "pointer" }}
              >
                <PauseIcon
                  color="#bbb"
                  style={{ marginTop: "-4px", color: "#bbb" }}
                />
              </span>
            )}
            {number}
          </span>
        </div>
      </div>
      <div className="card-body">
        <div className={styles.card__field}>
          <div className={styles.card__fieldKey}>Точка №</div>
          <div className={styles.card__fieldValue}>
            {isPaused ? "" : data?.pointNumber || "-"}
          </div>
        </div>
        <hr />

        {type === "Hydro" ? (
          <>
            <div className={styles.card__field}>
              <div className={styles.card__fieldKey}>Водород:</div>
              <div className={styles.card__fieldValue}>
                <div className="d-flex align-items-center">
                  <input
                    className="form-control"
                    style={{ width: 50, height: 26, marginRight: "0.5rem" }}
                    value={isPaused ? "" : data?.H2 || ""}
                    disabled
                  />
                  <span style={{ fontSize: "0.825rem", color: "#868686" }}>
                    PPM
                  </span>
                </div>
              </div>
            </div>
            <hr />
            <div className={styles.card__field}>
              <div className={styles.card__fieldKey}>GPS:</div>
              <div className={styles.card__fieldValue}>
                <div className="d-flex flex-column">
                  <div className="d-flex align-items-center">
                    <input
                      className="form-control"
                      style={{ height: 26, fontSize: "0.8rem" }}
                      value={
                        isPaused
                          ? ""
                          : data?.La === ""
                          ? "Нет сигнала"
                          : data?.La
                      }
                      disabled
                    />
                    <span
                      style={{
                        marginLeft: "0.3rem",
                        fontSize: "0.7rem",
                        color: "#868686",
                      }}
                    >
                      N
                    </span>
                  </div>
                  <div className="d-flex align-items-center mt-3">
                    <input
                      className="form-control"
                      style={{ height: 26, fontSize: "0.8rem" }}
                      value={
                        isPaused
                          ? ""
                          : data?.Lo === ""
                          ? "Нет сигнала"
                          : data?.Lo
                      }
                      disabled
                    />
                    <span
                      style={{
                        marginLeft: "0.3rem",
                        fontSize: "0.7rem",
                        color: "#868686",
                      }}
                    >
                      E
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className={styles.card__field}>
              <div className={styles.card__fieldKey}>pH:</div>
              <div className={styles.card__fieldValue}>
                <div className="d-flex align-items-center">
                  <input
                    className="form-control"
                    style={{ width: 60, height: 26, marginRight: "0.5rem" }}
                    value={isPaused ? "" : data?.PH || ""}
                    disabled
                  />
                </div>
              </div>
            </div>
            <hr />
            <div className={styles.card__field}>
              <div className={styles.card__fieldKey}>Температура:</div>
              <div className={styles.card__fieldValue}>
                <div className="d-flex align-items-center">
                  <input
                    className="form-control"
                    style={{ width: 80, height: 26, marginRight: "0.5rem" }}
                    value={isPaused ? "" : data?.T || ""}
                    disabled
                  />
                </div>
              </div>
            </div>
            <hr />
            <div className={styles.card__field}>
              <div className={styles.card__fieldKey}>Влажность:</div>
              <div className={styles.card__fieldValue}>
                <div className="d-flex align-items-center">
                  <input
                    className="form-control"
                    style={{ width: 80, height: 26, marginRight: "0.5rem" }}
                    value={isPaused ? "" : data?.Moi || ""}
                    disabled
                  />
                </div>
              </div>
            </div>
          </>
        )}
        <hr />
        <div className={styles.card__field}>
          <div className={`d-flex align-items-center ${styles.card__fieldKey}`}>
            <img src={TimerIcon} />
            <span style={{ marginLeft: "0.5rem" }}>Время замера:</span>
          </div>
          <div className={styles.card__fieldValue}>
            <input
              className="form-control"
              style={{ height: 26, width: 60 }}
              value={isPaused ? "" : workingTime}
              disabled
            />
          </div>
          &nbsp; сек
        </div>
      </div>
    </div>
  );
};

export default DeviceCard;
