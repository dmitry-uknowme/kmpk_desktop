const express = require("express");
const app = express();
const cors = require("cors");
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const fs = require("fs");
const { exec } = require("child_process");
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors({ origin: "*", methods: ["GET", "POST"] }));

let pointNumber = 0;

const APP_DIR = "C:\\app\\kmpk_desktop";
// const APP_DIR = "/home/dmitry/projects/kmpk_desktop";

let devices = JSON.parse(
  fs.readFileSync(`${APP_DIR}/settings.json`, "utf8")
).devices;

// let devices = [
//   { number: 1, address: "00:15:87:00:B7:E2", point_number: 0, type: "Hydro" },
//   { number: 2, address: "50:65:83:79:24:9F", point_number: 0, type: "Hydro" },
//   { number: 3, address: "50:65:83:75:E3:2B", point_number: 0, type: "Ground" },
// ];

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);
  // socket.emit("WORKER:DEVICE_TRY_CONNECT", { da: "da" });
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
  // socket.emit("my message", { dadadadad: "agada" });
  // socket.on("DEVICE:DATA_RECIEVE", (payload) => {
  //   console.log("reccc", payload);
  // });

  socket.on("UI:DEVICE_TRY_CONNECT", (data) => {
    socket.broadcast.emit("WORKER:DEVICE_TRY_CONNECT", data);
  });

  socket.on("UI:DEVICE_TRY_DISCONNECT", (data) => {
    socket.broadcast.emit("WORKER:DEVICE_TRY_DISCONNECT", data);
  });

  socket.on("WORKER:DEVICE_CONNECTED", (data) => {
    pointNumber += 1;
    console.log("pointt", pointNumber);
    const dp = devices.find((d) => d.address === data.address);
    console.log("dpppp", dp);
    dp.point_number = pointNumber;
    devices = [...devices.filter((d) => d.address !== data.address), dp];

    socket.broadcast.emit("UI:DEVICE_CONNECTED", data);
  });

  socket.on("WORKER:DEVICE_DISCONNECTED", (data) => {
    socket.broadcast.emit("UI:DEVICE_DISCONNECTED", data);
  });

  socket.on("WORKER:DEVICE_DATA_RECIEVE", (data) => {
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

    if (
      !fs.existsSync(`../data/${dateDirName}/${pointNumber}[${address}].json`)
    ) {
      execSync(`touch ..\\data/${dateDirName}/${pointNumber}[${address}].json`);
      fs.writeFileSync(
        `../data/${dateDirName}/${pointNumber}[${address}].json`,
        JSON.stringify({
          info: {
            address,
            type,
            pointNumber,
            start_time: new Date().toLocaleTimeString(),
            end_time: null,
          },
          data: [],
        })
      );
    }

    const oldData = JSON.parse(
      fs.readFileSync(`../data/${dateDirName}/${pointNumber}[${address}].json`)
    );

    oldData.data = [
      ...oldData.data,
      { ...data.data, timestamp: new Date().getTime() },
    ];
    const newData = oldData;

    fs.writeFileSync(
      `../data/${dateDirName}/${pointNumber}[${address}].json`,
      JSON.stringify(newData, null, 2)
    );

    socket.broadcast.emit("UI:DEVICE_DATA_RECIEVE", { ...data, pointNumber });
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
    //  const count = data.length
    //  for (let i)
    files
      ?.filter((f) => f !== "info.json")
      ?.map((file) =>
        data.push(JSON.parse(fs.readFileSync(`../data/${date}/${file}`)))
      );
    res.json({ data });
  });
});

server.listen(8081, () => {
  console.log("listening on *:8081");
});
