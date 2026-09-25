# NitroClash Replay Tools v1.10.0

This release includes three tools: **Bulk Stats**, **NCR to MP4**, and a separate **NC11 Replay Viewer** page for `.nc11replay` files.

Use the third navigation button to open the NC11 viewer. It runs locally in the browser and returns to the other tools through the navigation buttons at the top-left.

## Simple local test

1. Double-click `START_LOCAL_TEST.cmd`.
2. Your browser opens the local site.
3. Select **NCR to MP4**.
4. Load an `.ncr`, set the clip start/end, camera, quality and frame rate.
5. With **Zoomed / follow ball** selected, place the pointer over the replay and use the mouse wheel to zoom in or out.
6. Leave **Scoreboard & timer** and **Events** off for a clean clip, or tick either overlay you want.
7. Select **Preview clip** to watch exactly the chosen range in a large overlay. Its Fullscreen button fills the monitor.
8. If needed, switch **Keep under 20 MB** on.
9. Open **Match appearance** to choose a ready-made Anol Skinner preset or upload your own pitch, background/bgtile, ball or blue/red character image. The latest choices are saved in that browser.
10. Select **Download MP4**.
11. Close the black server window when finished.

Use an up-to-date version of Microsoft Edge or Google Chrome. The converter runs locally in the browser; replay files are not uploaded.

The **120 FPS** and experimental **240 FPS** options create interpolated frames from the replay's 60 Hz data. When either is combined with **Keep under 20 MB**, the page warns that image quality may be reduced and recommends 60 FPS for a clearer clip. **Don’t show again** remembers the choice in that browser. The 240 FPS option is much slower to export and may not be supported by every device.

The optional scoreboard now matches NitroClash more closely. Its timer counts down from 5:00 during regulation, pauses during recorded goal celebrations, and counts up as `+0:01`, `+0:02`, and so on in overtime.

Version 1.5.1 uses NitroClash's original Cartwheel scoreboard font and original compact dimensions, replacing the oversized v1.5.0 overlay.

Version 1.5.2 preserves a visible gap between all three scoreboard boxes at preview and export resolutions.

Version 1.5.3 makes an event click move both the blue replay playhead and the second green clip-end handle to the event timestamp.

Version 1.6.0 adds experimental 240 FPS export and a simple, browser-saved match appearance panel based on NitroClash's skin editor and NC Skinner asset categories.

Version 1.6.1 fixes every individual **Use default** appearance button so it resets the selected asset immediately and keeps it reset after reopening the site.

Version 1.7.0 adds Anol’s current pitch, background, ball and character presets directly to the appearance panel, plus a direct **Install Anol’s Skinner** link. A preset downloads only when selected and is saved in the browser. It also adds fullscreen viewing for the main replay, a large **Preview clip** overlay that plays exactly the selected range using the chosen camera and overlays, and a separate fullscreen control inside that clip preview. The 120 FPS label is shortened from **120 FPS (smooth)** to **120 FPS**. Preview rendering runs only while visible and adds no background or in-game work.

Version 1.7.1 adds the quality warning to 120 FPS as well as 240 FPS whenever **Keep under 20 MB** is enabled. It recommends 60 FPS for clearer results and includes a browser-saved **Don’t show again** button.

Version 1.7.2 keeps the clip preview centred and fully visible on shorter browser windows, places its Fullscreen button in the top bar, and shortens the appearance dropdown label from **Anol preset…** to **Preset…**.

Version 1.8.0 adds browser-saved **Name distance** and **Name size** sliders plus a **Name colour** picker under Match appearance. They update the replay, clip preview and exported MP4 without adding any extra rendering loop or background work.

Version 1.8.1 clarifies that 1080p and longer clips are most at risk of quality loss when 120 or 240 FPS is combined with the 20 MB limit. The clip-preview window now explains that preview playback follows the browser, while the selected resolution and FPS apply only to the downloaded MP4. It also removes the Anol Skinner information/install bar while keeping all presets in the dropdowns.

Version 1.8.2 replaces the always-visible Fullscreen buttons with discreet corner icons that appear when the replay or clip preview is hovered. The icons remain keyboard accessible and visible on touchscreen devices. Name distance and size can now be dragged or typed to two decimal places, including precise values such as `1.34×`.

Version 1.9.0 adds four shortcuts shown when the main replay is hovered: jump 5 seconds back, set the clip start at the current position, set the clip end at the current position, and jump 5 seconds forward. Hovering each button explains its action.

Version 1.9.1 moves the four replay shortcuts to the bottom centre and places the main replay and clip-preview fullscreen icons at the bottom-right. Shortcut explanations now open above the buttons.

Version 1.10.0 replaces Bulk Stats' older footer scanner with the same structural NCR parser used by the replay viewer. Long overtime matches, goals after player changes, assists and victory bonuses are now retained. Different players and AI fill-ins sharing one slot receive separate detailed rows, while a player returning with the same name keeps one combined row. AI rows are excluded from the NCSC table and its CSV. Missing recorded names use a clear `Unknown player (slot N)` label instead of `slot1`, `slot2`, and similar placeholders.

## Public-site files

Upload `index.html`, `converter.js`, and the complete `assets` and `vendor` folders together. Keep their relative folder structure unchanged.

No NitroClash userscript or game-server changes are included.
