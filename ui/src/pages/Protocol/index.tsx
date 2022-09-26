// @ts-nocheck
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { AxisOptions, Chart } from "react-charts";

const Protocol = () => {
  const [scannedDataDates, setScannedDataDates] = useState([]);
  const [scannedData, setScannedData] = useState([]);
  const [currentDate, setCurrentDate] = useState();

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
            Протокол отправки данных
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
                  <th>
                    Кол-во
                    <br />
                    замеров
                  </th>
                  <th>GPS</th>
                </tr>
              </thead>
              <tbody>
                {scannedData.map((data) => (
                  <tr>
                    <td>{data?.info?.pointNumber}</td>
                    <td>{data?.info?.start_time}</td>
                    <td>
                      {data.data
                        .reduce(function (avg, value) {
                          return avg + value.h2 / data.data.length;
                        }, 0)
                        .toFixed(2)}
                    </td>
                    <td>{data?.data?.length}</td>
                    <td>
                      {data?.data[0]?.Lat}
                      <br />
                      {data?.data[0]?.Long}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Protocol;
