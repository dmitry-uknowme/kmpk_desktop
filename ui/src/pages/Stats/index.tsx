// @ts-nocheck
import { useState, useEffect, useContext } from "react";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { Link } from "react-router-dom";
import { AxisOptions, Chart } from "react-charts";
import Graph from "./Graph";
import { toast } from "react-toastify";
import Graph2 from "./Graph2";
import ProcessIcon from "../../../public/process_icon.png";
import AuthContext from "@/context/AuthContext";

const Stats = () => {
  // const API_URL = "http://localhost:8000/api/v1/metric/add";
  const API_URL = "http://91.240.84.221/api/v1/metric/add";

  const [scannedDataDates, setScannedDataDates] = useState([]);
  const [scannedData, setScannedData] = useState([]);
  const [currentDate, setCurrentDate] = useState();
  const [selectedPoint, setSelectedPoint] = useState(1);
  const { auth, setAuth } = useContext(AuthContext);
  const [dataToServer, setDataToServer] = useState({
    user: {
      full_name: auth?.user.full_name || "",
      position: auth?.user.position || "",
      org_name: auth?.user.org_name || "",
    },
    object: {
      name: auth?.object.name || "",
      point_number: auth?.object.point_number || "",
    },
    start_time: auth?.start_time,
    end_time: new Date().getTime(),
    points: [],
  });

  const sendData = () => {
    if (!dataToServer?.points?.length)
      return toast.error(
        "Ошибка при отправке данных на сервер, возможно эти данные уже были отправлены"
      );
    axios
      .post(API_URL, dataToServer)
      .then((response) => {
        setDataToServer();
        console.log("ress", response);
        toast.success("Данные успешно отправлены на сервер");
      })
      .catch((er) => {
        toast.error("Ошибка при отправке данных на сервер");
      });
  };

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
    if (scannedData?.length) {
      setDataToServer((state) => ({
        user: {
          full_name: auth?.user.full_name || "",
          position: auth?.user.position || "",
          org_name: auth?.user.org_name || "",
        },
        object: {
          name: auth?.object.name || "",
          point_number: auth?.object.point_number || "",
        },
        start_time: auth?.start_time,
        end_time: new Date().getTime(),
        ...state,
        points: [
          ...scannedData.map((data, number) => ({
            id: uuidv4(),
            number: number + 1,
            h2: data.data.reduce((avg, value) => {
              return parseFloat(avg) + parseFloat(value.h2) / data.data.length;
            }, 0),
            maxH2: Math.max(...data.data.map((d) => d.h2)),
            temp: data.data.reduce((avg, value) => {
              return parseFloat(avg) + value.temp
                ? parseFloat(value.temp)
                : 0 / data.data.length;
            }, 0),
            ph: data.data.reduce((avg, value) => {
              return parseFloat(avg) + parseFloat(value.ph) / data.data.length;
            }, 0),
            moi: data.data.reduce((avg, value) => {
              return parseFloat(avg) + parseFloat(value.moi) / data.data.length;
            }, 0),
            gps: {
              lat: data.data[0].gps.lat || "",
              long: data.data[0].gps.long || "",
            },
            dateTime: data.data[0].timestamp || "",
          })),
        ],
      }));
    }
  }, [scannedData]);

  useEffect(() => {
    if (!auth) {
      toast.error("Пользователь не авторизован");
      setTimeout(() => navigate("/"), 500);
    }
  }, [auth]);

  //console.log("ppp", JSON.stringify(dataToServer));
  //console.log("scanned", scannedData);

  console.log("scannnnn", scannedData[selectedPoint]);

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
                      <td>
                        {Math.floor(
                          (data?.data[data?.data.length - 1].timestamp -
                            data?.info?.start_time) /
                            60000
                        )}
                        :
                        {(
                          (data?.data[data?.data.length - 1].timestamp -
                            data?.info?.start_time) %
                          60000
                        )
                          .toString()
                          .slice(0, 2)}
                      </td>
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
            <div className="d-flex">
              {scannedData?.length ? (
                <button
                  className="btn btn-primary footer__btn mt-3"
                  style={{ marginLeft: "1.5rem" }}
                  onClick={() =>
                    toast.error(
                      "Недостаточно данных для расчета скорости коррозии"
                    )
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
                  style={{ marginLeft: "0.5rem" }}
                  onClick={() => sendData()}
                >
                  <span style={{ fontWeight: "900", fontSize: "2rem" }}>✓</span>
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
          <div className="col-md-5 offset-md-1 d-flex flex-column justify-content-end">
            {scannedData.length ? (
              <Graph2
                data={{
                  labels: scannedData.map((d) => d.info.pointNumber),
                  datasets: [
                    {
                      borderColor: "rgb(255, 99, 132)",
                      backgroundColor: "rgba(255, 99, 132, 0.5)",
                      borderWidth: 1,
                      label: "H2",
                      data: scannedData.map((d) =>
                        d.data.reduce(function (avg, value) {
                          if (d.info.type === "Hydro") {
                            return avg + parseFloat(value.h2) / d.data.length;
                          }
                        }, 0)
                      ),
                    },
                    {
                      borderColor: "rgb(53, 162, 235)",
                      backgroundColor: "rgba(53, 162, 235, 0.5)",
                      label: "pH",
                      data: scannedData.map((d) =>
                        d.data.reduce(function (avg, value) {
                          if (d.info.type === "Ground") {
                            return avg + parseFloat(value.ph) / d.data.length;
                          }
                        }, 0)
                      ),
                    },
                    {
                      borderColor: "rgba(10, 162, 235, 0.5)",
                      backgroundColor: "rgba(10, 162, 235, 0.2)",
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

            {scannedData?.find((d) => d.info.pointNumber === selectedPoint) ? (
              <div style={{ overflowX: "scroll" }}>
                <div
                  className="chart-container"
                  style={{ position: "relative", width: "900px" }}
                >
                  <Graph2
                    data={{
                      labels: scannedData
                        ?.find((d) => d.info.pointNumber === selectedPoint)
                        .data.map((d) =>
                          new Date(d.timestamp).toLocaleTimeString()
                        ),
                      datasets: [
                        {
                          backgroundColor: [
                            "rgba(255, 99, 132, 0.2)",
                            "rgba(54, 162, 235, 0.2)",
                            "rgba(255, 206, 86, 0.2)",
                            "rgba(75, 192, 192, 0.2)",
                            "rgba(153, 102, 255, 0.2)",
                            "rgba(255, 159, 64, 0.2)",
                          ],
                          borderColor: [
                            "rgba(255, 99, 132, 1)",
                            "rgba(54, 162, 235, 1)",
                            "rgba(255, 206, 86, 1)",
                            "rgba(75, 192, 192, 1)",
                            "rgba(153, 102, 255, 1)",
                            "rgba(255, 159, 64, 1)",
                          ],
                          borderWidth: 1,
                          label:
                            scannedData?.find(
                              (d) => d.info.pointNumber === selectedPoint
                            )?.info?.type === "Hydro"
                              ? "H2"
                              : "pH",
                          data:
                            scannedData?.find(
                              (d) => d.info.pointNumber === selectedPoint
                            )?.info?.type === "Hydro"
                              ? scannedData
                                  ?.find(
                                    (d) => d.info.pointNumber === selectedPoint
                                  )
                                  .data.map((d) => d.h2)
                              : scannedData
                                  ?.find(
                                    (d) => d.info.pointNumber === selectedPoint
                                  )
                                  .data.map((d) => d.ph),
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;
