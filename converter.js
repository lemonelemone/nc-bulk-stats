import { Muxer, ArrayBufferTarget } from "./vendor/mp4-muxer.mjs";

const SOURCE_FPS = 60;
const REGULATION_TICKS = 5 * 60 * SOURCE_FPS;
const MAX_GOAL_CELEBRATION_TICKS = 6 * SOURCE_FPS;
const WORLD_WIDTH = 100;
const WORLD_HEIGHT = 56.25;
const PLAYER_RADIUS = 0.6103515625;
const BALL_RADIUS = 0.9765625;
const TWENTY_MB = 20_000_000;
const APPEARANCE_DB = "nc-replay-tools-appearance";
const APPEARANCE_STORE = "assets";
const APPEARANCE_SETTINGS = "nc-replay-tools-appearance-settings";
const FPS_WARNING_DISMISSED = "nc-replay-tools-hide-fps-quality-warning";
const SKIN_TYPES = ["pitch", "background", "ball", "blue", "red"];
const MAX_SKIN_BYTES = 5 * 1024 * 1024;
const ANOL_SKIN_BASE = "https://raw.githubusercontent.com/anilkaradeniz/tampermonkey-scripts/4a8f7c0383830d944dbb07bd14a88a2b7116d3ac/skins";
const ANOL_SKINS = {
  pitch: { folder: "field", names: ["bigstripes", "cartoonish-grass-min", "cartoonish-grass", "checkerboard", "dark-glowy", "dead-grass", "football", "neon", "plain", "premier", "round", "snowy", "stripes", "tennis2", "TT-ameliore", "VVV-dark", "VVV", "xmas"] },
  background: { folder: "bg", names: ["blue", "dark", "xdark"] },
  ball: { folder: "ball", names: ["black", "bright-diamond", "classic", "diamond", "gold", "winter"] },
  blue: { folder: "blue", names: ["bright", "ghost", "liverpool", "pacman"] },
  red: { folder: "red", names: ["bright", "ghost", "liverpool", "pacman"] }
};
const BOOST_POSITIONS = [
  15.696192, 47.998825, 15.696192, 8.251172, 14.100928, 28.125,
  35.927097, 34.41909, 35.927097, 21.83091, 50, 50.166016,
  50, 34.41909, 50, 21.83091, 50, 6.0839844,
  64.0729, 34.41909, 64.0729, 21.83091, 84.30381, 47.998825,
  85.85269, 28.125, 84.30381, 8.251172
];
const EVENT_NAMES = [
  "Goal", "Assist", "Save", "Long Goal", "Overtime Goal", "Hat Trick",
  "Shot On Goal", "Center Ball", "Clear Ball", "First Touch", "Victory"
];

const $ = (id) => document.getElementById(id);
const spriteFrames = {
  ball: { x: 1432, y: 888, w: 128, h: 128 },
  blue: { x: 132, y: 2, w: 128, h: 128 },
  red: { x: 1432, y: 628, w: 128, h: 128 },
  playerBoost: { x: 1174, y: 266, w: 96, h: 96 },
  boostPad: { x: 2, y: 132, w: 128, h: 128 }
};
const gameAssets = { playfield: new Image(), sprites: new Image(), background: new Image(), custom: {}, ready: false };
const customAssetUrls = new Map();
const customAssetNames = new Map();
const tintedPlayers = { blue: null, red: null };
const gameAssetsReady = Promise.all([
  loadImage(gameAssets.playfield, "./assets/playfield-1.png"),
  loadImage(gameAssets.sprites, "./assets/spritesheet4.png"),
  loadImage(gameAssets.background, "./assets/bgtile.png"),
  document.fonts?.load ? document.fonts.load("36px Cartwheel") : Promise.resolve()
]).then(async () => {
  gameAssets.ready = true;
  await restoreAppearance();
  rebuildTintedPlayers();
  drawPreview();
});

const ui = {
  stats: $("statsSection"), clips: $("clipsSection"), input: $("clipFileInput"),
  dropzone: $("clipDropzone"), stage: $("replayStage"), canvas: $("replayCanvas"), fullscreen: $("replayFullscreen"), play: $("playPause"),
  hoverControls: $("replayHoverControls"), skipBackFive: $("skipBackFive"), skipForwardFive: $("skipForwardFive"), setClipStartHere: $("setClipStartHere"), setClipEndHere: $("setClipEndHere"),
  playhead: $("playhead"), readout: $("timeReadout"), rangeReadout: $("clipRangeReadout"), startSlider: $("clipStartSlider"),
  endSlider: $("clipEndSlider"), start: $("clipStart"), end: $("clipEnd"),
  camera: $("cameraMode"), resolution: $("resolution"), fps: $("frameRate"),
  showScoreboard: $("showScoreboard"), showEvents: $("showEvents"),
  export: $("exportMp4"), sizeLimit: $("sizeLimit"), exportStatus: $("exportStatus"), progress: $("exportProgress"),
  eventList: $("eventList"), eventCount: $("eventCount"), qualityWarning: $("qualityWarning"),
  qualityWarningText: $("qualityWarningText"), dismissQualityWarning: $("dismissQualityWarning"),
  tintCharacters: $("tintCharacters"), blueColour: $("blueCharacterColour"), redColour: $("redCharacterColour"),
  nameDistance: $("nameDistance"), nameDistanceValue: $("nameDistanceValue"), nameSize: $("nameSize"), nameSizeValue: $("nameSizeValue"), nameColour: $("nameColour"),
  resetAppearance: $("resetAppearance"), preview: $("previewClip"), previewOverlay: $("clipPreviewOverlay"),
  previewStage: $("clipPreviewStage"), previewCanvas: $("clipPreviewCanvas"), previewClose: $("closeClipPreview"),
  previewPlay: $("clipPreviewPlay"), previewPlayBelow: $("clipPreviewPlayBelow"),
  previewTime: $("clipPreviewTime"), previewTimeBelow: $("clipPreviewTimeBelow"),
  previewFullscreen: $("clipPreviewFullscreen"), previewFullscreenBelow: $("clipPreviewFullscreenBelow")
};

let replay = null;
let currentTime = 0;
let playing = false;
let previousAnimationTime = 0;
let animationId = 0;
let exporting = false;
let followZoom = 1;
let appearanceSettings = readAppearanceSettings();
let clipPreviewStart = 0;
let clipPreviewEnd = 0;
let clipPreviewTime = 0;
let clipPreviewPlaying = false;
let clipPreviewPreviousTime = 0;
let clipPreviewAnimation = 0;
let qualityWarningDismissed = false;
try { qualityWarningDismissed = localStorage.getItem(FPS_WARNING_DISMISSED) === "1"; } catch (_) {}

document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((item) => item.classList.toggle("active", item === button));
    const showClips = button.dataset.tool === "clips";
    ui.stats.hidden = showClips;
    document.querySelectorAll(".stats-part").forEach((element) => { element.hidden = showClips; });
    ui.clips.hidden = !showClips;
    if (!showClips) stopPlayback();
    if (showClips && replay) drawPreview();
  });
});

