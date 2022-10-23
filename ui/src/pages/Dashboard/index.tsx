// @ts-nocheck
import DeviceCard from "@/components/DeviceCard";
import { useState, useEffect, useRef, useContext } from "react";
import { Offcanvas } from "react-bootstrap";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import UserIcon from "../../../public/user_icon.png";
import SettingsIcon from "../../../public/settings_icon.png";
import ResultIcon from "../../../public/result_icon.png";
import AuthContext from "@/context/AuthContext";
import io from "socket.io-client";

const socket = io("ws://localhost:8081");

const settings = window.api.getSettings();

const DashboardPage = () => {
  const [isModalAutoSetupVisible, setIsModalAutoSetupVisible] = useState(false);
  const [autoSetupDevicesCounts, setAutoSetupDevicesCounts] = useState({
    hydro: 2,
    ground: 1,
  });
  const [autoSetupDevices, setAutoSetupDevices] = useState([]);
  const [isAutoSetupStarted, setIsAutoSetupStarted] = useState(false);
  const { auth, setAuth } = useContext(AuthContext);
  const [search, setSearch] = useSearchParams();
  const fullName = auth?.user?.full_name;
  const [isShowMenu, setIsShowMenu] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    socket.on("UI:AUTO_SETUP_ADD", (payload: string) => {
      setAutoSetupDevices((state) => [...state, JSON.parse(payload)]);
      // {
      // type: string;
      // address: string;
      // }
    });
    if (localStorage.getItem("auth")) {
      setAuth(JSON.parse(localStorage.getItem("auth")));
    } else {
      navigate("/");
    }
  }, []);

  return (
    <div className="dashboard_page">
      <Offcanvas
        show={isShowMenu}
        onHide={() => setIsShowMenu(false)}
        placement={"end"}
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Настройки</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <form>
            {settings?.devices?.map((device) => (
              <div className="mb-3">
                <label htmlFor="exampleInputEmail1" className="form-label">
                  Датчик №{device.number} (
                  {device.type === "Hydro"
                    ? "Водород"
                    : device.type === "Ground"
                    ? "Грунт"
                    : ""}
                  )
                </label>
                <input
                  type="email"
                  className="form-control"
                  id="exampleInputEmail1"
                  aria-describedby="emailHelp"
                  value={device.address}
                />
              </div>
            ))}

            <div class="mb-3">
              <label for="exampleInputEmail1" class="form-label">
                Путь для сохранения данных замеров
              </label>
              <input
                class="form-control"
                id="exampleInputEmail1"
                aria-describedby="emailHelp"
                value={settings.saveFolder}
              />
            </div>
            <div
              className="btn btn-primary w-100"
              onClick={() => {
                setIsShowMenu(false);
                setIsModalAutoSetupVisible(true);
              }}
            >
              Автоматическая настройка датчиков
            </div>
            <div className="btn btn-success mt-4 w-100">Сохранить</div>
            {/* <div class="form-check form-switch">
              <input
                class="form-check-input"
                type="checkbox"
                id="flexSwitchCheckChecked"
              />
              <label class="form-check-label" for="flexSwitchCheckChecked">
                Автоматически определить устройства
              </label>
            </div> */}

            {/* <div className="row" style={{ marginTop: "5rem" }}>
              <div className="btn btn-primary">Обновить приложение</div>
            </div> */}
          </form>
        </Offcanvas.Body>
      </Offcanvas>
      {isModalAutoSetupVisible && (
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
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Автоматическая настройка датчиков</h5>
                <button
                  type="button"
                  class="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                  onClick={() => {
                    setIsModalAutoSetupVisible(false);
                    setIsAutoSetupStarted(false);
                  }}
                ></button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setIsAutoSetupStarted(true);
                  console.log("e", e, socket);
                  socket.emit(
                    "UI:AUTO_SETUP_START",
                    JSON.stringify({
                      hydro: autoSetupDevicesCounts.hydro,
                      ground: autoSetupDevicesCounts.ground,
                    })
                  );
                }}
              >
                <div class="modal-body">
                  {isAutoSetupStarted ? (
                    <>
                      {new Array(autoSetupDevicesCounts.hydro)
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
                                autoSetupDevices.filter(
                                  (d) => d.type === "Hydro"
                                )[num]
                              }
                              disabled
                            />
                            <span className="text-success">Водород</span>
                          </div>
                        ))}
                      {new Array(autoSetupDevicesCounts.ground)
                        .fill(1)
                        .map((dev, num) => (
                          <div className="form-group d-flex align-items-center mt-3">
                            <span
                              style={{ marginRight: "0.5rem", fontWeight: 700 }}
                            >
                              {autoSetupDevicesCounts.hydro + num + 1}
                            </span>
                            <input
                              type="text"
                              className="form-control"
                              value={
                                autoSetupDevices.filter(
                                  (d) => d.type === "Ground"
                                )[num]
                              }
                              disabled
                            />
                            <span className="text-success">Грунт</span>
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
                          value={autoSetupDevicesCounts.ground}
                        />
                      </div>
                      <div className="form-group">
                        <label>Количество датчиков грунта</label>
                        <input
                          type="text"
                          value={autoSetupDevicesCounts.ground}
                          className="form-control"
                        />
                      </div>
                    </>
                  )}
                </div>
                <div class="modal-footer">
                  <button
                    type="button"
                    class="btn btn-secondary"
                    data-bs-dismiss="modal"
                    onClick={() => {
                      setIsModalAutoSetupVisible(false);
                      setIsAutoSetupStarted(false);
                    }}
                  >
                    Закрыть
                  </button>
                  <button type="submit" class="btn btn-primary">
                    Начать
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      <div className="container-fluid">
        <div className="header w-100">
          <div className="row w-100 align-items-center">
            <div className="col-md-6 col-sm-6">
              <div className="row align-items-center">
                <div className="col-md-3">
                  <div className="logo header__logo">КМПК</div>
                </div>
                <div className="col-md-9">
                  <Link to="/?intro=false">
                    <div
                      className="profile header__profile d-flex align-items-center"
                      style={{ color: "#111", textDecoration: "none" }}
                    >
                      <img
                        className="header__profile-img"
                        src={UserIcon}
                        alt="image"
                      />

                      <div
                        className="header__profile-name"
                        style={{ color: "#111", textDecoration: "none" }}
                      >
                        {fullName}
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
            <div className="col-md-4 offset-md-2 d-flex justify-content-end">
              <div
                className="header__settings d-flex"
                onClick={() => setIsShowMenu(true)}
              >
                <img className="header__settings-icon" src={SettingsIcon} />
              </div>
              <div
                className="header__settings-text"
                onClick={() => setIsShowMenu(true)}
              >
                Настройки
              </div>
            </div>
          </div>
        </div>
        <main className="main devices_list mt-5">
          <div className="row">
            {settings.devices.map((device) => (
              <div className="col-md-3">
                <DeviceCard
                  address={device.address}
                  type={device.type}
                  number={device.number}
                />
              </div>
            ))}

            <div className="col-md-3 h-100">
              <div
                className="card h-100"
                style={{ borderStyle: "dashed", maxHeight: 322 }}
              ></div>
            </div>
          </div>
        </main>
        <footer className="footer" style={{ marginTop: "6rem" }}>
          <Link to="/stats">
            <button
              className="btn btn-primary footer__btn"
              type="button"
              style={{ textDecoration: "none" }}
            >
              <img className="footer__btn-icon" src={ResultIcon} />
              <span style={{ marginLeft: "2rem", textDecoration: "none" }}>
                Результаты
                <br /> измерения
              </span>
            </button>
          </Link>
        </footer>
      </div>
    </div>
  );
};

export default DashboardPage;
