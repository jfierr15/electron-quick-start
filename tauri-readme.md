Tauri + Vite scaffold for CRT Multi-Perspective Prototype

This scaffold provides a minimal Tauri desktop app setup with a Vite frontend and improved media handling (native file dialog, preloading, playback pool). It is a starting point — you will need the prerequisites listed below to build and run.

Prerequisites (Windows):
- Node.js (LTS) and npm
- Rust toolchain (rustup) and Visual Studio Build Tools (C++ workload)
- WebView2 runtime (Edge) on Windows

Quick setup

1. Install Node.js and Rust (see docs).
2. From this project folder in PowerShell:

```powershell
npm install
# Start the dev server + tauri dev (requires Rust)
npm run tauri:dev
```

Notes
- The scaffold sets up a native file picker using `@tauri-apps/api/dialog` and uses local file URLs to play videos in the webview. For large video sets, consider streaming or proxying to lower memory usage.
- Packaging requires `tauri build` which depends on Rust and the proper native toolchain.

If you want, I can now: scaffold remaining files, or run through a local verification checklist with you. 