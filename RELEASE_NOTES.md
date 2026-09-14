# NitroClash Replay Tools v1.6.1

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
