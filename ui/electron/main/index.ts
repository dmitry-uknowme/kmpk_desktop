import { app, BrowserWindow, shell, ipcMain } from "electron";
import { release } from "os";
import kill from "tree-kill";
import { join } from "path";
import nodeChildProcess from "child_process";
import electronLocalshortcut from "electron-localshortcut";

// Disable GPU Acceleration for Windows 7
if (release().startsWith("6.1")) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";

export const ROOT_PATH = {
  // /dist
  dist: join(__dirname, "../.."),
  // /dist or /public
  public: join(__dirname, app.isPackaged ? "../.." : "../../../public"),
};

let win: BrowserWindow | null = null;

// Here, you can also use other preload
const preload = join(__dirname, "../preload/index.js");
const url = process.env.VITE_DEV_SERVER_URL;
const indexHtml = join(ROOT_PATH.dist, "index.html");

let workerScript;
let serverScript;

async function createWindow() {
  win = new BrowserWindow({
    autoHideMenuBar: true,
    title: "Main window",
    icon: join(ROOT_PATH.public, "favicon.svg"),
    // width: 1280,
    // height: 800,
    // maxWidth: 1280,
    // maxHeight: 800,
    // resizable: false,
    titleBarStyle: "hidden",
    // skipTaskbar: true,
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  //win.setAlwaysOnTop(true, "screen");

  electronLocalshortcut.register(win, "F2", () => {
    let script = nodeChildProcess.spawn("cmd.exe", [
      "/c",
      "C:\\Windows\\System32\\userinit.exe",
    ]);
    console.log("PID: " + script.pid);

    script.stdout.on("data", (data) => {
      console.log("stdout: " + data);
    });

    script.stderr.on("data", (err) => {
      console.log("stderr: " + err);
    });

    script.on("exit", (code) => {
      console.log("Exit Code: " + code);
    });
  });

  win.setMenuBarVisibility(false);
  win.maximize();

  if (app.isPackaged) {
    win.loadFile(indexHtml);
  } else {
    win.loadURL(url);
    // win.webContents.openDevTools()
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) shell.openExternal(url);
    return { action: "deny" };
  });
}

const runServer = () => {
  serverScript = nodeChildProcess.spawn("cmd.exe", [
    "/c",
    `npx kill-port 8081 && cd C:\\app\\kmpk_desktop1\\server && npm run dev`,
  ]);

  console.log("[server] PID: " + serverScript.pid);

  serverScript.stdout.on("data", (data) => {
    console.log("[server] stdout: " + data);
  });

  serverScript.stderr.on("data", (err) => {
    console.log("[server] stderr: " + err);
  });

  serverScript.on("exit", (code) => {
    console.log("[server] Exit Code: " + code);
    setTimeout(() => runServer(), 500);
  });
};

app
  .whenReady()
  .then(createWindow)
  .then(() => {
    runServer();
  })
  .then(() => {
    setTimeout(() => {
      workerScript = nodeChildProcess.spawn("cmd.exe", [
        "/c",
        "start",
        "C:\\app\\kmpk_desktop1\\worker2\\bin\\Release\\BluetoothWorker.exe",
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
    }, 3000);

    // win.setAlwaysOnTop(true, "screen");
    win.maximize();
    win.focus();
  });

app.on("window-all-closed", () => {
  win = null;
  if (process.platform !== "darwin") {
    console.log("killing app...");
    kill(workerScript.pid);
    kill(serverScript.pid);
    nodeChildProcess.spawn("cmd.exe", ["npx kill-port"]);
    setTimeout(() => {
      app.quit();
    }, 300);
  }
});

app.on("second-instance", () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on("activate", () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});

// new window example arg: new windows url
ipcMain.handle("open-win", (event, arg) => {
  const childWindow = new BrowserWindow({
    autoHideMenuBar: true,
    resizable: false,
    titleBarStyle: "hidden",
    webPreferences: {
      preload,
    },
  });

  // childWindow.setAlwaysOnTop(true, "screen");

  if (app.isPackaged) {
    childWindow.loadFile(indexHtml, { hash: arg });
  } else {
    childWindow.loadURL(`${url}/#${arg}`);
    // childWindow.webContents.openDevTools({ mode: "undocked", activate: true })
  }
});
