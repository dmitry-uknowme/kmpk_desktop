const express = require("express");
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
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

const convertAddress = (address) => address.replaceAll(":", "_");

app.use(cors({ origin: "*", methods: ["GET", "POST"] }));

const dateDirName = `${new Date().toLocaleDateString()}`.replaceAll("/", ".");

let workerScript;

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
        (a, b) => parseInt(a.split("[")[0]) > parseInt(b.split("[")[0] ? 1 : -1)
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

io.on("connection", (socket) => {
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
            () => socket.broadcast.emit("WORKER:DEVICE_TRY_CONNECT", data),
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

    if (!fs.existsSync(`../data/${dateDirName}`)) {
      fs.mkdirSync(`../data/${dateDirName}`, { recursive: true });
    }
    try {
      if (
        !fs.existsSync(
          `../data/${dateDirName}/${pointNumber}[${convertAddress(
            address
          )}].json`
        )
      ) {
        await fsPromises.writeFile(
          `../data/${dateDirName}/${pointNumber}[${convertAddress(
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
          `../data/${dateDirName}/${pointNumber}[${convertAddress(
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
      // console.log("ddddd", newData);
      await fsPromises.writeFile(
        `../data/${dateDirName}/${pointNumber}[${convertAddress(
          address
        )}].json`,
        JSON.stringify(newData, null, 2)
      );

      socket.broadcast.emit("UI:DEVICE_DATA_RECIEVE", { ...data, pointNumber });
    } catch (e) {
      console.log("unable to write file", e);
    }
  });
});

app.get("/getScannedDataDates", (req, res) => {
  fs.readdir("../data", (err, dates) => {
    res.json({ dates });
  });
});

app.get("/getScannedData", (req, res) => {
  const date = req.param("date");
  console.log("datteee", date);
  const data = [];
  fs.readdir(`../data/${date}`, (err, files) => {
    files
      ?.filter((f) => f !== "info.json")
      ?.sort(
        (a, b) => parseInt(a.split("[")[0]) > parseInt(b.split("[")[0] ? 1 : -1)
      )
      ?.map((file) =>
        data.push(
          JSON.parse(
            fs.readFileSync(`../data/${date}/${file.replaceAll(":", "_")}`)
          )
        )
      );
    res.json({ data });
  });
});

server.listen(8081, () => {
  console.log("listening on *:8081");
});

server.on("close", () => {
  console.log("closeeee");
  kill(8081, "tcp");
});