ui.input.addEventListener("change", () => loadReplayFile(ui.input.files[0]));
ui.dropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
  ui.dropzone.classList.add("drag-over");
});
ui.dropzone.addEventListener("dragleave", () => ui.dropzone.classList.remove("drag-over"));
ui.dropzone.addEventListener("drop", (event) => {
  event.preventDefault();
  ui.dropzone.classList.remove("drag-over");
  loadReplayFile(Array.from(event.dataTransfer.files).find((file) => file.name.toLowerCase().endsWith(".ncr")));
});

ui.play.addEventListener("click", () => playing ? stopPlayback() : startPlayback());
ui.fullscreen.addEventListener("click", toggleReplayFullscreen);
ui.skipBackFive.addEventListener("click", () => setCurrentTime(currentTime - 5));
ui.skipForwardFive.addEventListener("click", () => setCurrentTime(currentTime + 5));
ui.setClipStartHere.addEventListener("click", () => setClipBoundary("start", currentTime));
ui.setClipEndHere.addEventListener("click", () => setClipBoundary("end", currentTime));
document.addEventListener("fullscreenchange", () => { syncReplayFullscreen(); syncClipPreviewFullscreen(); });
ui.preview.addEventListener("click", openClipPreview);
ui.previewClose.addEventListener("click", closeClipPreview);
ui.previewPlay.addEventListener("click", toggleClipPreviewPlayback);
ui.previewPlayBelow.addEventListener("click", toggleClipPreviewPlayback);
ui.previewFullscreen.addEventListener("click", toggleClipPreviewFullscreen);
ui.previewFullscreenBelow.addEventListener("click", toggleClipPreviewFullscreen);
ui.previewOverlay.addEventListener("click", (event) => { if (event.target === ui.previewOverlay) closeClipPreview(); });
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !ui.previewOverlay.hidden && !document.fullscreenElement) closeClipPreview();
});
ui.playhead.addEventListener("input", () => setCurrentTime(Number(ui.playhead.value)));
ui.camera.addEventListener("change", drawPreview);
ui.fps.addEventListener("change", updateQualityWarning);
ui.dismissQualityWarning.addEventListener("click", () => {
  qualityWarningDismissed = true;
  try { localStorage.setItem(FPS_WARNING_DISMISSED, "1"); } catch (_) {}
  updateQualityWarning();
});
ui.showScoreboard.addEventListener("change", drawPreview);
ui.showEvents.addEventListener("change", drawPreview);
ui.canvas.addEventListener("wheel", (event) => {
  if (!replay || ui.camera.value !== "ball") return;
  event.preventDefault();
  followZoom = clamp(followZoom * Math.exp(-event.deltaY * .001), .65, 3);
  updateCameraZoomLabel();
  drawPreview();
}, { passive: false });
ui.startSlider.addEventListener("input", () => setClipBoundary("start", Number(ui.startSlider.value)));
ui.endSlider.addEventListener("input", () => setClipBoundary("end", Number(ui.endSlider.value)));
ui.start.addEventListener("change", () => setClipBoundary("start", parseTime(ui.start.value)));
ui.end.addEventListener("change", () => setClipBoundary("end", parseTime(ui.end.value)));
ui.sizeLimit.addEventListener("click", () => {
  const enabled = ui.sizeLimit.getAttribute("aria-pressed") !== "true";
  ui.sizeLimit.setAttribute("aria-pressed", String(enabled));
  ui.sizeLimit.textContent = `Keep under 20 MB: ${enabled ? "On" : "Off"}`;
  updateQualityWarning();
});
ui.export.addEventListener("click", exportMp4);

document.querySelectorAll("[data-skin]").forEach((input) => input.addEventListener("change", () => {
  const preset = document.querySelector(`[data-skin-preset="${input.dataset.skin}"]`);
  if (preset) preset.value = "";
  importSkin(input.dataset.skin, input.files?.[0]);
}));
document.querySelectorAll("[data-skin-reset]").forEach((button) => button.addEventListener("click", () => resetSkin(button.dataset.skinReset)));
populateAnolPresets();
document.querySelectorAll("[data-skin-preset]").forEach((select) => select.addEventListener("change", () => {
  if (select.value) applyAnolPreset(select.dataset.skinPreset, select.value);
}));
ui.tintCharacters.checked = appearanceSettings.tint;
ui.blueColour.value = appearanceSettings.blue;
ui.redColour.value = appearanceSettings.red;
ui.nameDistance.value = String(appearanceSettings.nameDistance);
ui.nameSize.value = String(appearanceSettings.nameSize);
ui.nameColour.value = appearanceSettings.nameColour;
syncNameplateControls();
syncCharacterColourControls();
ui.tintCharacters.addEventListener("change", () => {
  appearanceSettings.tint = ui.tintCharacters.checked;
  saveAppearanceSettings();
  syncCharacterColourControls();
  rebuildTintedPlayers();
  drawPreview();
});
for (const input of [ui.blueColour, ui.redColour]) input.addEventListener("input", () => {
  appearanceSettings.blue = ui.blueColour.value;
  appearanceSettings.red = ui.redColour.value;
  saveAppearanceSettings();
  rebuildTintedPlayers();
  drawPreview();
});
for (const input of [ui.nameDistance, ui.nameSize]) input.addEventListener("input", () => {
  appearanceSettings.nameDistance = Number(ui.nameDistance.value);
  appearanceSettings.nameSize = Number(ui.nameSize.value);
  syncNameplateControls();
  saveAppearanceSettings();
  drawPreview();
});
for (const input of [ui.nameDistanceValue, ui.nameSizeValue]) input.addEventListener("input", () => updateNameplateFromTypedValue(input));
for (const input of [ui.nameDistanceValue, ui.nameSizeValue]) input.addEventListener("change", () => {
  updateNameplateFromTypedValue(input);
  syncNameplateControls();
});
ui.nameColour.addEventListener("input", () => {
  appearanceSettings.nameColour = ui.nameColour.value;
  saveAppearanceSettings();
  drawPreview();
});
ui.resetAppearance.addEventListener("click", resetAllAppearance);

async function loadReplayFile(file) {
  if (!file) return;
  stopPlayback();
  setStatus("Reading replay…");
  try {
    const buffer = await file.arrayBuffer();
    replay = parseNcr(buffer, file.name);
    followZoom = 1;
    updateCameraZoomLabel();
    currentTime = 0;
    const duration = replay.duration;
    for (const element of [ui.playhead, ui.startSlider, ui.endSlider]) {
      element.max = String(duration);
      element.disabled = false;
    }
    ui.playhead.value = "0";
    ui.startSlider.value = "0";
    ui.endSlider.value = String(Math.min(duration, 10));
    for (const element of [ui.play, ui.fullscreen, ui.preview, ui.start, ui.end, ui.camera, ui.resolution, ui.fps, ui.showScoreboard, ui.showEvents, ui.export, ui.sizeLimit]) {
      element.disabled = false;
    }
    ui.hoverControls.hidden = false;
    ui.start.value = formatTime(0, true);
    ui.end.value = formatTime(Math.min(duration, 10), true);
    renderEvents();
    setStatus(`${file.name} • ${formatTime(duration)} • ${replay.playerCount} players • ${replay.events.length} events`);
    updateReadout();
    drawPreview();
  } catch (error) {
    console.error(error);
    replay = null;
    ui.hoverControls.hidden = true;
    setStatus(`Couldn’t read this replay: ${error.message}`);
  }
}

