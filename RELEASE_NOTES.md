# NitroClash Replay Tools v1.10.0

- Replaces the old Bulk Stats footer scan with the replay viewer's structural NCR parser.
- Fixes long overtime matches losing every event after a player leaves, reconnects or is replaced by an AI.
- Keeps goals, assists, saves, overtime bonuses and victory bonuses from the complete replay.
- Gives different players or AI fill-ins separate statistics when they share a slot.
- Combines genuine same-name reconnects into the returning player's existing row.
- Shows point-scoring AI fill-ins while hiding zero-point AI placeholders created during an immediate reconnect.
- Excludes AI players from the NCSC table and NCSC CSV while retaining them in detailed per-match results.
- Uses `Unknown player (slot N)` instead of `slot1`/`slot2` if a replay genuinely contains no name.
- This work runs only when NCR files are selected on the statistics page and has no game or replay-viewer FPS cost.

## Version 1.9.1

- Moves the four replay hover shortcuts from the top to the bottom centre.
- Moves the main replay and clip-preview fullscreen icons to the bottom-right.
- Opens shortcut explanations above the buttons so they stay inside the video.
- This is a CSS-only change with no rendering or gameplay FPS cost.

## Version 1.9.0

- Adds four discreet controls shown when the main replay is hovered.
- Adds **5 seconds back** and **5 seconds forward** shortcuts.
- Adds shortcuts that move the first green handle to the current position for clip start and the second green handle for clip end.
- Shows a short explanation when each shortcut is hovered or keyboard-focused.
- The controls are click-driven and add no continuous replay-rendering or gameplay FPS work.

## Version 1.8.2

- Replaces the main replay’s always-visible Fullscreen button with a discreet corner icon shown on hover.
- Places the same hover Fullscreen icon directly over the clip preview.
- Keeps both controls keyboard accessible and visible on touchscreens.
- Makes the Name distance and Name size multipliers directly typeable and increases their precision to 0.01 steps.
- This is a CSS/interface change with no rendering or gameplay FPS cost.

## Version 1.8.1

- Clarifies that 1080p and longer clips are most at risk of reduced image quality when 120 or 240 FPS is combined with **Keep under 20 MB**.
- Adds a clear note inside Clip preview explaining that it uses browser playback and the selected resolution/FPS apply only to the downloaded MP4.
- Removes the Anol Skinner information/install bar while keeping its ready-made assets available through the **Preset…** dropdowns.
- These are text and layout changes only, with no rendering or gameplay FPS cost.

## Version 1.8.0

- Adds a **Name distance** slider to move player names closer to or farther from their characters.
- Adds a **Name size** slider to make player names smaller or larger.
- Adds a **Name colour** picker while keeping the current dark colour as the default.
- Saves all three settings in the current browser and applies them to the replay, clip preview and exported MP4.
- The controls reuse the existing name-drawing step and add no new rendering loop or gameplay FPS cost.

## Version 1.7.2

- Keeps the full clip preview and its controls vertically centred and visible on shorter browser windows.
- Moves the clip preview’s Fullscreen button into the top bar beside Close.
- Renames **Anol preset…** to the simpler **Preset…** on every appearance dropdown.
- These are interface-only changes and add no replay-rendering or gameplay FPS cost.

## Version 1.7.1

- Shows a quality warning when **Keep under 20 MB** is combined with either 120 FPS or 240 FPS.
- Recommends 60 FPS when a clearer image is more important than extra interpolated frames under the same file-size limit.
- Adds **Don’t show again**, saved in the current browser so the warning stays dismissed after the site is reopened.
- The warning reacts only to control changes and adds no replay-rendering or gameplay FPS cost.

## Version 1.7.0

- Adds all 35 currently available presets from Anol’s Skinner across pitch, background/bgtile, ball, blue character and red character dropdowns. Selecting one downloads it directly and saves it in the existing browser appearance storage.
- Adds a direct **Install Anol’s Skinner** link for people who also want the Tampermonkey game-skin tool.
- Adds a native Fullscreen button over the main replay.
- Adds **Preview clip**, which opens a large overlay and plays exactly the selected start/end range with the chosen camera, zoom, scoreboard and event settings.
- Adds Play/Pause, Close and Fullscreen controls to the clip-preview overlay.
- Renames **120 FPS (smooth)** to **120 FPS**.
- The new preview and appearance features run only when opened or selected. They add no NitroClash gameplay code, server work, or always-running renderer.

