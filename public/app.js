const romInput = document.querySelector("#romInput");
const coreSelect = document.querySelector("#coreSelect");
const restartButton = document.querySelector("#restartButton");
const fullscreenButton = document.querySelector("#fullscreenButton");
const playButton = document.querySelector("#playButton");
const toggleConsoleButton = document.querySelector("#toggleConsoleButton");
const debugConsole = document.querySelector("#debugConsole");
const consoleOutput = document.querySelector("#consoleOutput");
const copyConsoleButton = document.querySelector("#copyConsoleButton");
const clearConsoleButton = document.querySelector("#clearConsoleButton");
const netplayEnabled = document.querySelector("#netplayEnabled");
const netplayServer = document.querySelector("#netplayServer");
const roomId = document.querySelector("#roomId");
const newRoomButton = document.querySelector("#newRoomButton");
const copyInviteButton = document.querySelector("#copyInviteButton");
const dropZone = document.querySelector("#dropZone");
const screen = document.querySelector("#screen");
const statusBadge = document.querySelector("#status");

let currentRom = null;
let emulatorAssetsPromise = null;
const debugLines = [];

const iceServers = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun.nextcloud.com:3478" },
  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject"
  },
  {
    urls: "turn:openrelay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject"
  }
];

function setStatus(message, state = "") {
  statusBadge.textContent = message;
  statusBadge.className = `status ${state}`.trim();
}

function formatLogValue(value) {
  if (value instanceof Error) {
    return value.stack || value.message;
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function addDebugLine(level, ...values) {
  const time = new Date().toLocaleTimeString();
  const line = `[${time}] ${level.toUpperCase()} ${values.map(formatLogValue).join(" ")}`;
  debugLines.push(line);

  if (debugLines.length > 500) {
    debugLines.shift();
  }

  consoleOutput.textContent = debugLines.join("\n");
  consoleOutput.scrollTop = consoleOutput.scrollHeight;

  if (["error", "warn"].includes(level)) {
    debugConsole.hidden = false;
    toggleConsoleButton.textContent = "Ocultar consola";
  }
}

function installConsoleCapture() {
  ["log", "info", "warn", "error"].forEach((level) => {
    const original = console[level].bind(console);
    console[level] = (...args) => {
      addDebugLine(level, ...args);
      original(...args);
    };
  });

  window.addEventListener("error", (event) => {
    addDebugLine("error", event.message, event.filename ? `${event.filename}:${event.lineno}:${event.colno}` : "");
  });

  window.addEventListener("unhandledrejection", (event) => {
    addDebugLine("error", event.reason || "Unhandled promise rejection");
  });

  window.addEventListener("netmam-electron-log", (event) => {
    addDebugLine(event.detail.level, ...event.detail.args);
  });
}

function clearScreen() {
  screen.replaceChildren();
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => {
      addDebugLine("info", "Script cargado", src);
      resolve();
    };
    script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    document.head.append(script);
  });
}

function loadStyle(href) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`link[href="${href}"]`)) {
      resolve();
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.onload = () => {
      addDebugLine("info", "CSS cargado", href);
      resolve();
    };
    link.onerror = () => reject(new Error(`No se pudo cargar ${href}`));
    document.head.append(link);
  });
}

function loadEmulatorAssets() {
  if (window.EmulatorJS) {
    return Promise.resolve();
  }

  if (!emulatorAssetsPromise) {
    emulatorAssetsPromise = Promise.all([
      loadStyle("https://cdn.emulatorjs.org/stable/data/emulator.min.css"),
      loadScript("https://cdn.emulatorjs.org/stable/data/emulator.min.js")
    ]).then(() => undefined);
  }

  return emulatorAssetsPromise;
}

function getNetplayConfig() {
  const enabled = netplayEnabled.checked;
  const server = normalizeServerUrl(netplayServer.value);
  const room = normalizeRoomId(roomId.value);

  return {
    enabled: enabled && Boolean(server) && Boolean(room),
    server,
    room
  };
}

function normalizeServerUrl(value) {
  return value.trim().replace(/\/+$/, "");
}

function normalizeRoomId(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createRoomId() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function saveNetplaySettings() {
  const settings = {
    enabled: netplayEnabled.checked,
    server: netplayServer.value.trim(),
    room: roomId.value.trim()
  };
  localStorage.setItem("netmam:netplay", JSON.stringify(settings));
}

function loadNetplaySettings() {
  const params = new URLSearchParams(window.location.search);
  const stored = JSON.parse(localStorage.getItem("netmam:netplay") || "{}");

  netplayEnabled.checked = params.get("netplay") === "1";
  netplayServer.value = params.get("server") || stored.server || "";
  roomId.value = params.get("room") || stored.room || createRoomId();
  saveNetplaySettings();
}

function buildInviteUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set("netplay", "1");
  url.searchParams.set("room", normalizeRoomId(roomId.value));

  const server = normalizeServerUrl(netplayServer.value);
  if (server) {
    url.searchParams.set("server", server);
  }

  return url.toString();
}

function buildEmulatorConfig(gameData, gameName, core, netplay) {
  const config = {
    gameUrl: gameData,
    dataPath: "https://cdn.emulatorjs.org/stable/data/",
    system: core,
    gameName,
    color: "#e5484d",
    backgroundColor: "#050606",
    controlScheme: "mame",
    startOnLoad: true,
    noAutoFocus: false,
    adTimer: -1,
    adMode: 0
  };

  if (netplay.enabled) {
    config.netplayUrl = netplay.server;
    config.gameId = netplay.room;
    window.EJS_netplayICEServers = iceServers;
    window.EJS_DEBUG_XX = true;
    window.EJS_EXPERIMENTAL_NETPLAY = true;
  }

  return config;
}

