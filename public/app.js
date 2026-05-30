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

// Referencias del catálogo de ROMs
const catalogSearch = document.querySelector("#catalogSearch");
const catalogList = document.querySelector("#catalogList");
const downloadProgressOverlay = document.querySelector("#downloadProgressOverlay");
const downloadGameTitle = document.querySelector("#downloadGameTitle");
const downloadProgressBar = document.querySelector("#downloadProgressBar");
const downloadStatusText = document.querySelector("#downloadStatusText");
const cancelDownloadButton = document.querySelector("#cancelDownloadButton");
const corsWarningOverlay = document.querySelector("#corsWarningOverlay");
const corsDownloadLink = document.querySelector("#corsDownloadLink");
const closeCorsButton = document.querySelector("#closeCorsButton");

let currentAbortController = null;
let romsList = [];

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

async function copyToClipboard(text) {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    await navigator.clipboard.writeText(text);
    return;
  }

  // Fallback para contextos no seguros (HTTP / IPs locales)
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed"; // Evita scroll no deseado
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    const successful = document.execCommand("copy");
    if (!successful) {
      throw new Error("execCommand copy falló");
    }
  } catch (err) {
    throw new Error("No se pudo copiar el texto");
  } finally {
    document.body.removeChild(textarea);
  }
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
    config.netplayServer = netplay.server;
    config.gameId = netplay.room;
    config.gameID = netplay.room;
    
    // Variables de ventana globales para máxima compatibilidad con EmulatorJS
    window.EJS_netplayServer = netplay.server;
    window.EJS_netplayUrl = netplay.server;
    window.EJS_gameID = netplay.room;
    window.EJS_netplayICEServers = iceServers;
    window.EJS_DEBUG_XX = true;
    window.EJS_EXPERIMENTAL_NETPLAY = true;
  } else {
    // Limpieza de globales si Netplay está inactivo
    delete window.EJS_netplayServer;
    delete window.EJS_netplayUrl;
    delete window.EJS_gameID;
    delete window.EJS_netplayICEServers;
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

    // Esperar al siguiente cuadro de animación para que el navegador complete
    // el layout y tamaño real del contenedor #game en el DOM
    await new Promise((resolve) => requestAnimationFrame(resolve));
    void game.offsetHeight; // Forzar reflow de dimensiones
    void game.offsetWidth;

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
    await copyToClipboard(buildInviteUrl());
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
    await copyToClipboard(consoleOutput.textContent);
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

/* --- FUNCIONES Y EVENTOS DEL CATÁLOGO DE ROMS --- */

async function fetchCatalog() {
  try {
    addDebugLine("info", "Cargando catálogo de juegos...");
    const response = await fetch("/roms.json");
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    romsList = await response.json();
    addDebugLine("info", `Catálogo cargado con ${romsList.length} juegos`);
    renderCatalog(romsList);
  } catch (error) {
    addDebugLine("warn", "No se pudo cargar el catálogo online. Usando lista estática de respaldo.", error);
    // Lista de respaldo para que la app nunca se vea rota si falla el fetch del JSON
    romsList = [
      {
        "id": "robby",
        "name": "Robby Roto",
        "core": "mame2003",
        "rom": "robby.zip",
        "url": "https://archive.org/download/mame-0.78-roms-non-merged/robby.zip",
        "description": "Clásico arcade de 1981, liberado oficialmente por los autores para uso no comercial.",
        "category": "Libre"
      },
      {
        "id": "pacman",
        "name": "Pac-Man (Midway)",
        "core": "mame2003",
        "rom": "pacman.zip",
        "url": "https://archive.org/download/MAME2003_Reference_Set_for_RetroPie/roms/pacman.zip",
        "description": "El devorador de fantasmas más icónico de la historia de los videojuegos (1980).",
        "category": "Clásico"
      },
      {
        "id": "sf2",
        "name": "Street Fighter II: The World Warrior",
        "core": "mame2003",
        "rom": "sf2.zip",
        "url": "https://archive.org/download/MAME2003_Reference_Set_for_RetroPie/roms/sf2.zip",
        "description": "El legendario juego que definió el género de peleas uno contra uno en 1991.",
        "category": "Lucha"
      }
    ];
    renderCatalog(romsList);
  }
}

function renderCatalog(games) {
  catalogList.replaceChildren();

  if (games.length === 0) {
    const empty = document.createElement("div");
    empty.className = "catalog-empty";
    empty.textContent = "No se encontraron juegos";
    catalogList.append(empty);
    return;
  }

  games.forEach((game) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "catalog-item";
    item.dataset.id = game.id;
    
    // Asignar active si coincide con la ROM actual
    if (currentRom && currentRom.name === game.rom) {
      item.classList.add("active");
    }

    const categoryClass = game.category.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-");

    item.innerHTML = `
      <div class="catalog-item-header">
        <span class="catalog-item-title">${game.name}</span>
        <div class="catalog-item-badges">
          <span class="catalog-item-badge core-${game.core === 'fbneo' ? 'fbneo' : 'mame'}">${game.core === 'fbneo' ? 'FBNeo' : 'MAME 2003'}</span>
          <span class="catalog-item-badge cat-${categoryClass}">${game.category}</span>
        </div>
      </div>
      <div class="catalog-item-desc">${game.description}</div>
      <div class="catalog-item-actions">
        <span class="catalog-item-romname">${game.rom}</span>
        <span class="catalog-btn-play">Jugar</span>
      </div>
    `;

    item.addEventListener("click", () => {
      // Remover active de otros items
      catalogList.querySelectorAll(".catalog-item").forEach(el => el.classList.remove("active"));
      item.classList.add("active");
      
      playFromCatalog(game);
    });

    catalogList.append(item);
  });
}

