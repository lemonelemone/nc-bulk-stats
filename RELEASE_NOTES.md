# NitroClash Replay Tools v1.4.0

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

Tested in a real Microsoft Edge browser using the supplied 12:20 NCR replay, including both overlay states, aligned timelines, mouse-wheel zoom, and MP4 export. A 10-second 1080p follow-ball clip exported at 120 FPS as a 17.8 MB MP4 under the enabled 20 MB limit.
