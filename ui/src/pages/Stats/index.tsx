// @ts-nocheck
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { AxisOptions, Chart } from "react-charts";
import Graph from "./Graph";
import { toast } from "react-toastify";
import Graph2 from "./Graph2";
import ProcessIcon from "../../../public/process_icon.png";

const Stats = () => {
  const [scannedDataDates, setScannedDataDates] = useState([]);
  const [scannedData, setScannedData] = useState([]);
  const [currentDate, setCurrentDate] = useState();
  const [selectedPoint, setSelectedPoint] = useState(1);

  const fetchScanDates = () => {
    axios
      .get("http://localhost:8081/getScannedDataDates")
      .then((response) => setScannedDataDates(response.data.dates));
  };

  const fetchScanData = (date: string) => {
    axios
      .get(`http://localhost:8081/getScannedData?date=${date}`)
      .then((response) => setScannedData(response.data.data));
  };

  useEffect(() => {
    fetchScanDates();
  }, []);

  return (
    <div className="stats_page">
      <div className="container-fluid">
        <div className="d-flex align-items-center">
          <Link to="/dashboard">
            <div className="btn btn-primary btn-back">Назад</div>
          </Link>
          <h4 className="mb-0" style={{ marginLeft: "1.5rem" }}>
            Результаты измерений
          </h4>
        </div>
        <div className="row">
          <div className="col-md-6 mt-4">
            <ul>
              {scannedDataDates?.map((date) => (
                <li
                  onClick={(e) => fetchScanData(date)}
                  style={{ display: "block" }}
                >
                  Данные за {date} <i className="bi bi-chevron-down"></i>
                </li>
              ))}
            </ul>
            <div className="cont">
              <table className="table">
                <thead>
                  <tr>
                    <th>
                      № точки
                      <br /> измерения
                    </th>
                    <th>
                      Время <br />
                      измерения
                    </th>
                    <th>
                      Среднее знач-е <br />
                      PPM
                    </th>
                    <th>Влажность</th>
                    <th>Температура</th>
                    <th>pH</th>
                    <th>
                      Кол-во
                      <br />
                      замеров
                    </th>
                    <th>GPS</th>
                    <th>Тип устройства</th>
                  </tr>
                </thead>
                <tbody>
                  {scannedData.map((data) => (
                    <tr
                      style={{
                        background:
                          data?.info?.pointNumber === selectedPoint
                            ? "#bbb"
                            : "",
                      }}
                      onClick={() => {
                        setSelectedPoint(data?.info?.pointNumber);
                      }}
                    >
                      <td>{data?.info?.pointNumber}</td>
                      <td>{data?.info?.start_time}</td>
                      <td>
                        {data?.info.type === "Ground"
                          ? "-"
                          : data.data
                              .reduce(function (avg, value) {
                                return avg + value.h2 / data.data.length;
                              }, 0)
                              .toFixed(2)}
                      </td>
                      <td>
                        {data?.info.type === "Ground"
                          ? data.data
                              .reduce(function (avg, value) {
                                return avg + value.moi / data.data.length;
                              }, 0)
                              .toFixed(2)
                          : "-"}
                      </td>
                      <td>
                        {data?.info.type === "Ground" ? data.data[0].temp : "-"}
                      </td>
                      <td>
                        {data?.info.type === "Ground"
                          ? data.data
                              .reduce(function (avg, value) {
                                return (
                                  avg + parseFloat(value.ph) / data.data.length
                                );
                              }, 0)
                              .toFixed(2)
                          : "-"}
                      </td>
                      <td>{data?.data?.length}</td>
                      <td>
                        {data?.data[0]?.Lat}
                        <br />
                        {data?.data[0]?.Long}
                      </td>
                      <td>
                        {data?.info.type === "Ground" ? "Грунт" : "Водород"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="col-md-5 offset-md-1 d-flex flex-column justify-content-end">
            {scannedData.length ? (
              <Graph2
                data={{
                  labels: scannedData.map((d) => d.info.pointNumber),
                  datasets: [
                    {
                      label: "H2",
                      data: scannedData.map((d) =>
                        d.data.reduce(function (avg, value) {
                          return avg + parseFloat(value.h2) / d.data.length;
                        }, 0)
                      ),
                    },
                    {
                      label: "pH",
                      data: scannedData.map((d) =>
                        d.data.reduce(function (avg, value) {
                          return avg + parseFloat(value.ph) / d.data.length;
                        }, 0)
                      ),
                    },
                    {
                      label: "T",
                      data: scannedData.map((d) =>
                        d.data.reduce(function (avg, value) {
                          return avg + parseFloat(value.temp) / d.data.length;
                        }, 0)
                      ),
                    },
                    {
                      label: "Влажность",
                      data: scannedData.map((d) =>
                        d.data.reduce(function (avg, value) {
                          return avg + parseFloat(value.moi) / d.data.length;
                        }, 0)
                      ),
                    },
                  ],
                }}
              />
            ) : (
              ""
            )}

            {scannedData[selectedPoint] ? (
              <div style={{ overflowX: "scroll" }}>
                <div
                  className="chart-container"
                  style={{ position: "relative", width: "900px" }}
                >
                  <Graph2
                    data={{
                      labels: scannedData[selectedPoint].data.map((d) =>
                        new Date(d.timestamp).toLocaleTimeString()
                      ),
                      datasets: [
                        {
                          label:
                            scannedData[selectedPoint]?.type === "Hydro"
                              ? "H2"
                              : "pH",
                          data:
                            scannedData[selectedPoint]?.type === "Hydro"
                              ? scannedData[selectedPoint].data.map((d) => d.h2)
                              : scannedData[selectedPoint].data.map(
                                  (d) => d.ph
                                ),
                        },
                      ],
                    }}
                  />
                  {/* <Graph
                    graphData={scannedData[selectedPoint].data.map((d) => ({
                      primary: new Date(d.timestamp).toLocaleTimeString(),
                      secondary: d.h2,
                    }))}
                  /> */}
                </div>
              </div>
            ) : (
              ""
            )}

            {/* <MyChart /> */}
            {/* <Chart data={data} axes={axes} /> */}
          </div>
        </div>
        <div className="d-flex">
          {scannedData?.length ? (
            <button
              className="btn btn-primary footer__btn mt-3"
              style={{ marginLeft: "1.5rem" }}
              onClick={() =>
                toast.error("Недостаточно данных для расчета скорости коррозии")
              }
            >
              <img className="footer__btn-icon" src={ProcessIcon} />
              <span style={{ marginLeft: "2rem" }}>
                Расчитать скорость <br />
                коррозии
              </span>
            </button>
          ) : (
            ""
          )}
          {scannedData?.length ? (
            <button
              className="btn btn-primary footer__btn mt-3"
              style={{ marginLeft: "1.5rem" }}
              onClick={() => toast.error("Пользователь не авторизован")}
            >
              <span style={{ fontWeight: "900", fontSize: "2rem" }}> ✓</span>
              {/* <i className="bi bi-check" className="footer__btn-icon"></i> */}
              {/* <img className="footer__btn-icon" src="process_icon.png" /> */}
              <span style={{ marginLeft: "2rem" }}>
                Подписать и отправить <br />
                данные
              </span>
            </button>
          ) : (
            ""
          )}
        </div>
      </div>
    </div>
  );
};

export default Stats;