function parseNcr(buffer, filename) {
  const view = new DataView(buffer);
  if (view.byteLength < 17) throw new Error("file is too small");
  const version = view.getInt32(0, false);
  const layout = view.getUint8(4);
  const map = view.getInt32(5, false);
  const frameCount = view.getInt32(9, false);
  if (version !== 1 || frameCount <= 0 || frameCount > 10_000_000) throw new Error("unsupported NCR format");

  const candidates = [];
  for (let playerCount = 2; playerCount <= 20; playerCount += 2) {
    for (let boostCount = 0; boostCount <= 64; boostCount++) {
      const frameSize = 4 + 33 * playerCount + 24 + boostCount;
      const footerOffset = 13 + frameCount * frameSize;
      if (footerOffset + 4 > view.byteLength) continue;
      const parsed = tryParseEvents(view, footerOffset, frameCount);
      if (parsed) candidates.push({ playerCount, boostCount, frameSize, footerOffset, events: parsed });
    }
  }
  if (!candidates.length) throw new Error("could not find the replay frames");
  candidates.sort((a, b) => scoreCandidate(b) - scoreCandidate(a));
  const format = candidates[0];
  const parsedReplay = {
    buffer, view, filename, version, layout, map, frameCount,
    duration: (frameCount - 1) / SOURCE_FPS,
    ...format
  };
  parsedReplay.clockPauses = findGoalCelebrationPauses(parsedReplay);
  parsedReplay.overtimeTick = parsedReplay.events.find((event) => event.type === 203)?.tick ?? null;
  return parsedReplay;
}

// Bulk Stats and the clip viewer share this structural NCR parser. Keeping one
// parser prevents the stats page from losing events after reconnects, player
// replacements or long overtime matches.
window.NcrReplayParser = Object.freeze({ parseNcr });
window.dispatchEvent(new Event("ncr-replay-parser-ready"));

function findGoalCelebrationPauses(parsedReplay) {
  const pauses = [];
  for (const goal of parsedReplay.events.filter((event) => event.type === 202)) {
    const searchEnd = Math.min(parsedReplay.frameCount - 1, goal.tick + MAX_GOAL_CELEBRATION_TICKS);
    for (let tick = goal.tick + 1; tick <= searchEnd; tick++) {
      const ballOffset = 13 + tick * parsedReplay.frameSize + 4 + 33 * parsedReplay.playerCount;
      const x = parsedReplay.view.getFloat32(ballOffset, false);
      const y = parsedReplay.view.getFloat32(ballOffset + 4, false);
      if (Math.abs(x - 50) < .0001 && Math.abs(y - WORLD_HEIGHT / 2) < .0001) {
        const duration = Math.max(0, tick - goal.tick - 1);
        if (duration) pauses.push({ goalTick: goal.tick, duration });
        break;
      }
    }
  }
  return pauses;
}

function gameplayTickAt(replayTick) {
  let gameplayTick = Math.max(0, replayTick);
  for (const pause of replay.clockPauses) {
    gameplayTick -= Math.min(Math.max(0, replayTick - pause.goalTick), pause.duration);
  }
  return gameplayTick;
}

function matchClockAt(replayTick) {
  const gameplayTick = gameplayTickAt(replayTick);
  if (replay.overtimeTick !== null && replayTick >= replay.overtimeTick) {
    const overtimeSeconds = Math.max(0, Math.floor((gameplayTick - REGULATION_TICKS) / SOURCE_FPS));
    return `+${Math.floor(overtimeSeconds / 60)}:${String(overtimeSeconds % 60).padStart(2, "0")}`;
  }
  const remainingSeconds = Math.max(0, 5 * 60 - Math.floor(gameplayTick / SOURCE_FPS));
  return `${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, "0")}`;
}

function scoreCandidate(candidate) {
  return (candidate.boostCount === 14 ? 100 : 0) + (candidate.playerCount <= 10 ? 20 : 0) + candidate.events.length;
}

function tryParseEvents(view, offset, frameCount) {
  const eventCount = view.getInt32(offset, false);
  if (eventCount < 0 || eventCount > 100_000) return null;
  const events = [];
  let pos = offset + 4;
  try {
    for (let i = 0; i < eventCount; i++) {
      if (pos + 13 > view.byteLength) return null;
      const tick = view.getInt32(pos, false);
      const type = view.getUint8(pos + 4);
      const slot1 = view.getUint8(pos + 5);
      const slot2 = view.getUint8(pos + 6);
      const speed = view.getFloat32(pos + 7, false);
      const nameLength = view.getUint16(pos + 11, false);
      const size = 13 + nameLength * 2;
      if (tick < 0 || tick > frameCount + 600 || nameLength > 1000 || pos + size > view.byteLength) return null;
      let name = "";
      for (let j = 0; j < nameLength; j++) name += String.fromCharCode(view.getUint16(pos + 13 + j * 2, false));
      events.push({ tick, type, slot1, slot2, speed, name });
      pos += size;
    }
  } catch (_) {
    return null;
  }
  return pos === view.byteLength ? events : null;
}

function readFrame(time) {
  const exact = clamp(time * SOURCE_FPS, 0, replay.frameCount - 1);
  const aIndex = Math.floor(exact);
  const bIndex = Math.min(aIndex + 1, replay.frameCount - 1);
  const alpha = exact - aIndex;
  const a = readRawFrame(aIndex);
  const b = alpha ? readRawFrame(bIndex) : a;
  const players = a.players.map((player, index) => ({
    x: lerp(player.x, b.players[index].x, alpha),
    y: lerp(player.y, b.players[index].y, alpha),
    angle: lerpAngle(player.angle, b.players[index].angle, alpha),
    boost: player.boost
  }));
  return {
    tick: exact,
    players,
    boosts: a.boosts,
    ball: {
      x: lerp(a.ball.x, b.ball.x, alpha),
      y: lerp(a.ball.y, b.ball.y, alpha),
      angle: lerpAngle(a.ball.angle, b.ball.angle, alpha)
    }
  };
}

function readRawFrame(index) {
  const { view, frameSize, playerCount } = replay;
  let pos = 13 + index * frameSize + 4;
  const players = [];
  for (let i = 0; i < playerCount; i++) {
    players.push({
      x: view.getFloat32(pos + 4 * i, false),
      y: view.getFloat32(pos + 4 * playerCount + 4 * i, false),
      angle: view.getFloat32(pos + 8 * playerCount + 4 * i, false),
      boost: view.getUint8(pos + 32 * playerCount + i) > 0
    });
  }
  pos += 33 * playerCount;
  const ballPos = pos;
  const boosts = [];
  for (let i = 0; i < replay.boostCount; i++) boosts.push(view.getUint8(ballPos + 24 + i) > 0);
  return {
    players,
    boosts,
    ball: {
      x: view.getFloat32(ballPos, false),
      y: view.getFloat32(ballPos + 4, false),
      angle: view.getFloat32(ballPos + 8, false)
    }
  };
}