## Version 1.6.1

- Fixes the five individual **Use default** buttons. Pitch, background/bgtile, ball and both character assets now return to the built-in NitroClash asset immediately and remain at the default after the page is reopened.
- This is a replay-tools interface fix only and does not change rendering performance, the NitroClash userscript or either game server.

## Version 1.6.0

- Adds experimental 240 FPS MP4 export using smoothly interpolated replay frames.
- Shows a clear warning when 240 FPS and **Keep under 20 MB** are selected together because the bitrate limit is likely to reduce image quality.
- Adds a compact **Match appearance** panel for custom pitch, background/bgtile, ball, blue character and red character images.
- Saves the latest custom appearance assets in browser storage so they return when the site is reopened.
- Adds optional blue and red character recolouring using the same grayscale-and-tint approach as the supplied NC Skinner userscript.
- Keeps all appearance work inside the replay viewer/exporter; it adds no in-game or userscript FPS cost.

## Earlier features

- Clicking a replay event now moves the blue playhead and green clip-end marker together.

- Keeps a visible gap between the blue score, timer and red score boxes after canvas scaling.

- Uses NitroClash's original Cartwheel scoreboard font.
- Restores the game's compact scoreboard measurements so the overlay no longer looks oversized or squashed.

- Changes the optional scoreboard timer to a five-minute regulation countdown.
- Detects and removes recorded goal-celebration pauses from the displayed match clock.
- Displays overtime as a count-up clock such as `+0:01`.
- Restyles the blue score, centre timer and red score boxes to more closely match NitroClash.

- Preserves the supplied latest NC Bulk Stats page, including Points in Match (NCSC) Stats.
- Adds a separate NCR to MP4 clip-maker section.
- Loads and previews NCR replays entirely in the browser.
- Displays the replay event list and jumps to events when selected.
- Provides typed timestamps and two draggable clip boundaries.
- Includes full-field and zoomed/follow-ball cameras.
- Exports silent MP4 clips at 480p, 720p, or 1080p.
- Exports at 30 FPS, 60 FPS, or smoothly interpolated 120 FPS.
- Uses NitroClash's real playfield, default blue/red circular player sprites, ball, boost effect, tiled background, and scoreboard styling.
- Shows the 14 boost pads from the replay data, including pads disappearing when collected and returning when available again.
- Restores the navy NitroClash Replay Tools design across the converter and Bulk Stats page without changing their behavior or calculations.
- Uses responsive navy panels, clearer active tabs and controls, blue playback accents, and a green MP4 download action on desktop and mobile.
- Adds player names, player/ball movement, boost effects, and recent-event overlays to clips.
- Adds an optional **Scoreboard & timer** overlay. It is off by default and can be enabled for the preview and exported MP4.
- Adds an optional **Events** overlay for the in-game event banner. It is off by default and can be enabled for the preview and exported MP4.
- Aligns the clip-selection bar with the playback timeline above it.
- Adds mouse-wheel zoom in both directions while using **Zoomed / follow ball**. The selected zoom is used in the exported MP4.
- Adds a **Keep under 20 MB** button. When enabled, the encoder selects an appropriate bitrate and automatically retries at a lower bitrate if the first MP4 is too large.
- Limits a single export to two minutes to protect browser memory.
- Makes no changes to NitroClash gameplay, SUPER NC, userscripts, or servers.

Tested in a real Microsoft Edge browser using supplied NCR replays, including a regulation countdown, a timer frozen during a recorded goal celebration, and a `+0:02` overtime display. Both overlay states, aligned timelines, mouse-wheel zoom, and MP4 export were also tested. A 10-second 1080p follow-ball clip exported at 120 FPS as a 17.8 MB MP4 under the enabled 20 MB limit.
