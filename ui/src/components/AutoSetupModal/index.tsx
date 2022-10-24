// @ts-nocheck

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import io from "socket.io-client";

interface AutoSetupModalProps {
  isVisible: boolean;
  setIsVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

interface FoundDevice {
  address: string;
  type: string;
}

const settings = window.api.getSettings();
const socket = io("ws://localhost:8081");

const AutoSetupModal: React.FC<AutoSetupModalProps> = ({
  isVisible,
  setIsVisible,
}) => {
  const [isSearchStarted, setIsSearchStarted] = useState(false);
  const [searchDevicesCount, setSearchDevicesCount] = useState({
    hydro: 2,
    ground: 1,
  });
  const [foundDevices, setFoundDevices] = useState<FoundDevice[]>([]);

  useEffect(() => {
    if (
      foundDevices.length ===
      searchDevicesCount.hydro + searchDevicesCount.ground
    ) {
      console.log("devvvvv", foundDevices);
      window.api.changeSettingsByKey(
        "devices",
        foundDevices
          .sort((a, b) => (a.type === "Hydro" ? 1 : -1))
          .map((d, id) => ({ ...d, number: id + 1, point_number: 0 }))
      );
      toast.success("Автоматическая настройка датчиков завершена");
      setFoundDevices([]);
    }
  }, [foundDevices, searchDevicesCount]);

  useEffect(() => {
    socket.on("UI:AUTO_SETUP_ADD", (payload) => {
      //
      setFoundDevices((state) => [...state, payload]);
    });
    // socket.on("UI:AUTO_SETUP_FINISH", (payload) => {
    //   console.log("devvvvv", foundDevices);
    //   window.api.changeSettingsByKey(
    //     "devices",
    //     foundDevices.map((d) => ({ ...d, point_number: 0 }))
    //     // foundDevices
    //     //   // .sort((a, b) => (a.type === "Hydro" ? 1 : -1))
    //     //   .map((d, id) => ({ ...d, number: id + 1, point_number: 0 }))
    //   );
    //   toast.success("Автоматическая настройка датчиков завершена");
    //   setFoundDevices([]);
    // });
  }, []);

  useEffect(() => {
    setTimeout(() => {
      settings.devices.map((device) =>
        socket.emit("UI:DEVICE_TRY_DISCONNECT", {
          address: device.address,
        })
      );
    }, 500);
  }, []);

  return (
    <div className="modal modal-lg d-block">
      <div
        className="modal-overlay"
        style={{
          width: "100%",
          height: "100%",
          position: "fixed",
          top: 0,
          left: 0,
          background: "rgba(0,0,0,0.5)",
        }}
      ></div>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Автоматическая настройка датчиков</h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
              onClick={() => {
                setIsVisible(false);
              }}
            ></button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setFoundDevices([]);
              setIsSearchStarted(true);
              setTimeout(
                () =>
                  socket.emit("UI:AUTO_SETUP_START", {
                    hydro: searchDevicesCount.hydro,
                    ground: searchDevicesCount.ground,
                  }),
                1000
              );
            }}
          >
            <div className="modal-body">
              <>
                <div className="form-group">
                  <label>Количество датчиков водорода</label>
                  <input
                    type="text"
                    className="form-control"
                    value={searchDevicesCount.hydro}
                    onChange={(e) =>
                      setSearchDevicesCount((state) => ({
                        ...state,
                        hydro: parseInt(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Количество датчиков грунта</label>
                  <input
                    type="text"
                    value={searchDevicesCount.ground}
                    onChange={(e) =>
                      setSearchDevicesCount((state) => ({
                        ...state,
                        ground: parseInt(e.target.value),
                      }))
                    }
                    className="form-control"
                  />
                </div>
              </>
              {isSearchStarted && (
                <div className="mt-3">
                  <>
                    {new Array(searchDevicesCount.hydro)
                      .fill(1)
                      .map((dev, num) => (
                        <div className="form-group d-flex align-items-center mt-3">
                          <span
                            style={{ marginRight: "0.5rem", fontWeight: 700 }}
                          >
                            {num + 1}
                          </span>
                          <input
                            type="text"
                            className="form-control"
                            value={
                              foundDevices?.filter((d) => d.type === "Hydro")[
                                num
                              ]?.address
                            }
                            disabled
                            style={{ width: 200 }}
                          />
                          <span
                            className="text-success"
                            style={{ marginLeft: "0.5rem" }}
                          >
                            Водород
                          </span>
                        </div>
                      ))}
                    {new Array(searchDevicesCount.ground)
                      .fill(1)
                      .map((dev, num) => (
                        <div className="form-group d-flex align-items-center mt-3">
                          <span
                            style={{ marginRight: "0.5rem", fontWeight: 700 }}
                          >
                            {searchDevicesCount.hydro + num + 1}
                          </span>
                          <input
                            type="text"
                            className="form-control"
                            value={
                              foundDevices.filter((d) => d.type === "Ground")[
                                num
                              ]?.address
                            }
                            disabled
                            style={{ width: 200 }}
                          />
                          <span
                            className="text-success"
                            style={{ marginLeft: "0.5rem" }}
                          >
                            Грунт
                          </span>
                        </div>
                      ))}
                  </>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
                onClick={() => {
                  setIsVisible(false);
                }}
              >
                Закрыть
              </button>
              <button type="submit" className="btn btn-primary">
                Начать
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AutoSetupModal;