function renderFrame(canvas, time, cameraMode, showScoreboard, showEvents, zoom = 1) {
  const ctx = canvas.getContext("2d", { alpha: false });
  const width = canvas.width;
  const height = canvas.height;
  const state = readFrame(time);
  const full = cameraMode === "full";
  let worldWidth = full ? 94 : 52 / zoom;
  let worldHeight = full ? 52.25 : worldWidth * height / width;
  const aspect = width / height;
  if (worldHeight * aspect < worldWidth) worldHeight = worldWidth / aspect;
  else worldWidth = worldHeight * aspect;
  let cx = 50;
  let cy = WORLD_HEIGHT / 2;
  if (!full) {
    cx = clamp(state.ball.x, worldWidth / 2, WORLD_WIDTH - worldWidth / 2);
    cy = clamp(state.ball.y, worldHeight / 2, WORLD_HEIGHT - worldHeight / 2);
  }
  const scale = width / worldWidth;
  const worldLeft = cx - worldWidth / 2;
  const worldTop = cy - worldHeight / 2;
  const sx = (x) => (x - worldLeft) * scale;
  const sy = (y) => (y - worldTop) * scale;

  const backgroundImage = gameAssets.custom.background || gameAssets.background;
  const backgroundPattern = gameAssets.ready ? ctx.createPattern(backgroundImage, "repeat") : null;
  if (backgroundPattern?.setTransform) backgroundPattern.setTransform(new DOMMatrix().scale(Math.max(1, scale * .1)));
  ctx.fillStyle = backgroundPattern || "#eef0f1";
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  if (gameAssets.ready) {
    ctx.drawImage(gameAssets.custom.pitch || gameAssets.playfield, sx(0), sy(0), WORLD_WIDTH * scale, WORLD_HEIGHT * scale);
  } else {
    ctx.fillStyle = "#6ca017";
    ctx.fillRect(sx(0), sy(0), WORLD_WIDTH * scale, WORLD_HEIGHT * scale);
  }

  const tick = Math.floor(time * SOURCE_FPS);
  if (gameAssets.ready) drawBoostPads(ctx, sx, sy, scale, state.boosts);
  for (let i = 0; i < state.players.length; i++) drawPlayer(ctx, sx, sy, scale, state.players[i], i, nameAt(i, tick));
  drawBall(ctx, sx(state.ball.x), sy(state.ball.y), 2 * BALL_RADIUS * 1.1 * scale, state.ball.angle);
  ctx.restore();

  if (showScoreboard) drawScoreboard(ctx, width, time, tick);
  if (showEvents) drawRecentEvent(ctx, width, height, tick);
}

function drawBoostPads(ctx, sx, sy, scale, activeBoosts) {
  const size = 47.918 / 2048 * WORLD_WIDTH * scale;
  const count = Math.min(activeBoosts.length, BOOST_POSITIONS.length / 2);
  for (let i = 0; i < count; i++) {
    if (!activeBoosts[i]) continue;
    drawSprite(ctx, spriteFrames.boostPad, sx(BOOST_POSITIONS[i * 2]), sy(BOOST_POSITIONS[i * 2 + 1]), size, 0);
  }
}

function drawPlayer(ctx, sx, sy, scale, player, slot, name) {
  if (!Number.isFinite(player.x) || !Number.isFinite(player.y)) return;
  const x = sx(player.x), y = sy(player.y);
  const size = 2 * PLAYER_RADIUS * scale;
  if (gameAssets.ready && player.boost) drawSprite(ctx, spriteFrames.playerBoost, x, y, size * 1.2, player.angle);
  if (gameAssets.ready) drawPlayerSprite(ctx, slot % 2 === 0 ? "blue" : "red", x, y, size, player.angle);
  else {
    ctx.fillStyle = slot % 2 === 0 ? "#304b9b" : "#d77945";
    ctx.beginPath(); ctx.arc(x, y, size / 2, 0, Math.PI * 2); ctx.fill();
  }
  if (name) {
    ctx.font = `bold ${Math.max(10, widthScaled(14, ctx.canvas.width)) * appearanceSettings.nameSize}px Arial`;
    ctx.textAlign = "center";
    ctx.fillStyle = colourWithAlpha(appearanceSettings.nameColour, .62);
    const labelY = y - size * .72 * appearanceSettings.nameDistance;
    ctx.fillText(name.slice(0, 16), x, labelY);
  }
}

function drawBall(ctx, x, y, size, angle) {
  if (gameAssets.custom.ball) drawWholeImage(ctx, gameAssets.custom.ball, x, y, size, angle);
  else if (gameAssets.ready) drawSprite(ctx, spriteFrames.ball, x, y, size, angle);
  else { ctx.fillStyle = "white"; ctx.beginPath(); ctx.arc(x, y, size / 2, 0, Math.PI * 2); ctx.fill(); }
}

function drawPlayerSprite(ctx, team, x, y, size, angle) {
  if (appearanceSettings.tint && tintedPlayers[team]) drawWholeImage(ctx, tintedPlayers[team], x, y, size, angle);
  else if (gameAssets.custom[team]) drawWholeImage(ctx, gameAssets.custom[team], x, y, size, angle);
  else drawSprite(ctx, spriteFrames[team], x, y, size, angle);
}

function drawWholeImage(ctx, image, x, y, size, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.drawImage(image, -size / 2, -size / 2, size, size);
  ctx.restore();
}

function readAppearanceSettings() {
  const defaults = { tint: false, blue: "#3b4f8f", red: "#d37647", nameDistance: 1, nameSize: 1, nameColour: "#000000" };
  try {
    const saved = JSON.parse(localStorage.getItem(APPEARANCE_SETTINGS) || "null");
    return {
      tint: saved?.tint === true,
      blue: /^#[0-9a-f]{6}$/i.test(saved?.blue || "") ? saved.blue : defaults.blue,
      red: /^#[0-9a-f]{6}$/i.test(saved?.red || "") ? saved.red : defaults.red,
      nameDistance: clamp(Number(saved?.nameDistance) || defaults.nameDistance, .5, 2.5),
      nameSize: clamp(Number(saved?.nameSize) || defaults.nameSize, .5, 2),
      nameColour: /^#[0-9a-f]{6}$/i.test(saved?.nameColour || "") ? saved.nameColour : defaults.nameColour
    };
  } catch (_) {
    return defaults;
  }
}

function saveAppearanceSettings() {
  try { localStorage.setItem(APPEARANCE_SETTINGS, JSON.stringify(appearanceSettings)); } catch (_) {}
}

function openAppearanceDb() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) return reject(new Error("saved browser storage is unavailable"));
    const request = indexedDB.open(APPEARANCE_DB, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(APPEARANCE_STORE)) request.result.createObjectStore(APPEARANCE_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("could not open saved browser storage"));
  });
}

async function appearanceDbRequest(mode, action) {
  const db = await openAppearanceDb();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(APPEARANCE_STORE, mode);
      const store = transaction.objectStore(APPEARANCE_STORE);
      const request = action(store);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("could not update saved appearance"));
    });
  } finally {
    db.close();
  }
}

function setSkinState(type, name = "") {
  const state = document.querySelector(`[data-skin-state="${type}"]`);
  if (!state) return;
  state.textContent = name ? (name.startsWith("Anol: ") ? name : `Custom: ${name}`) : "Default";
  state.title = name || "Default";
}

