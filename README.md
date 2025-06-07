# dataLogger

`dataLogger` is a progressive web application (PWA) for GIS users to log and manage geographic data. With `dataLogger`, users can:

* **Track GPS routes** in real time (start/stop tracking).
* **Draw manual paths** by clicking on the map.
* **Add Points of Interest (POIs)** with custom attribute data (name, description, type, transport modes, gender, GPS metadata).
* **Import and export** spatial data in GeoJSON, KML, CSV, and custom JSON formats.
* **Filter** displayed markers and paths by attributes.

Built with:

* **React 18** + **Vite**
* **Leaflet** / **react-leaflet** for interactive maps
* **MUI** (Material UI) for UI components and theming
* **localStorage** (with plans for Dexie/IndexedDB) to persist data
* **workbox** & `vite-plugin-pwa` for offline support and PWA features

## Prerequisites

* **Node.js** v20.14.0 (LTS)
* **npm** v10.9.2
* Windows, macOS, or Linux development environment

## Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/wapco-ai/dataLogger.git
   cd dataLogger
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Run in development mode**

   ```bash
   npm run dev
   ```

   This launches Vite’s dev server and opens the app at `http://localhost:3000`.

4. **Build for production**

   ```bash
   npm run build
   ```

   The optimized build will be in the `dist/` folder.

5. **Preview the production build**

   ```bash
   npm run preview
   ```

## Usage

* **Start GPS Tracking**: Click the ▶️ button in the bottom control panel to begin real-time route logging. Click ■ to stop and save.
* **Draw Manual Path**: Click the 🖐️ button, then click on the map to plot points. Click "Finish Path" to save.
* **Add Marker**: Click the 📍 button, fill out the attribute form, and save.
* **Filter**: Click the 🔍 button to open filters for marker type, path type, transport modes, and gender.
* **Export**: Click the ⬇️ button and choose GeoJSON, KML, CSV, or JSON to download current data.
* **Import**: Click the ⬆️ button and select a JSON or GeoJSON file. Imported items are merged into existing data.

## File Structure

```
dataLogger/
├─ public/            # Static assets
├─ src/
│  ├─ components/     # React components (Map, controls, modals)
│  ├─ styles/         # CSS files
│  ├─ App.jsx         # Entry React component
│  ├─ main.jsx        # Bootstraps React + ThemeProvider
│  └─ localStorageHooks.jsx  # Hooks for persisting markers & paths
├─ vite.config.js     # Vite configuration
├─ package.json       # Project metadata & scripts
└─ README.md          # This file
```

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/YourFeature`.
3. Commit your changes: `git commit -m "Add YourFeature"`.
4. Push to your branch: `git push origin feature/YourFeature`.
5. Open a Pull Request.

Please adhere to existing code style. All new features should include relevant tests.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Happy mapping! 🚀
