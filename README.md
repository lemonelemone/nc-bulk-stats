# NitroClash Replay Tools v1.6.1

This release keeps NC Bulk Stats and adds a separate **NCR to MP4** section.

## Simple local test

1. Double-click `START_LOCAL_TEST.cmd`.
2. Your browser opens the local site.
3. Select **NCR to MP4**.
4. Load an `.ncr`, set the clip start/end, camera, quality and frame rate.
5. With **Zoomed / follow ball** selected, place the pointer over the replay and use the mouse wheel to zoom in or out.
6. Leave **Scoreboard & timer** and **Events** off for a clean clip, or tick either overlay you want.
7. If needed, switch **Keep under 20 MB** on.
8. Open **Match appearance** if you want to use your own pitch, background/bgtile, ball or blue/red character images. Optional character colours work like NC Skinner. The latest choices are saved in that browser.
9. Select **Download MP4**.
10. Close the black server window when finished.

Use an up-to-date version of Microsoft Edge or Google Chrome. The converter runs locally in the browser; replay files are not uploaded.

The experimental **240 FPS** option creates interpolated frames from the replay's 60 Hz data. It is much slower to export and may not be supported by every device. When **Keep under 20 MB** is also enabled, the page warns that image quality is likely to be reduced.

The optional scoreboard now matches NitroClash more closely. Its timer counts down from 5:00 during regulation, pauses during recorded goal celebrations, and counts up as `+0:01`, `+0:02`, and so on in overtime.

Version 1.5.1 uses NitroClash's original Cartwheel scoreboard font and original compact dimensions, replacing the oversized v1.5.0 overlay.

Version 1.5.2 preserves a visible gap between all three scoreboard boxes at preview and export resolutions.

Version 1.5.3 makes an event click move both the blue replay playhead and the second green clip-end handle to the event timestamp.

Version 1.6.0 adds experimental 240 FPS export and a simple, browser-saved match appearance panel based on NitroClash's skin editor and NC Skinner asset categories.

Version 1.6.1 fixes every individual **Use default** appearance button so it resets the selected asset immediately and keeps it reset after reopening the site.

## Public-site files

Upload `index.html`, `converter.js`, and the complete `assets` and `vendor` folders together. Keep their relative folder structure unchanged.

No NitroClash userscript or game-server changes are included.