function populateAnolPresets() {
  for (const [type, details] of Object.entries(ANOL_SKINS)) {
    const select = document.querySelector(`[data-skin-preset="${type}"]`);
    if (!select) continue;
    for (const name of details.names) {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name.replaceAll("-", " ");
      select.appendChild(option);
    }
  }
}

async function applyAnolPreset(type, name) {
  const details = ANOL_SKINS[type];
  if (!details || !details.names.includes(name)) return;
  setStatus(`Loading Anol’s ${name.replaceAll("-", " ")} preset…`);
  try {
    const response = await fetch(`${ANOL_SKIN_BASE}/${details.folder}/${encodeURIComponent(name)}.png`);
    if (!response.ok) throw new Error(`download returned ${response.status}`);
    const blob = await response.blob();
    if (!blob.type.startsWith("image/")) throw new Error("the preset was not an image");
    await importSkin(type, new File([blob], `Anol: ${name}`, { type: blob.type || "image/png" }));
  } catch (error) {
    console.error(error);
    const select = document.querySelector(`[data-skin-preset="${type}"]`);
    if (select) select.value = "";
    setStatus(`Couldn’t load that Anol preset: ${error.message}`);
  }
}

async function imageFromBlob(type, blob, name) {
  const previous = customAssetUrls.get(type);
  if (previous) URL.revokeObjectURL(previous);
  const url = URL.createObjectURL(blob);
  const image = new Image();
  try {
    await loadImage(image, url);
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
  customAssetUrls.set(type, url);
  customAssetNames.set(type, name || "saved image");
  gameAssets.custom[type] = image;
  setSkinState(type, customAssetNames.get(type));
  const preset = document.querySelector(`[data-skin-preset="${type}"]`);
  if (preset) {
    const savedPreset = String(name || "").startsWith("Anol: ") ? String(name).slice(6) : "";
    preset.value = [...preset.options].some((option) => option.value === savedPreset) ? savedPreset : "";
  }
}

async function restoreAppearance() {
  try {
    for (const type of SKIN_TYPES) {
      const saved = await appearanceDbRequest("readonly", (store) => store.get(type));
      if (saved?.blob instanceof Blob) await imageFromBlob(type, saved.blob, saved.name);
      else setSkinState(type);
    }
  } catch (error) {
    console.warn("Could not restore saved appearance", error);
  }
}

async function importSkin(type, file) {
  if (!SKIN_TYPES.includes(type) || !file) return;
  if (!file.type.startsWith("image/")) return setStatus("Please choose a PNG, JPG or WebP image.");
  if (file.size > MAX_SKIN_BYTES) return setStatus("Please keep each appearance image at 5 MB or less.");
  try {
    await imageFromBlob(type, file, file.name);
    await appearanceDbRequest("readwrite", (store) => store.put({ blob: file, name: file.name, updatedAt: Date.now() }, type));
    rebuildTintedPlayers();
    drawPreview();
    setStatus(`${file.name} saved as your ${type === "pitch" ? "pitch" : type} appearance.`);
  } catch (error) {
    console.error(error);
    setStatus(`Couldn’t use that image: ${error.message}`);
  } finally {
    const input = document.querySelector(`[data-skin="${type}"]`);
    if (input) input.value = "";
  }
}

async function resetSkin(type) {
  if (!SKIN_TYPES.includes(type)) return;
  try { await appearanceDbRequest("readwrite", (store) => store.delete(type)); } catch (error) { console.warn(error); }
  const url = customAssetUrls.get(type);
  if (url) URL.revokeObjectURL(url);
  customAssetUrls.delete(type);
  customAssetNames.delete(type);
  delete gameAssets.custom[type];
  const preset = document.querySelector(`[data-skin-preset="${type}"]`);
  if (preset) preset.value = "";
  setSkinState(type);
  rebuildTintedPlayers();
  drawPreview();
}

async function resetAllAppearance() {
  try { await appearanceDbRequest("readwrite", (store) => store.clear()); } catch (error) { console.warn(error); }
  for (const url of customAssetUrls.values()) URL.revokeObjectURL(url);
  customAssetUrls.clear();
  customAssetNames.clear();
  gameAssets.custom = {};
  for (const type of SKIN_TYPES) {
    setSkinState(type);
    const preset = document.querySelector(`[data-skin-preset="${type}"]`);
    if (preset) preset.value = "";
  }
  appearanceSettings = { tint: false, blue: "#3b4f8f", red: "#d37647", nameDistance: 1, nameSize: 1, nameColour: "#000000" };
  ui.tintCharacters.checked = false;
  ui.blueColour.value = appearanceSettings.blue;
  ui.redColour.value = appearanceSettings.red;
  ui.nameDistance.value = String(appearanceSettings.nameDistance);
  ui.nameSize.value = String(appearanceSettings.nameSize);
  ui.nameColour.value = appearanceSettings.nameColour;
  syncNameplateControls();
  saveAppearanceSettings();
  syncCharacterColourControls();
  rebuildTintedPlayers();
  drawPreview();
  setStatus("Match appearance reset to the NitroClash defaults.");
}

function syncCharacterColourControls() {
  ui.blueColour.disabled = !ui.tintCharacters.checked;
  ui.redColour.disabled = !ui.tintCharacters.checked;
}

function syncNameplateControls() {
  ui.nameDistanceValue.value = Number(ui.nameDistance.value).toFixed(2);
  ui.nameSizeValue.value = Number(ui.nameSize.value).toFixed(2);
}

function updateNameplateFromTypedValue(input) {
  const distance = input === ui.nameDistanceValue;
  const slider = distance ? ui.nameDistance : ui.nameSize;
  const minimum = distance ? .5 : .5;
  const maximum = distance ? 2.5 : 2;
  const value = Number(input.value);
  if (!Number.isFinite(value) || value < minimum || value > maximum) return;
  slider.value = String(value);
  appearanceSettings[distance ? "nameDistance" : "nameSize"] = value;
  saveAppearanceSettings();
  drawPreview();
}

function colourWithAlpha(hex, alpha) {
  const safe = /^#[0-9a-f]{6}$/i.test(hex || "") ? hex : "#000000";
  const red = parseInt(safe.slice(1, 3), 16);
  const green = parseInt(safe.slice(3, 5), 16);
  const blue = parseInt(safe.slice(5, 7), 16);
  return `rgba(${red},${green},${blue},${alpha})`;
}

function rebuildTintedPlayers() {
  tintedPlayers.blue = null;
  tintedPlayers.red = null;
  if (!appearanceSettings.tint || !gameAssets.ready) return;
  for (const team of ["blue", "red"]) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const custom = gameAssets.custom[team];
    if (custom) ctx.drawImage(custom, 0, 0, 128, 128);
    else {
      const frame = spriteFrames[team];
      ctx.drawImage(gameAssets.sprites, frame.x, frame.y, frame.w, frame.h, 0, 0, 128, 128);
    }
    const pixels = ctx.getImageData(0, 0, 128, 128);
    const data = pixels.data;
    let maxGray = 0;
    for (let index = 0; index < data.length; index += 4) {
      if (!data[index + 3]) continue;
      const gray = .299 * data[index] + .587 * data[index + 1] + .114 * data[index + 2];
      data[index] = data[index + 1] = data[index + 2] = gray;
      maxGray = Math.max(maxGray, gray);
    }
    const colour = appearanceSettings[team];
    const rgb = [1, 3, 5].map((offset) => parseInt(colour.slice(offset, offset + 2), 16));
    const normalize = maxGray > 0 ? 255 / maxGray : 1;
    for (let index = 0; index < data.length; index += 4) {
      const gray = Math.min(255, data[index] * normalize);
      data[index] = gray * rgb[0] / 255;
      data[index + 1] = gray * rgb[1] / 255;
      data[index + 2] = gray * rgb[2] / 255;
    }
    ctx.putImageData(pixels, 0, 0);
    tintedPlayers[team] = canvas;
  }
}

