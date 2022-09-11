import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { AxisOptions, Chart } from "react-charts";
import Graph from "./Graph";

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
              {scannedDataDates.map((date) => (
                <li onClick={(e) => fetchScanData(date)}>
                  {date} <i className="bi bi-chevron-down"></i>
                </li>
              ))}
            </ul>
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
                  <th>Комментарий</th>
                </tr>
              </thead>
              <tbody>
                {scannedData.map((data) => (
                  <tr
                    style={{
                      background:
                        data?.info?.pointNumber === selectedPoint ? "#bbb" : "",
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
                    <td></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="col-md-5 offset-md-1 d-flex justify-content-end">
            {scannedData.length ? (
              <Graph
                graphData={scannedData.map((d) => ({
                  primary: d.info.pointNumber,
                  secondary: d.data
                    .reduce(function (avg, value) {
                      return avg + value.h2 / d.data.length;
                    }, 0)
                    .toFixed(2),
                }))}
              />
            ) : (
              ""
            )}

            {scannedData[selectedPoint] ? (
              <Graph
                graphData={scannedData[selectedPoint].data.map((d) => ({
                  primary: new Date(d.timestamp).toLocaleTimeString(),
                  secondary: d.h2,
                }))}
              />
            ) : (
              ""
            )}
            {/* <MyChart /> */}
            {/* <Chart data={data} axes={axes} /> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;