function closeEmulatorMenu() {
  const emulator = window.EJS_emulator;

  try {
    if (emulator?.menu?.close) {
      emulator.menu.close();
      addDebugLine("info", "Menu de EmulatorJS cerrado");
    }

    if (emulator?.elements?.parent) {
      emulator.elements.parent.focus();
    }
  } catch (error) {
    addDebugLine("warn", "No se pudo cerrar el menu", error);
  }
}

function getRomNameWarning(file) {
  const name = file.name.replace(/\.[^.]+$/, "");
  const core = coreSelect.value;

  if (!file.name.toLowerCase().endsWith(".zip")) {
    return "Para arcade/MAME usa un ZIP sin descomprimir";
  }

  if (["mame2003", "mame2003_plus", "fbneo"].includes(core) && /[\s()[\]]/.test(name)) {
    return "MAME necesita el nombre corto del set, ej: sf2.zip";
  }

  return "";
}

async function loadRom(file) {
  if (!file) return;

  currentRom = file;
  const netplay = getNetplayConfig();
  const warning = getRomNameWarning(file);
  addDebugLine("info", "ROM seleccionada", file.name, `${file.size} bytes`, "core", coreSelect.value);

  if (window.EJS_emulator?.callEvent) {
    window.EJS_emulator.callEvent("exit");
    addDebugLine("info", "Emulador anterior cerrado");
  }

  const game = document.createElement("div");
  game.id = "game";
  clearScreen();
  screen.append(game);
  restartButton.disabled = false;
  fullscreenButton.disabled = false;
  playButton.disabled = false;
  setStatus(warning || "Cargando EmulatorJS", warning ? "error" : "ready");

  try {
    const gameData = await file.arrayBuffer();
    addDebugLine("info", "ROM leida en memoria", `${gameData.byteLength} bytes`);
    await loadEmulatorAssets();
    window.EJS_DEBUG_XX = true;
    window.EJS_emulator = new window.EmulatorJS("#game", buildEmulatorConfig(gameData, file.name, coreSelect.value, netplay));
    addDebugLine("info", "EmulatorJS inicializado", file.name, coreSelect.value);
    window.EJS_emulator.on("ready", () => setStatus("Listo", "ready"));
    window.EJS_emulator.on("start", () => {
      addDebugLine("info", "Juego iniciado");
      setStatus(netplay.enabled ? "Netplay activo" : "Jugando", "ready");
      setTimeout(closeEmulatorMenu, 150);
      setTimeout(closeEmulatorMenu, 600);
    });
    window.EJS_emulator.on("exit", () => {
      addDebugLine("warn", "Emulador cerrado");
      setStatus("Emulador cerrado", "");
    });
  } catch (error) {
    addDebugLine("error", error);
    setStatus(error.message || "No se pudo cargar el emulador", "error");
  }
}

function restartCurrentGame() {
  if (currentRom) {
    loadRom(currentRom);
  }
}

async function openFullscreen() {
  const iframe = screen.querySelector("iframe");
  const target = iframe || screen;

  if (!document.fullscreenElement && target.requestFullscreen) {
    await target.requestFullscreen();
  }
}

romInput.addEventListener("change", (event) => {
  loadRom(event.target.files[0]);
});

coreSelect.addEventListener("change", () => {
  restartCurrentGame();
});

netplayEnabled.addEventListener("change", () => {
  saveNetplaySettings();
  restartCurrentGame();
});

netplayServer.addEventListener("change", () => {
  netplayServer.value = normalizeServerUrl(netplayServer.value);
  saveNetplaySettings();
  restartCurrentGame();
});

roomId.addEventListener("change", () => {
  roomId.value = normalizeRoomId(roomId.value) || createRoomId();
  saveNetplaySettings();
  restartCurrentGame();
});

newRoomButton.addEventListener("click", () => {
  roomId.value = createRoomId();
  netplayEnabled.checked = true;
  saveNetplaySettings();
  restartCurrentGame();
  setStatus("Sala creada", "ready");
});

copyInviteButton.addEventListener("click", async () => {
  netplayEnabled.checked = true;
  saveNetplaySettings();

  try {
    await navigator.clipboard.writeText(buildInviteUrl());
    setStatus("Link copiado", "ready");
  } catch {
    setStatus("No se pudo copiar", "error");
  }
});

restartButton.addEventListener("click", restartCurrentGame);
fullscreenButton.addEventListener("click", openFullscreen);
playButton.addEventListener("click", closeEmulatorMenu);

toggleConsoleButton.addEventListener("click", () => {
  debugConsole.hidden = !debugConsole.hidden;
  toggleConsoleButton.textContent = debugConsole.hidden ? "Mostrar consola" : "Ocultar consola";
});

clearConsoleButton.addEventListener("click", () => {
  debugLines.length = 0;
  consoleOutput.textContent = "";
});

copyConsoleButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(consoleOutput.textContent);
    setStatus("Consola copiada", "ready");
  } catch (error) {
    addDebugLine("error", error);
    setStatus("No se pudo copiar", "error");
  }
});

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("dragging");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragging");
});

dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("dragging");
  loadRom(event.dataTransfer.files[0]);
});

window.addEventListener("message", (event) => {
  if (event.data?.type === "netmam-ready") {
    setStatus("Listo", "ready");
  }

  if (event.data?.type === "netmam-started") {
    setStatus("Jugando", "ready");
  }

  if (event.data?.type === "netmam-error") {
    setStatus(event.data.message, "error");
  }
});

if ("serviceWorker" in navigator && ["http:", "https:"].includes(window.location.protocol)) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch(() => {
      setStatus("Online sin instalacion", "error");
    });
  });
}

loadNetplaySettings();
installConsoleCapture();
addDebugLine("info", "NetMAM listo");