function drawSprite(ctx, frame, x, y, size, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.drawImage(gameAssets.sprites, frame.x, frame.y, frame.w, frame.h, -size / 2, -size / 2, size, size);
  ctx.restore();
}

function drawScoreboard(ctx, width, time, tick) {
  let blue = 0, red = 0;
  for (const event of replay.events) {
    if (event.tick > tick) break;
    if (event.type === 202) event.slot1 % 2 === 0 ? blue++ : red++;
  }
  const unit = width / 1920;
  const scoreWidth = 64 * unit;
  const timeWidth = 104 * unit;
  // Canvas strokes extend outside each box, so allow enough room to retain
  // NitroClash's visible two-pixel separation between the border edges.
  const gap = Math.max(3, 6 * unit);
  const boxWidth = scoreWidth * 2 + timeWidth + gap * 2;
  const x = (width - boxWidth) / 2;
  const y = 8 * unit;
  const h = 56 * unit;
  const border = Math.max(2, 4 * unit);
  ctx.save();
  ctx.lineWidth = border;
  ctx.fillStyle = "rgba(59,79,143,.35)"; ctx.strokeStyle = "#132561"; roundRect(ctx, x, y, scoreWidth, h, 12 * unit); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "rgba(205,205,205,.76)"; ctx.strokeStyle = "#111"; ctx.beginPath(); ctx.rect(x + scoreWidth + gap, y, timeWidth, h); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "rgba(211,118,71,.35)"; ctx.strokeStyle = "#8f390d"; roundRect(ctx, x + scoreWidth + timeWidth + gap * 2, y, scoreWidth, h, 12 * unit); ctx.fill(); ctx.stroke();
  ctx.font = `700 ${Math.max(12, 36 * unit)}px Cartwheel, Arial`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = "#050505"; ctx.fillText(String(blue), x + scoreWidth / 2, y + h * .49);
  ctx.fillText(matchClockAt(time * SOURCE_FPS), x + scoreWidth + gap + timeWidth / 2, y + h * .49);
  ctx.fillText(String(red), x + scoreWidth + timeWidth + gap * 2 + scoreWidth / 2, y + h * .49);
  ctx.restore();
}

function drawRecentEvent(ctx, width, height, tick) {
  let recent = null;
  for (const event of replay.events) {
    if (event.tick > tick) break;
    if (event.type !== 0 && event.type !== 1) recent = event;
  }
  if (!recent || tick - recent.tick > 105) return;
  const label = eventLabel(recent);
  ctx.save(); ctx.font = `800 ${Math.max(17, width * .017)}px Arial`; ctx.textAlign = "center";
  const textWidth = ctx.measureText(label).width + 38;
  ctx.fillStyle = "rgba(4,10,18,.82)"; roundRect(ctx, (width - textWidth) / 2, height * .82, textWidth, 44, 9); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.fillText(label, width / 2, height * .82 + 29); ctx.restore();
}

function nameAt(slot, tick) {
  let name = "";
  for (const event of replay.events) {
    if (event.tick > tick) break;
    if (event.slot1 !== slot) continue;
    if (event.type === 200) name = event.name;
    if (event.type === 201) name = "";
  }
  return name;
}

function eventLabel(event) {
  const player = nameAt(event.slot1, event.tick) || `Player ${event.slot1 + 1}`;
  if (event.type < 200) return `${EVENT_NAMES[event.type] || `Event ${event.type}`} by ${player}`;
  if (event.type === 200) return `Player joins: ${event.name}`;
  if (event.type === 201) return `Player leaves: ${event.name || player}`;
  if (event.type === 202) {
    const assist = event.slot2 !== 255 ? nameAt(event.slot2, event.tick) : "";
    return `Goal by ${player}${assist ? ` assisted by ${assist}` : ""} (${Math.ceil(event.speed * 5)} km/h)`;
  }
  if (event.type === 203) return "Overtime";
  return `Event ${event.type}`;
}

function renderEvents() {
  const visible = replay.events.filter((event) => event.type !== 0 && event.type !== 1);
  ui.eventCount.textContent = String(visible.length);
  ui.eventList.innerHTML = "";
  if (!visible.length) {
    ui.eventList.innerHTML = '<div class="empty-events">No displayable events in this replay.</div>';
    return;
  }
  for (const event of visible) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "event-item";
    button.innerHTML = `<span class="event-time">${formatTime(event.tick / SOURCE_FPS)}</span><span class="event-label"></span>`;
    button.querySelector(".event-label").textContent = eventLabel(event);
    button.addEventListener("click", () => setClipBoundary("end", event.tick / SOURCE_FPS));
    ui.eventList.appendChild(button);
  }
}

function startPlayback() {
  if (!replay || exporting) return;
  if (currentTime >= replay.duration) currentTime = 0;
  playing = true;
  previousAnimationTime = performance.now();
  ui.play.textContent = "❚❚";
  animationId = requestAnimationFrame(playbackStep);
}

function playbackStep(now) {
  if (!playing) return;
  currentTime = Math.min(replay.duration, currentTime + (now - previousAnimationTime) / 1000);
  previousAnimationTime = now;
  ui.playhead.value = String(currentTime);
  updateReadout();
  drawPreview();
  if (currentTime >= replay.duration) stopPlayback();
  else animationId = requestAnimationFrame(playbackStep);
}

function stopPlayback() {
  playing = false;
  cancelAnimationFrame(animationId);
  ui.play.textContent = "▶";
}

async function toggleReplayFullscreen() {
  if (!replay) return;
  try {
    if (document.fullscreenElement === ui.stage) await document.exitFullscreen();
    else if (ui.stage.requestFullscreen) await ui.stage.requestFullscreen();
    else setStatus("Fullscreen is not supported by this browser.");
  } catch (error) {
    setStatus(`Couldn’t open fullscreen: ${error.message}`);
  }
}

function syncReplayFullscreen() {
  const active = document.fullscreenElement === ui.stage;
  ui.fullscreen.setAttribute("aria-label", active ? "Exit replay fullscreen" : "Show replay fullscreen");
  ui.fullscreen.title = active ? "Exit fullscreen" : "Fullscreen";
  ui.canvas.width = active ? 1920 : 960;
  ui.canvas.height = active ? 1080 : 540;
  drawPreview();
}