async function playFromCatalog(game) {
  // Cancelar descarga activa si existe
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }

  // Ocultar cualquier error CORS activo
  corsWarningOverlay.hidden = true;

  // Actualizar el selector de Core al core requerido por este juego
  coreSelect.value = game.core;

  // Inicializar controlador para poder cancelar la descarga
  currentAbortController = new AbortController();

  // Mostrar el overlay de progreso de descarga
  downloadGameTitle.textContent = game.name;
  downloadProgressBar.style.width = "0%";
  downloadStatusText.textContent = "Iniciando descarga...";
  downloadProgressOverlay.hidden = false;
  setStatus(`Descargando ${game.name}...`, "ready");

  try {
    addDebugLine("info", "Descargando ROM...", game.name, `desde ${game.url}`);
    
    const response = await fetch(game.url, {
      signal: currentAbortController.signal
    });

    if (!response.ok) {
      throw new Error(`Error de servidor: ${response.status} ${response.statusText}`);
    }

    const contentLength = response.headers.get("content-length");
    if (!contentLength) {
      addDebugLine("warn", "No se detectó cabecera Content-Length, el progreso será impreciso.");
    }

    const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
    let receivedBytes = 0;

    const reader = response.body.getReader();
    const chunks = [];

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      chunks.push(value);
      receivedBytes += value.length;

      if (totalBytes > 0) {
        const percent = Math.round((receivedBytes / totalBytes) * 100);
        downloadProgressBar.style.width = `${percent}%`;
        downloadStatusText.textContent = `${percent}% descargado (${(receivedBytes / 1024 / 1024).toFixed(1)} MB / ${(totalBytes / 1024 / 1024).toFixed(1)} MB)`;
      } else {
        downloadStatusText.textContent = `Descargando... (${(receivedBytes / 1024 / 1024).toFixed(1)} MB descargados)`;
      }
    }

    // Unir todos los fragmentos descargados
    const romBlob = new Blob(chunks, { type: "application/zip" });
    const file = new File([romBlob], game.rom, { type: "application/zip" });

    // Ocultar overlay de descarga
    downloadProgressOverlay.hidden = true;
    currentAbortController = null;

    // Cargar la ROM en el emulador
    await loadRom(file);

  } catch (error) {
    if (error.name === "AbortError") {
      addDebugLine("warn", "Descarga cancelada por el usuario");
      setStatus("Descarga cancelada", "");
      downloadProgressOverlay.hidden = true;
      return;
    }

    addDebugLine("error", "Error al descargar la ROM", error);
    downloadProgressOverlay.hidden = true;

    // Mostrar el overlay alternativo para CORS o fallo de red
    corsDownloadLink.href = game.url;
    corsDownloadLink.setAttribute("download", game.rom);
    corsWarningOverlay.hidden = false;
    setStatus("Error de conexión directa (CORS)", "error");
  }
}

// Escuchar cambios en la barra de búsqueda
catalogSearch.addEventListener("input", (event) => {
  const query = event.target.value.toLowerCase().trim();
  const filtered = romsList.filter((game) => {
    return game.name.toLowerCase().includes(query) || 
           game.rom.toLowerCase().includes(query) ||
           game.description.toLowerCase().includes(query) ||
           game.category.toLowerCase().includes(query);
  });
  renderCatalog(filtered);
});

// Cancelar descarga activa
cancelDownloadButton.addEventListener("click", () => {
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }
  downloadProgressOverlay.hidden = true;
});

// Cerrar el diálogo de CORS
closeCorsButton.addEventListener("click", () => {
  corsWarningOverlay.hidden = true;
});

loadNetplaySettings();
installConsoleCapture();
fetchCatalog();
addDebugLine("info", "NetMAM listo");
