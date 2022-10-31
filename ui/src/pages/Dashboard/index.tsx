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
import AutoSetupModal from "@/components/AutoSetupModal";
import DevicesListContext from "@/context/DevicesListContext";

const socket = io("ws://localhost:8081");

const settings = window.api.getSettings();

const DashboardPage = () => {
  const [isModalAutoSetupVisible, setIsModalAutoSetupVisible] = useState(false);
  const { auth, setAuth } = useContext(AuthContext);
  const { devicesList, setDevicesList } = useContext(DevicesListContext);
  const [search, setSearch] = useSearchParams();
  const fullName = auth?.user?.full_name;
  const [isShowMenu, setIsShowMenu] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
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
        <AutoSetupModal
          isVisible={isModalAutoSetupVisible}
          setIsVisible={setIsModalAutoSetupVisible}
        />
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
            {devicesList?.length
              ? devicesList
                  ?.sort((a, b) => (a.number > b.number ? 1 : -1))
                  ?.map((device) => (
                    <div className="col-md-3">
                      <DeviceCard
                        address={device.address}
                        type={device.type}
                        number={device.number}
                        isWaiting={device.isWaiting}
                        isPaused={device.isPaused}
                        isConnected={device.isConnected}
                      />
                    </div>
                  ))
              : ""}

            {/* <div className="col-md-3 h-100">
              <div
                className="card h-100"
                style={{ borderStyle: "dashed", maxHeight: 322 }}
              ></div>
            </div> */}
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
