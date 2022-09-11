import DeviceCard from "@/components/DeviceCard";
import { useState, useEffect, useRef } from "react";
import { Offcanvas } from "react-bootstrap";
import { Link, useSearchParams } from "react-router-dom";
import io from "socket.io-client";

const settings = window.api.getSettings();

const DashboardPage = () => {
  const [search, setSearch] = useSearchParams();
  const [fullName, setFullName] = useState(search.get("full_name"));
  const [isShowMenu, setIsShowMenu] = useState<boolean>(false);

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
                  Устройство №{device.number}
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
                type="email"
                class="form-control"
                id="exampleInputEmail1"
                aria-describedby="emailHelp"
                value={settings.saveFolder}
              />
            </div>
            <div class="form-check form-switch">
              <input
                class="form-check-input"
                type="checkbox"
                id="flexSwitchCheckChecked"
              />
              <label class="form-check-label" for="flexSwitchCheckChecked">
                Автоматически определить устройства
              </label>
            </div>
            <div className="btn btn-success mt-4">Сохранить</div>
            <div className="row" style={{ marginTop: "5rem" }}>
              <div className="btn btn-primary">Обновить приложение</div>
            </div>
          </form>
        </Offcanvas.Body>
      </Offcanvas>
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
                        src="user_icon.png"
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
                <img
                  className="header__settings-icon"
                  src="settings_icon.png"
                />
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
            <button className="btn btn-primary footer__btn" type="button">
              <img className="footer__btn-icon" src="result_icon.png" />
              <span style={{ marginLeft: "2rem" }}>
                Результаты
                <br /> измерения
              </span>
            </button>
          </Link>
          <Link to="/protocol">
            <button
              className="btn btn-primary footer__btn"
              style={{ marginLeft: "1.5rem" }}
            >
              <img className="footer__btn-icon" src="protocol_icon.png" />
              <span style={{ marginLeft: "2rem" }}>
                Сформировать <br />
                протокол
              </span>
            </button>
          </Link>
        </footer>
      </div>
    </div>
  );
};

export default DashboardPage;