function openClipPreview() {
  if (!replay || exporting) return;
  const start = clamp(parseTime(ui.start.value), 0, replay.duration);
  const end = clamp(parseTime(ui.end.value), 0, replay.duration);
  if (!(end > start)) return setStatus("Choose a clip end time after its start time.");
  stopPlayback();
  cancelAnimationFrame(clipPreviewAnimation);
  clipPreviewStart = start;
  clipPreviewEnd = end;
  clipPreviewTime = start;
  clipPreviewPlaying = true;
  clipPreviewPreviousTime = performance.now();
  ui.previewOverlay.hidden = false;
  document.body.style.overflow = "hidden";
  drawClipPreview();
  syncClipPreviewControls();
  clipPreviewAnimation = requestAnimationFrame(clipPreviewStep);
  ui.previewClose.focus();
}

function closeClipPreview() {
  if (ui.previewOverlay.hidden) return;
  clipPreviewPlaying = false;
  cancelAnimationFrame(clipPreviewAnimation);
  if (document.fullscreenElement === ui.previewStage) document.exitFullscreen().catch(() => {});
  ui.previewOverlay.hidden = true;
  document.body.style.overflow = "";
  ui.preview.focus();
}

function toggleClipPreviewPlayback() {
  if (clipPreviewPlaying) {
    clipPreviewPlaying = false;
    cancelAnimationFrame(clipPreviewAnimation);
  } else {
    if (clipPreviewTime >= clipPreviewEnd) clipPreviewTime = clipPreviewStart;
    clipPreviewPlaying = true;
    clipPreviewPreviousTime = performance.now();
    clipPreviewAnimation = requestAnimationFrame(clipPreviewStep);
  }
  syncClipPreviewControls();
  drawClipPreview();
}

function clipPreviewStep(now) {
  if (!clipPreviewPlaying || ui.previewOverlay.hidden) return;
  clipPreviewTime = Math.min(clipPreviewEnd, clipPreviewTime + (now - clipPreviewPreviousTime) / 1000);
  clipPreviewPreviousTime = now;
  drawClipPreview();
  if (clipPreviewTime >= clipPreviewEnd) {
    clipPreviewPlaying = false;
    syncClipPreviewControls();
  } else {
    clipPreviewAnimation = requestAnimationFrame(clipPreviewStep);
  }
}

function drawClipPreview() {
  if (!replay || ui.previewOverlay.hidden) return;
  renderFrame(ui.previewCanvas, clipPreviewTime, ui.camera.value, ui.showScoreboard.checked, ui.showEvents.checked, followZoom);
  const elapsed = Math.max(0, clipPreviewTime - clipPreviewStart);
  const duration = Math.max(0, clipPreviewEnd - clipPreviewStart);
  const label = `${formatTime(elapsed, true)} / ${formatTime(duration, true)}`;
  ui.previewTime.textContent = label;
  ui.previewTimeBelow.textContent = label;
}

function syncClipPreviewControls() {
  const label = clipPreviewPlaying ? "Pause" : (clipPreviewTime >= clipPreviewEnd ? "Replay" : "Play");
  ui.previewPlay.textContent = clipPreviewPlaying ? "❚❚" : "▶";
  ui.previewPlay.setAttribute("aria-label", `${label} clip preview`);
  ui.previewPlayBelow.textContent = label;
}

async function toggleClipPreviewFullscreen() {
  try {
    if (document.fullscreenElement === ui.previewStage) await document.exitFullscreen();
    else if (ui.previewStage.requestFullscreen) await ui.previewStage.requestFullscreen();
    else setStatus("Fullscreen is not supported by this browser.");
  } catch (error) {
    setStatus(`Couldn’t open fullscreen: ${error.message}`);
  }
}

function syncClipPreviewFullscreen() {
  const active = document.fullscreenElement === ui.previewStage;
  const label = active ? "Exit fullscreen" : "Fullscreen";
  ui.previewFullscreen.textContent = label;
  ui.previewFullscreenBelow.setAttribute("aria-label", active ? "Exit clip preview fullscreen" : "Show clip preview fullscreen");
  ui.previewFullscreenBelow.title = label;
  ui.previewCanvas.width = active ? 1920 : 960;
  ui.previewCanvas.height = active ? 1080 : 540;
  drawClipPreview();
}

function setCurrentTime(value) {
  if (!replay) return;
  currentTime = clamp(value, 0, replay.duration);
  ui.playhead.value = String(currentTime);
  updateReadout();
  drawPreview();
}

function setClipBoundary(which, value) {
  if (!replay || !Number.isFinite(value)) return;
  let start = Number(ui.startSlider.value);
  let end = Number(ui.endSlider.value);
  const oldLength = Math.max(1 / SOURCE_FPS, end - start);
  if (which === "start") {
    start = clamp(value, 0, replay.duration - 1 / SOURCE_FPS);
    if (start >= end) end = Math.min(replay.duration, start + oldLength);
  } else {
    end = clamp(value, 1 / SOURCE_FPS, replay.duration);
    if (end <= start) start = Math.max(0, end - oldLength);
  }
  ui.startSlider.value = String(start);
  ui.endSlider.value = String(end);
  ui.start.value = formatTime(start, true);
  ui.end.value = formatTime(end, true);
  setCurrentTime(which === "start" ? start : end);
}

function updateReadout() {
  const text = `${formatTime(currentTime, true)} / ${formatTime(replay ? replay.duration : 0)}`;
  ui.readout.textContent = text;
  ui.rangeReadout.textContent = text;
}

function drawPreview() {
  if (!replay) {
    const ctx = ui.canvas.getContext("2d");
    ctx.fillStyle = "#050a11"; ctx.fillRect(0, 0, ui.canvas.width, ui.canvas.height);
    ctx.fillStyle = "#8294aa"; ctx.font = "22px Arial"; ctx.textAlign = "center";
    ctx.fillText("Load an NCR replay to preview it", ui.canvas.width / 2, ui.canvas.height / 2);
    return;
  }
  renderFrame(ui.canvas, currentTime, ui.camera.value, ui.showScoreboard.checked, ui.showEvents.checked, followZoom);
}

