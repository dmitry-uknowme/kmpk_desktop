const express = require("express");
var bodyParser = require("body-parser");
const nodeChildProcess = require("child_process");
const app = express();
const cors = require("cors");
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const fs = require("fs");
const fsPromises = require("fs").promises;
const { exec, execSync } = require("child_process");
const kill = require("kill-port");
const ExcelJS = require("exceljs");
const path = require("path");

try {
  const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  const convertAddress = (address) => address.replaceAll(":", "_");

  app.use(cors({ origin: "*", methods: ["GET", "POST"] }));
  app.use(bodyParser.json());

  const dateDirName = `${new Date().toLocaleDateString()}`.replaceAll("/", ".");

  let workerScript;

  let sessionNumber;

  try {
    const dateFolder = `../data/${dateDirName}`;
    if (!fs.existsSync(dateFolder)) {
      fs.mkdirSync(dateFolder);
    }
    const folders = fs.readdirSync(`../data/${dateDirName}`);
    sessionNumber = folders?.length ? folders?.length : 1;
  } catch (err) {
    console.log("No session found", err);
  }

  const runWorker = () => {
    workerScript = nodeChildProcess.spawn("cmd.exe", [
      "/c",
      "start",
      "C:\\app\\kmpk_desktop1\\worker2\\bin\\Debug\\BluetoothWorker.exe",
    ]);

    console.log("[worker] PID: " + workerScript.pid);

    workerScript.stdout.on("data", (data) => {
      console.log("[worker] stdout: " + data);
    });

    workerScript.stderr.on("data", (err) => {
      console.log("[worker] stderr: " + err);
    });

    workerScript.on("exit", (code) => {
      console.log("[worker] Exit Code: " + code);
    });
  };

  let pointNumber = 0;

  try {
    fs.readdir(`../data/${dateDirName}`, (err, files) => {
      if (!files?.length) return;
      for (const file of files
        ?.filter((f) => f !== "info.json")
        ?.sort(
          (a, b) =>
            parseInt(a.split("[")[0]) > parseInt(b.split("[")[0] ? 1 : -1)
        )) {
        if (parseInt(file.split("[")[0]) <= pointNumber) {
          continue;
        }
        pointNumber = parseInt(file.split("[")[0]);
      }
    });
  } catch (ex) {}

  const APP_DIR = "C:\\app\\kmpk_desktop1";
  // const APP_DIR = "/home/dmitry/projects/kmpk_desktop";

  let devices = JSON.parse(
    fs.readFileSync(`${APP_DIR}\\settings.json`, "utf8")
  ).devices;

  const workers = {};

  io.on("connection", async (socket) => {
    const sockets = await io.allSockets();
    console.log("sockk", sockets);
    console.log("a user connected", socket.id);
    if (socket?.handshake.query?.name === "worker") {
      workers[socket.id] = socket.id;
    }
    socket.on("disconnect", () => {
      console.log("user disconnected", socket.id);
      if (socket?.handshake.query?.name === "worker") {
        delete workers[socket.id];
        console.log("restarting worker", workers);
        if (Object.keys(workers) <= 1) {
          runWorker();
          devices.map((device) => {
            socket.broadcast.emit("UI:DEVICE_DISCONNECTED", {
              address: device.address,
            });

            setTimeout(
              () =>
                socket.broadcast.emit("WORKER:DEVICE_TRY_CONNECT", {
                  address: device.address,
                }),
              2000
            );
          });
          devices;
        }
      }
    });

    socket.on("APP:EXIT", (data) => {
      socket.broadcast.emit("UI:EXIT", data);
      socket.broadcast.emit("WORKER:EXIT", data);
      setTimeout(() => process.exit(0), 1000);
    });

    socket.on("UI:DEVICE_TRY_CONNECT", (data) => {
      socket.broadcast.emit("WORKER:DEVICE_TRY_CONNECT", data);
    });

    socket.on("UI:DEVICE_TRY_DISCONNECT", (data) => {
      socket.broadcast.emit("WORKER:DEVICE_TRY_DISCONNECT", data);
    });

    socket.on("WORKER:DEVICE_CONNECTED", (data) => {
      data = JSON.parse(data);
      socket.broadcast.emit("UI:DEVICE_CONNECTED", { ...data, pointNumber });
    });

    socket.on("WORKER:DEVICE_DISCONNECTED", (data) => {
      data = JSON.parse(data);
      socket.broadcast.emit("UI:DEVICE_DISCONNECTED", data);
    });

    socket.on("UI:DEVICE_NEW_POINT", async (payload) => {
      pointNumber += 1;
      const dp = devices.find((d) => d.address === payload.address);
      //points = [...points, { number: pointNumber }];
      dp.point_number = pointNumber;
      console.log("new point", pointNumber);
      devices = [...devices.filter((d) => d.address !== payload.address), dp];
    });

    socket.on("WORKER:DEVICE_DATA_RECIEVE", async (data) => {
      data = JSON.parse(data);
      //console.log("dadadadada", devices);
      const pointNumber = devices.find(
        (d) => d.address === data.address
      ).point_number;
      const address = data.address;

      const type = devices.find((device) => device.address === address).type;

      const dateDirName = `${new Date().toLocaleDateString()}`.replaceAll(
        "/",
        "."
      );

      if (!fs.existsSync(`../data/${dateDirName}/${sessionNumber}`)) {
        fs.mkdirSync(`../data/${dateDirName}/${sessionNumber}`, {
          recursive: true,
        });
      }
      try {
        if (
          !fs.existsSync(
            `../data/${dateDirName}/${sessionNumber}/${pointNumber}[${convertAddress(
              address
            )}].json`
          )
        ) {
          await fsPromises.writeFile(
            `../data/${dateDirName}/${sessionNumber}/${pointNumber}[${convertAddress(
              address
            )}].json`,
            JSON.stringify({
              info: {
                address,
                type,
                pointNumber,
                start_time: new Date().getTime(),
                end_time: null,
              },
              data: [],
              resultData: {},
            })
          );
        }

        const oldData = JSON.parse(
          await fsPromises.readFile(
            `../data/${dateDirName}/${sessionNumber}/${pointNumber}[${convertAddress(
              address
            )}].json`
          )
        );

        oldData.data = [
          ...oldData.data,
          {
            temp: parseFloat(data.data.T),
            h2: parseFloat(data.data.H2),
            ph: parseFloat(data.data.PH),
            moi: parseFloat(data.data.Moi),
            gps: {
              lat: parseFloat(data.data.La),
              long: parseFloat(data.data.Long),
            },
            timestamp: new Date().getTime(),
          },
        ];

        const newData = oldData;
        await fsPromises.writeFile(
          `../data/${dateDirName}/${sessionNumber}/${pointNumber}[${convertAddress(
            address
          )}].json`,
          JSON.stringify(newData, null, 2)
        );

        socket.broadcast.emit("UI:DEVICE_DATA_RECIEVE", {
          ...data,
          pointNumber,
        });
      } catch (e) {
        console.log("unable to write file", e);
      }
    });
  });

  app.get("/getScannedDataDates", async (req, res) => {
    fs.readdir("../data", (err, dates) => {
      if (err) {
        return res.status(400).json({ status: "error", error: err }).end();
      }
      return res.status(200).json({ status: "success", dates: dates.sort() });
    });
  });

  app.get("/getScannedDataDatesSessions", async (req, res) => {
    const date = req.param("date");
    if (!date) {
      return res.status(400).json({ status: "error" }).end();
    }

    try {
      const sessions = await fsPromises.readdir(`../data/${date}`);
      res
        .status(200)
        .json({
          status: "success",
          sessions: sessions
            .map((s) => parseInt(s))
            .sort((a, b) => (a > b ? 1 : -1)),
        })
        .end();
    } catch (err) {
      return res.status(500).json({ status: "error", error: err }).end();
    }
  });

  app.get("/getScannedData", (req, res) => {
    const date = req.param("date");
    const sessionNumber = req.param("session_number");
    if (!date || !sessionNumber) {
      return res
        .status(400)
        .json({ status: "error", error: "Bad Request" })
        .end();
    }
    const data = [];
    fs.readdir(`../data/${date}/${sessionNumber}`, (err, files) => {
      if (err) {
        return res.status(500).json({ status: "error", error: err }).end();
      }

      files
        ?.filter((f) => f !== "auth.json")
        ?.sort(
          (a, b) =>
            parseInt(a.split("[")[0]) > parseInt(b.split("[")[0] ? 1 : -1)
        )
        ?.map((file) =>
          data.push(
            JSON.parse(
              fs.readFileSync(
                `../data/${date}/${sessionNumber}/${file.replaceAll(":", "_")}`
              )
            )
          )
        );
      return res.json({
        status: "success",
        points: data.sort((a, b) =>
          a.info.pointNumber > b.info.pointNumber ? 1 : -1
        ),
      });
    });
  });

  app.get("/exportScannedData", async (req, res) => {
    const date = req.param("date");
    const sessionNumber = req.param("session_number");
    if (!date || !sessionNumber) {
      return res.status(400).json({ status: "error", error: "Bad Request" });
    }

    let points = [];

    fs.readdir(`../data/${date}/${sessionNumber}`, async (err, files) => {
      if (err) {
        return res.status(500).json({ status: "error", error: err });
      }

      files
        ?.filter((f) => f !== "auth.json")
        ?.sort(
          (a, b) =>
            parseInt(a.split("[")[0]) > parseInt(b.split("[")[0] ? 1 : -1)
        )
        ?.map((file) =>
          points.push(
            JSON.parse(
              fs.readFileSync(
                `../data/${date}/${sessionNumber}/${file.replaceAll(":", "_")}`
              )
            )
          )
        );

      points = points.sort((a, b) =>
        a.info.pointNumber > b.info.pointNumber ? 1 : -1
      );

      const auth = JSON.parse(
        fs.readFileSync(`../data/${date}/${sessionNumber}/auth.json`)
      );
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet();
      worksheet.columns = [
        { header: "Номер точки", key: "number" },
        { header: "Дата и время начала измерений", key: "start_time" },
        { header: "Наименование объекта", key: "section_name" },
        { header: "Номер участка объекта", key: "section_point_number" },
        { header: "Организация замерщика", key: "user_org_name" },
        { header: "ФИО замерщика", key: "user_fullname" },
        { header: "Должность замерщика", key: "user_position" },
        { header: "Ср. Температура", key: "temp" },
        { header: "Ср. H2", key: "h2" },
        { header: "Макс. H2", key: "h2_max" },
        { header: "Ср. pH", key: "ph" },
        { header: "Координаты", key: "gps" },
      ];

      points.map((point) => {
        const number = point.info.pointNumber;
        const h2 = point.data.reduce((avg, value) => {
          return parseFloat(avg) + parseFloat(value.h2) / point.data.length;
        }, 0);
        const maxH2 = Math.max(...point.data.map((d) => d.h2));
        const ph = point.data.reduce((avg, value) => {
          return parseFloat(avg) + parseFloat(value.ph) / point.data.length;
        }, 0);
        const gps =
          point.data[0].gps.lat || "" + "  " + point.data[0].gps.long || "";
        const startTime =
          new Date(auth.start_time).toLocaleDateString() +
          " " +
          new Date(auth.start_time).toLocaleTimeString();

        worksheet.addRow({
          number,
          h2,
          h2_max: maxH2,
          ph,
          gps,
          start_time: startTime,
          user_fullname: auth.user.full_name,
          user_org_name: auth.user.org_name,
          user_position: auth.user.position,
          section_name: auth.object.name,
          section_point_number: auth.object.point_number,
        });
      });

      const filename = `KMPK_${date}_${sessionNumber}.xlsx`;
      res.setHeader("Content-Disposition", "attachment; filename=" + filename);
      workbook.xlsx.writeFile(filename).then((response) => {
        console.log("file is written");
        return res.sendFile(path.resolve(__dirname, filename));
      });
    });
  });

  app.post("/auth/login", async (req, res) => {
    const body = req.body;
    const dateDirName = `${new Date().toLocaleDateString()}`.replaceAll(
      "/",
      "."
    );

    try {
      const dateFolder = `../data/${dateDirName}`;
      if (!fs.existsSync(dateFolder)) {
        fs.mkdirSync(dateFolder);
      }
      folders = await fsPromises.readdir(`../data/${dateDirName}`);
      sessionNumber = folders?.length ? folders?.length + 1 : 1;
      const result = {
        date: dateDirName,
        session_number: sessionNumber,
        user: {
          full_name: body.user.full_name,
          position: body.user.position,
          org_name: body.user.org_name,
        },
        object: {
          name: body.object.name,
          point_number: body.object.point_number,
        },
        start_time: new Date().getTime(),
        end_time: null,
      };
      await fsPromises.mkdir(`../data/${dateDirName}/${sessionNumber}`);
      await fsPromises.writeFile(
        `../data/${dateDirName}/${sessionNumber}/auth.json`,
        JSON.stringify(result, null, 2)
      );
      pointNumber = 0;
      res.status(200).json({ status: "success", response: result });
    } catch (err) {
      res.status(400).json({ status: "error", error: err });
    }
  });

  app.post("/auth/logout", async (req, res) => {
    const body = req.body;
    const sessionNumber = body.sessionNumber;
    const oldData = await JSON.parse(
      fsPromises.readFile(`../data/${dateDirName}/${sessionNumber}/auth.json`)
    );

    const newData = { ...oldData, end_time: new Date().getTime() };

    try {
      await fsPromises.writeFile(
        `../data/${dateDirName}/${sessionNumber}/auth.json`,
        newData
      );
      res.status(200).json({ status: "success" });
    } catch (err) {
      res.status(400).json({ status: "error", message: err });
    }
  });

  server.listen(8081, () => {
    console.log("listening on *:8081");
  });

  server.on("close", () => {
    console.log("closeeee");
    kill(8081, "tcp");
  });
} catch (err) {
  console.log("Unexpected error", err);
}
