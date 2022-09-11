import DeviceCard from "@/components/DeviceCard";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import io from "socket.io-client";

const socket = io("http://localhost:8081");

const DashboardPage = () => {
  const [search, setSearch] = useSearchParams();
  const [fullName, setFullName] = useState(search.get("full_name"));
  return (
    <div className="dashboard_page">
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
              <div className="header__settings d-flex">
                <img
                  className="header__settings-icon"
                  src="settings_icon.png"
                />
              </div>
              <div className="header__settings-text">Настройки</div>
            </div>
          </div>
        </div>
        <main className="main devices_list mt-5">
          <div className="row">
            <div className="col-md-3">
              <DeviceCard address="20:C3:8F:BE:B3:1B" type="Hydro" number={1} />
            </div>
            {/* <div className="col-md-3">
              <DeviceCard address="00:15:87:00:B7:E2" type="Hydro" number={1} />
            </div> */}
            {/* <div className="col-md-3">
              <DeviceCard address="88:25:83:F0:97:90" type="Hydro" number={2} />
            </div> */}
            {/* <div className="col-md-3">
              <DeviceCard address="98:7B:F3:5F:66:D6" type="Hydro" number={2} />
            </div> */}
            <div className="col-md-3">
              <DeviceCard address="50:65:83:79:24:9F" type="Hydro" number={2} />
            </div>
            {/* <div className="col-md-3">
              <DeviceCard
                address="88:4A:EA:92:1D:43"
                type="Ground"
                number={3}
              />
            </div> */}
            <div className="col-md-3">
              <DeviceCard
                address="00:15:85:14:9C:09"
                type="Ground"
                number={3}
              />
            </div>
            {/* <div className="col-md-3">
              <DeviceCard
                address="50:65:83:75:E3:2B"
                type="Ground"
                number={3}
              />
            </div> */}
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
