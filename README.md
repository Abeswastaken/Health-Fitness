# Health-Fitness

jake's personal fitness app: macro tracker, workout planner, coach checks, Health Connect. Sideloaded, personal use.

## Where things are
- `docs/spec.md`: the original spec.
- `preview/`: the clickable preview used for UI and concept review (also published as a private claude.ai artifact).
  - `logic.js`: plain-code rules (targets, progression, plan checks, game). This becomes the Kotlin core. `node test_logic.js` tests it.
  - `src/a1..a7_*.js`: screen code, concatenated into `app.js` (then non-ASCII escaped).
  - `panel.js`: the design panel (colors, fonts, layout, pinned notes for Claude).
  - `*.json`: exercise data and pictures (free-exercise-db photos, everkinetic and workout-guide drawings, CC BY-SA 4.0).
  - `tools/`: scripts that built the data files.
- `android/`: the APK. It wraps the preview full screen. Inside the app (`window.HFDev` present) it starts empty, with no example data, and saves under its own key. Settings > Developer turns on the **Dev** button for the design panel; **Export file for Claude** shares a JSON with the same data the web panel saves (look settings and notes). Settings > Data backs up everything as one JSON file.
- Not real yet in the APK (comes with the native app): barcode scanning, Health Connect, direct AI calls (AI works by copy and paste).

## Builds
GitHub Actions builds on every push: logic tests, then the APK. Branch pushes publish a pre-release `test-N`; pushes to `main` publish release `v<version.txt>.<run>`. All builds use the committed `android/app/debug.keystore`, so they install over each other. Never change `applicationId`.

The native Kotlin + Compose app comes after the review passes.