async function exportMp4() {
  if (!replay || exporting) return;
  stopPlayback();
  if (!("VideoEncoder" in window)) {
    setStatus("This browser cannot create MP4 video. Please use current Chrome or Edge.");
    return;
  }
  const start = Number(ui.startSlider.value);
  const end = Number(ui.endSlider.value);
  const fps = Number(ui.fps.value);
  const [width, height] = ui.resolution.value.split("x").map(Number);
  const duration = end - start;
  if (!(duration > 0)) return setStatus("Choose a clip end after its start.");
  if (duration > 120) return setStatus("Please keep one clip at 2 minutes or less.");

  exporting = true;
  lockControls(true);
  ui.progress.hidden = false;
  ui.progress.value = 0;
  setStatus("Preparing MP4 encoder…");

  try {
    await gameAssetsReady;
    const keepUnderLimit = ui.sizeLimit.getAttribute("aria-pressed") === "true";
    const highRate = fps >= 240 ? 2.8 : (fps >= 120 ? 1.7 : 1);
    const normalBitrate = Math.round((width >= 1900 ? 14_000_000 : (width >= 1200 ? 8_000_000 : 4_000_000)) * highRate);
    let bitrate = keepUnderLimit ? Math.min(normalBitrate, Math.floor(19_000_000 * 8 / duration)) : normalBitrate;
    let blob = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      blob = await encodeClip({ start, end, fps, width, height, bitrate, camera: ui.camera.value, showScoreboard: ui.showScoreboard.checked, showEvents: ui.showEvents.checked, zoom: followZoom, attempt });
      if (!keepUnderLimit || blob.size <= TWENTY_MB) break;
      bitrate = Math.max(250_000, Math.floor(bitrate * 19_000_000 / blob.size));
      setStatus(`File was ${formatBytes(blob.size)}; reducing it below 20 MB…`);
    }
    if (keepUnderLimit && blob.size > TWENTY_MB) throw new Error("this clip could not be reduced below 20 MB; shorten it slightly and try again");
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const base = replay.filename.replace(/\.ncr$/i, "").replace(/[^a-z0-9_-]+/gi, "_");
    link.href = url;
    link.download = `${base}_${fileTime(start)}-${fileTime(end)}_${ui.camera.value}_${fps}fps.mp4`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
    setStatus(`MP4 ready • ${formatBytes(blob.size)} • ${fps} FPS${keepUnderLimit ? " • under 20 MB" : ""}`);
  } catch (error) {
    console.error(error);
    setStatus(`Couldn’t create the MP4: ${error.message}`);
  } finally {
    exporting = false;
    lockControls(false);
    ui.progress.hidden = true;
    drawPreview();
  }
}

function lockControls(locked) {
  for (const element of [ui.input, ui.play, ui.fullscreen, ui.preview, ui.playhead, ui.startSlider, ui.endSlider, ui.start, ui.end, ui.camera, ui.resolution, ui.fps, ui.showScoreboard, ui.showEvents, ui.export, ui.sizeLimit]) {
    element.disabled = locked;
  }
}

async function encodeClip({ start, end, fps, width, height, bitrate, camera, showScoreboard, showEvents, zoom, attempt }) {
  const codecCandidates = fps >= 240
    ? ["avc1.640034", "avc1.4d0034", "avc1.420034"]
    : (fps >= 120 ? ["avc1.640033", "avc1.4d0033", "avc1.420033"] : ["avc1.640028", "avc1.4d0028", "avc1.42001f"]);
  let config = null;
  for (const codec of codecCandidates) {
    const candidates = [
      { codec, width, height, bitrate, framerate: fps, hardwareAcceleration: "prefer-hardware", latencyMode: "quality" },
      { codec, width, height, bitrate, framerate: Math.min(fps, 120), hardwareAcceleration: "prefer-software", latencyMode: "quality" },
      { codec, width, height, bitrate, framerate: Math.min(fps, 60), latencyMode: "quality" }
    ];
    for (const candidate of candidates) {
      const support = await VideoEncoder.isConfigSupported(candidate);
      if (support.supported) { config = support.config; break; }
    }
    if (config) break;
  }
  if (!config) throw new Error(`${width}×${height} at ${fps} FPS is not supported by this browser/device`);

  const target = new ArrayBufferTarget();
  const muxer = new Muxer({ target, video: { codec: "avc", width, height, frameRate: fps }, fastStart: "in-memory", firstTimestampBehavior: "offset" });
  let encoderError = null;
  const encoder = new VideoEncoder({
    output: (chunk, metadata) => muxer.addVideoChunk(chunk, metadata),
    error: (error) => { encoderError = error; }
  });
  encoder.configure(config);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const totalFrames = Math.max(1, Math.ceil((end - start) * fps));
  const frameDuration = Math.round(1_000_000 / fps);
  for (let frameNumber = 0; frameNumber < totalFrames; frameNumber++) {
    if (encoderError) throw encoderError;
    renderFrame(canvas, Math.min(end, start + frameNumber / fps), camera, showScoreboard, showEvents, zoom);
    const frame = new VideoFrame(canvas, { timestamp: frameNumber * frameDuration, duration: frameDuration });
    encoder.encode(frame, { keyFrame: frameNumber % (fps * 2) === 0 });
    frame.close();
    if (encoder.encodeQueueSize > 8 || frameNumber % 12 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
    if (frameNumber % 4 === 0 || frameNumber === totalFrames - 1) {
      ui.progress.value = (frameNumber + 1) / totalFrames;
      setStatus(`${attempt ? "Reducing file" : "Creating MP4"}… ${Math.round(ui.progress.value * 100)}%`);
    }
  }
  await encoder.flush();
  encoder.close();
  if (encoderError) throw encoderError;
  muxer.finalize();
  return new Blob([target.buffer], { type: "video/mp4" });
}

function setStatus(message) { ui.exportStatus.textContent = message; }
function updateQualityWarning() {
  const fps = Number(ui.fps.value);
  const visible = !qualityWarningDismissed && fps >= 120 && ui.sizeLimit.getAttribute("aria-pressed") === "true";
  ui.qualityWarningText.textContent = fps >= 240
    ? "240 FPS with the 20 MB limit is likely to reduce image quality, especially for 1080p or longer clips. 60 FPS may be preferred for a clearer clip."
    : "120 FPS with the 20 MB limit may reduce image quality, especially for 1080p or longer clips. 60 FPS may be preferred for a clearer clip.";
  ui.qualityWarning.classList.toggle("visible", visible);
}
function updateCameraZoomLabel() {
  const option = ui.camera.querySelector('option[value="ball"]');
  option.textContent = `Zoomed / follow ball (${followZoom.toFixed(2)}×)`;
}
function lerp(a, b, t) { return a + (b - a) * t; }
function lerpAngle(a, b, t) {
  let delta = (b - a) % (Math.PI * 2);
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return a + delta * t;
}
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function widthScaled(pixelsAt1080p, canvasWidth) { return pixelsAt1080p * canvasWidth / 1920; }
function loadImage(image, source) {
  return new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = () => reject(new Error(`could not load ${source}`));
    image.src = source;
  });
}
function roundRect(ctx, x, y, width, height, radius) {
  if (typeof ctx.roundRect === "function") ctx.beginPath(), ctx.roundRect(x, y, width, height, radius);
  else {
    const r = Math.min(radius, Math.abs(width) / 2, Math.abs(height) / 2);
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r); ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r); ctx.closePath();
  }
}
function formatTime(seconds, milliseconds = false) {
  const safe = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safe / 60);
  const whole = Math.floor(safe % 60);
  return `${minutes}:${String(whole).padStart(2, "0")}${milliseconds ? `.${String(Math.floor((safe % 1) * 1000)).padStart(3, "0")}` : ""}`;
}
function parseTime(text) {
  const value = String(text).trim();
  if (/^\d+(?:\.\d+)?$/.test(value)) return Number(value);
  const match = value.match(/^(\d+):([0-5]?\d(?:\.\d+)?)$/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : NaN;
}
function fileTime(seconds) { return formatTime(seconds, true).replace(":", "m").replace(".", "s"); }
function formatBytes(bytes) {
  if (bytes < 1_000_000) return `${Math.round(bytes / 1000)} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

drawPreview();
