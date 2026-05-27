const path = require("node:path");
const { app, BrowserWindow, Menu, shell } = require("electron");

const isDev = !app.isPackaged;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 760,
    minWidth: 960,
    minHeight: 620,
    backgroundColor: "#111314",
    title: "NetMAM",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, "..", "public", "index.html"));

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("console-message", (_event, level, message, line, sourceId) => {
    const levelNames = ["log", "warn", "error", "info"];
    const logLevel = levelNames[level] || "log";
    mainWindow.webContents.executeJavaScript(
      `window.dispatchEvent(new CustomEvent("netmam-electron-log", { detail: ${JSON.stringify({
        level: logLevel,
        args: [`${message} (${sourceId}:${line})`]
      })} }));`
    ).catch(() => {});
  });

  mainWindow.webContents.on("before-input-event", (event, input) => {
    const opensDevTools =
      input.key === "F12" ||
      (input.control && input.shift && input.key.toLowerCase() === "i");

    if (opensDevTools && input.type === "keyDown") {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  if (isDev || process.env.NETMAM_DEVTOOLS === "1") {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }
}

app.setAppUserModelId("com.netmam.arcade");

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
