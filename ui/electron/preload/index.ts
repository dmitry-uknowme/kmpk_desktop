// const fs = require("fs");

// function domReady(
//   condition: DocumentReadyState[] = ["complete", "interactive"]
// ) {
//   return new Promise((resolve) => {
//     if (condition.includes(document.readyState)) {
//       resolve(true);
//     } else {
//       document.addEventListener("readystatechange", () => {
//         if (condition.includes(document.readyState)) {
//           resolve(true);
//         }
//       });
//     }
//   });
// }

// const safeDOM = {
//   append(parent: HTMLElement, child: HTMLElement) {
//     if (!Array.from(parent.children).find((e) => e === child)) {
//       return parent.appendChild(child);
//     }
//   },
//   remove(parent: HTMLElement, child: HTMLElement) {
//     if (Array.from(parent.children).find((e) => e === child)) {
//       return parent.removeChild(child);
//     }
//   },
// };

// /**
//  * https://tobiasahlin.com/spinkit
//  * https://connoratherton.com/loaders
//  * https://projects.lukehaas.me/css-loaders
//  * https://matejkustec.github.io/SpinThatShit
//  */
// function useLoading() {
//   const className = `loaders-css__square-spin`;
//   const styleContent = `
// @keyframes square-spin {
//   25% { transform: perspective(100px) rotateX(180deg) rotateY(0); }
//   50% { transform: perspective(100px) rotateX(180deg) rotateY(180deg); }
//   75% { transform: perspective(100px) rotateX(0) rotateY(180deg); }
//   100% { transform: perspective(100px) rotateX(0) rotateY(0); }
// }
// .${className} > div {
//   animation-fill-mode: both;
//   width: 50px;
//   height: 50px;
//   background: #fff;
//   animation: square-spin 3s 0s cubic-bezier(0.09, 0.57, 0.49, 0.9) infinite;
// }
// .app-loading-wrap {
//   position: fixed;
//   top: 0;
//   left: 0;
//   width: 100vw;
//   height: 100vh;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   background: #282c34;
//   z-index: 9;
// }
//     `;
//   const oStyle = document.createElement("style");
//   const oDiv = document.createElement("div");

//   // oStyle.id = "app-loading-style";
//   // oStyle.innerHTML = styleContent;
//   // oDiv.className = "app-loading-wrap";
//   // oDiv.innerHTML = `<div class="${className}"><div></div></div>`;
//   // oDiv.insertAdjacentHTML(
//   //   "afterbegin",
//   //   `<video width=\"100%\" height=\"100%\" autoPlay>
//   //                           <source src=\"intro.mp4\" type=\"video/mp4\" />
//   //                         </video>`
//   // );
//   // return {
//   //   appendLoading() {
//   //     // safeDOM.append(document.head, oStyle);
//   //     safeDOM.append(document.body, oDiv);
//   //   },
//   //   removeLoading() {
//   //     // safeDOM.remove(document.head, oStyle);
//   //     safeDOM.remove(document.body, oDiv);
//   //   },
//   // };
// }

// // ----------------------------------------------------------------------

// // const { appendLoading, removeLoading } = useLoading();
// // domReady().then(appendLoading);

// const APP_DIR = "E:\\Projects\\app";
// // const APP_DIR = "C:\\app\\kmpk_desktop";

// // console.log("dirrrr", `${APP_DIR}/settings.json`);

// window.onmessage = ({ data }) => {
//   if (data.event === "getSettings") {
//     const settings = JSON.parse(
//       fs.readFileSync(`${APP_DIR}\\settings.json`, "utf8")
//     );
//     // console.log("sssss", settings);
//     postMessage({ event: "gotSettings", data: settings });
//     return settings;
//   }
// };
// // if (ev.data.payload === "writeToFile") {
// //   fs.writeFile("../../../data.csv", "Hey there!", function (err) {
// //     if (err) {
// //       return console.log(err);
// //     }
// //     console.log("The file was saved!");
// //   });
// // }
// // ev.data.payload === "removeLoading" && removeLoading();

// // setTimeout(removeLoading, 8999);

// enum DeviceTypeVariants {
//   Hydro = "Hydro",
//   Ground = "Ground",
// }

// interface IMeasurePoint {
//   id: string;
//   number: number;
//   h2: number;
//   maxH2: number;
//   gps: { Lat: number; Long: number };
//   moi: number;
//   ph: number;
//   temp: string;
//   // type: DeviceTypeVariants;
// }

// interface IDataToServer {
//   start_time?: string;
//   end_time?: string;
//   object: { name: string; point_number: string };
//   user: {
//     full_name: string;
//     position: string;
//     org_name: string;
//   };
//   points: IMeasurePoint[];
// }

// let sampleData: IDataToServer = {
//   start_time: "10:43",
//   end_time: "11:43",
//   object: { name: "Объект 1", point_number: "10" },
//   user: {
//     full_name: "Угаров Александр Вилорьевич",
//     position: "Замерщик",
//     org_name: 'ИЦ "УГНТУ"',
//   },
//   points: [
//     {
//       number: 1,
//       id: "guid",
//       temp: "-0.0",
//       h2: 3,
//       maxH2: 10,
//       ph: 5.1,
//       moi: 100.0,
//       gps: { Lat: 0.2222222, Long: 0.1111111 },
//     },
//     {
//       number: 2,
//       id: "guid",
//       temp: "-0.0",
//       h2: 3,
//       maxH2: 10,
//       ph: 5.1,
//       moi: 100.0,
//       gps: { Lat: 0.2222222, Long: 0.1111111 },
//     },
//   ],
// };

/* eslint-disable @typescript-eslint/no-explicsettingsit-any */
import fs from "fs";
import electron, { contextBridge, app, BrowserWindow } from "electron";
import { electronAPI } from "@electron-toolkit/preload";
// import { io } from 'socket.io-client'

// Custom APIs for renderer

// const APP_DIR = "E:\\Projects\\app";
const APP_DIR = "/home/dmitry/projects/kmpk_desktop";
// const APP_DIR = "C:\\app\\kmpk_desktop";

const api = {
  test: (callback: any) => {
    callback(app);
    // return { app: app.getAppVersion() }
  },
  getSettings: (): string => {
    const settings = JSON.parse(
      fs.readFileSync(
        `/home/dmitry/projects/kmpk_desktop/settings.json`,
        "utf8"
      )
    );
    return settings;
  },

  changeSettingsByKey: (key: string, value: string): void => {
    const APP_DIR = getAppDir();
    const settings = JSON.parse(
      fs.readFileSync(
        `/home/dmitry/projects/kmpk_desktop/settings.json`,
        "utf8"
      )
    );
    // console.log('beforeeee', settings)
    settings[key] = value;
    // console.log('afterrrr', settings)
    fs.writeFileSync(
      `${APP_DIR}/settings.json`,
      JSON.stringify(settings, null, 2)
    );
    // app.relaunch()

    electron.BrowserWindow.getAllWindows()[0].reload();
  },

  restartApp: () => {
    electron.BrowserWindow.getAllWindows()[0].reload();
  },
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}
