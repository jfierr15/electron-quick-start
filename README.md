CRT Multi-Perspective — Tauri Desktop Scaffold

What I created
- Minimal Vite frontend in `src/` (HTML, CSS, `main.js`) with the improved media handling using Tauri's dialog API.
- `src-tauri/` Rust glue with `Cargo.toml` and `main.rs` to run the Tauri app.
- `package.json` with scripts for dev and build.
- README and run instructions.

Prerequisites (Windows)
- Node.js (LTS)
- Rust toolchain (rustup) and Visual Studio Build Tools (Desktop C++ workload)
- WebView2 runtime (Edge)

Quick start

1. Install Node.js and Rust as required.
2. In PowerShell, from the project root:

```powershell
npm install
npm run tauri:dev
```

Notes and limitations
- Building the Tauri app requires a functioning Rust toolchain and native dependencies.
- The scaffold sets video sources using `file:///` local file URLs. This works with typical WebView2 setups on Windows but if your environment disallows `file://` in the webview you can instead read files with the Tauri fs API and create Blob URLs.
- For very large video files or many files, streaming or generating lower-resolution proxies will reduce memory and CPU usage.

Next steps I can do for you
- Add robust streaming (serve proxied lower-res versions) or create blob streaming via the Tauri fs API.
- Add an auto-update or packaging pipeline for Windows.
- Re-integrate all features from your original `index.html` (gamepad support, more controls).

Tell me which next step you want me to implement.
How to get a ready-to-run Windows EXE (no local build required)

- Option A — GitHub Actions (I added a workflow):
	- I added `.github/workflows/build-windows-tauri.yml`. If you push this repository to GitHub (main/master branch), the workflow will run and build a Windows bundle on a GitHub-hosted `windows-latest` runner.
	- After the workflow finishes you can download the produced artifacts (MSI/EXE) from the Actions run under "Artifacts". The workflow runs on push to `main`/`master` and can also be triggered manually via the "Run workflow" button in the Actions UI.

- Option B — Local build (if you prefer to build locally):
	- Ensure you have Rust, Visual Studio Build Tools (Desktop C++), Node.js, and WebView2 runtime.
	- From the project root:
```powershell
npm install
npm run tauri:build
```
	- Built bundles are placed under `src-tauri/target/release/bundle/windows/`.

If you'd like, I can:
- Walk you through pushing to GitHub and downloading the artifact step-by-step.
- Switch the workflow to publish artifacts to GitHub Releases automatically.
- Build the EXE here by hooking into a CI provider you prefer (GitHub, Azure, etc.).

Tell me which option you want to use and I will help you finish it.