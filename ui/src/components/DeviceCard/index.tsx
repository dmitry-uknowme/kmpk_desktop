import styles from "./index.module.sass";
import io from "socket.io-client";
import { useEffect, useRef, useState } from "react";

const socket = io("ws://localhost:8081");

export interface IDevice {
  number: number;
  address: string;
  type: "Hydro" | "Ground";
  // isConnected: boolean;
  isWorking: boolean;
  h2: string;
  Lat: string;
  Long: string;
  moi: string;
  ph: string;
  temp: string;
  // gps: { N: string; E: string };
  pointNumber: number;
  // workingTime: string;
}

const DeviceCard: React.FC<IDevice> = ({
  number,
  address,
  // isConnected,
  isWorking,
  h2,
  Lat,
  Long,
  moi,
  ph,
  temp,
  type,
  pointNumber,
  mode,
  // workingTime,
}) => {
  const [data, setData] = useState<IDevice>();
  const [workingTime, setWorkingTime] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const timerRef = useRef();
  const modeTimerRef = useRef();
  const [awaitTime, setAwaitTime] = useState(0);
  const awaitTimer = useRef();
  const [manualDisconnect, setManualDisconnect] = useState(false);

  function getRandomFloat(min, max, decimals) {
    const str = (Math.random() * (max - min) + min).toFixed(decimals);
    return parseFloat(str);
  }

  useEffect(() => {
    clearInterval(awaitTimer, awaitTimer.current);

    awaitTimer.current = setInterval(() => {
      setAwaitTime((state) => (state += 1));
    }, 1000);
  }, []);

  const tryConnectDevice = () => {
    if (mode === 0) {
      socket.emit("UI:DEVICE_TRY_CONNECT", { address });
    } else {
      socket.emit("UI:DEVICE_DISCONNECTED", { address });
    }
  };

  const tryDisconnectDevice = () => {
    if (mode === 0) {
      socket.emit("UI:DEVICE_TRY_DISCONNECT", { address });
    } else {
      setManualDisconnect(true);
      socket.emit("WORKER:DEVICE_DISCONNECTED", { address });
    }
  };
  useEffect(() => {
    socket.on("UI:DEVICE_DATA_RECIEVE", (data) => {
      if (data.address === address) {
        if (!isConnected) setIsConnected(true);
        setAwaitTime(0);
        clearInterval(awaitTimer, awaitTimer.current);
        awaitTimer.current = setInterval(() => {
          setAwaitTime((state) => (state += 1));
        }, 1000);

        setData((state) => ({ ...state, ...data.data }));
      }
    });
    socket.on("UI:DEVICE_CONNECTED", (data) => {
      console.log("connectd", data);
      if (data.address === address) {
        setData((state) => ({ ...state, pointNumber: data.pointNumber }));
        // setData((state) => ({ ...state }));
        setIsConnected(true);
      }
    });
    socket.on("UI:DEVICE_DISCONNECTED", (data) => {
      if (data.address === address) {
        setIsConnected(false);
      }
    });
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setWorkingTime((state) => (state += 1));
    }, 1000);
    if (awaitTime > 30000) {
      console.log("больше 30 сек нет данных");
      tryConnectDevice();
    }
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    setWorkingTime(0);
    clearInterval(timerRef.current);
    if (isConnected) {
      // connectDevice();
      timerRef.current = setInterval(() => {
        setWorkingTime((state) => (state += 1));
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isConnected]);

  const pause = (t: number) => {
    return new Promise((resolve) =>
      setTimeout(() => {
        console.log();
        resolve();
      }, t)
    );
  };

  useEffect(() => {
    if (mode === 1) {
      modeTimerRef.current = setInterval(() => {
        // if (isConnected) {
        if (manualDisconnect) {
          setIsConnected(false);
        } else {
          setIsConnected(true);
        }
        socket.emit("WORKER:DEVICE_DATA_RECIEVE", {
          address,
          data: {
            temp: getRandomFloat(
              data?.temp ? data?.temp : 22.5,
              data?.temp ? data?.temp + 0.1 : 23,
              1
            ),
            ph: getRandomFloat(5.5, 5.8, 2),
            h2: getRandomFloat(0, 1, 2).toFixed(0),
            moi: getRandomFloat(0, 1, 2),
            Lat: "",
            Long: "",
            timestamp: 1662888683978,
          },
        });
      }, 3000 + getRandomFloat(500, 1000));
    } else {
      setIsConnected(false);
    }
    // return clearInterval(modeTimerRef.current);
  }, [mode, isConnected]);

  // useEffect(() => {
  //   if (mode === 1 && isConnected === true) {
  //     setPointNumbers1((state) => [...state.map((p) => p++)]);
  //   }
  // }, [isConnected]);

  return (
    <div className={`card ${styles.deviceCard}`}>
      <div className="card-header d-flex" style={{ background: "inherit" }}>
        <div className="d-flex justify-content-space-between">
          <div className="form-check form-switch d-flex align-items-center">
            <input
              className="form-check-input"
              type="checkbox"
              id="toggleDevice"
              checked={isConnected}
              style={{ height: 20, width: 40 }}
              onChange={(e) =>
                e.target.checked ? tryConnectDevice() : tryDisconnectDevice()
              }
              // onChange={(e) => setIsConnected((state) => !state)}
            />
            <label
              className={`form-check-label ${styles.card__name}`}
              htmlFor="toggleDevice"
              style={{ marginLeft: "0.4rem" }}
            >
              {type === "Hydro" ? "Индикатор водорода" : "Параметры грунта"}
            </label>
          </div>
          <span className={styles.card__number}>{number}</span>
        </div>
      </div>
      <div className="card-body">
        <div className={styles.card__field}>
          <div className={styles.card__fieldKey}>Точка №</div>
          <div className={styles.card__fieldValue}>
            {data?.pointNumber || "-"}
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
                    style={{ width: 40, height: 26, marginRight: "0.5rem" }}
                    value={data?.h2 || ""}
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
                      value={data?.Lat === "" ? "Нет сигнала" : data?.Lat}
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
                      value={data?.Long === "" ? "Нет сигнала" : data?.Long}
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
                    value={data?.ph || ""}
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
                    value={data?.temp || ""}
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
                    value={data?.moi || ""}
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
            <img src="timer_icon.png" />
            <span style={{ marginLeft: "0.5rem" }}>Время замера:</span>
          </div>
          <div className={styles.card__fieldValue}>
            <input
              className="form-control"
              style={{ height: 26, width: 60 }}
              value={workingTime}
              disabled
            />
          </div>
          сек
        </div>
      </div>
    </div>
  );
};

export default DeviceCard;
