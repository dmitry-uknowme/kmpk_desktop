// @ts-nocheck

import React, { useState, useEffect } from "react";
import io from "socket.io-client";

interface AutoSetupModalProps {
  isVisible: boolean;
  setIsVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

interface FoundDevice {
  address: string;
  type: string;
}

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
    socket.on("UI:AUTO_SETUP_ADD", (payload) => {
      setFoundDevices((state) => [...state, payload]);
    });
    socket.on("UI:AUTO_SETUP_FINISH", (payload) => {
      window.api.changeSettingsByKey(
        "devices",
        JSON.stringify(foundDevices.map((d) => ({ ...d, point_number: 0 })))
      );
    });
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
              setIsSearchStarted(true);
              socket.emit("UI:AUTO_SETUP_START", {
                hydro: searchDevicesCount.hydro,
                ground: searchDevicesCount.ground,
              });
            }}
          >
            <div className="modal-body">
              {isSearchStarted ? (
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
                            foundDevices?.filter((d) => d.type === "Hydro")[num]
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
                            foundDevices.filter((d) => d.type === "Ground")[num]
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
              ) : (
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
