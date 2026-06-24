# TurtleTracks - Sea Turtle Nest Logger Mobile PWA

TurtleTracks is a mobile-first Progressive Web Application (PWA) built with React and Vite. It is designed to assist sea turtle conservation volunteers with daily crawl documentation, nest location & probing, protection equipment logging, and DNR reporting duties. It is optimized to operate **entirely offline** on beaches, syncing logs back to the device's local storage and exporting reports in versatile formats.

## Key Features

1. **Beach Session Tracker:**
   * Log date, time, and track session duration.
   * GPS path tracking with a real-time Leaflet map shoreline overlay.
   * **Beach Walk Simulator:** Allows indoor/computer testing by simulating walks southwest along Melrose Beach, Daufuskie Island.
   * Consolidated logs: group multiple crawls (nests or false crawls) under a single beach session.

2. **Crawl Wizard Form:**
   * Step-by-step checklist based on South Carolina DNR guidelines.
   * Camera prompts with tags (Initial tracks, Nest setups, DNR card photos).
   * Probing directions guide (reminders to use legs, dig by hand only).
   * **Chamber Search Guide:** Collapsible, field-ready marine biology guide detailing egg chamber location relative to crawl features.
   * Washover/tide risk calculator warning triggers if logged below the high tideline.
   * Protective equipment checklists (mesh screens, PVC triangle, DNR tags, cages, red tape).
   * Relocation logs (egg counts, relocation coordinates tracking).
   * False crawl factors checklist (artificial lights, beach debris, seawalls, human encounters).

3. **GPS Compass & Radar Utility:**
   * Displays live Lat/Lng, accuracy readings, and resolved island sector names.
   * **Save Coordinate Card:** Compiles coordinates, accuracy, and timestamp into a styled card image download (canvas-derived PNG) for emergency backup verification.

4. **Quick Camera Roll:**
   * Capture and save ad-hoc images outside sessions.
   * Tag and review images with notes in a local persistent gallery.

5. **Completed Sessions Library & Reporting:**
   * Library browser containing past beach monitoring session summaries.
   * **Multi-Format Export Sheet:**
     * *Print/Save as PDF:* Pre-formatted high-contrast print stylesheet (`@media print`) showing details, maps, and photographs ready for printing.
     * *Interactive HTML Report:* Download a standalone `.html` report file embedding all details and photos as Base64 strings. Open it on any device to view fully styled.
     * *CSV Log:* Export session metadata for spreadsheet reporting.
     * *Mailto Pre-fill:* Instantly composes an email report to DNR coordinators.
     * *Copy Text Summary:* Clean markdown text copy of logs.

---

## Getting Started

### 1. Run the Development Server
Install dependencies and run the local development server:
```bash
npm install
npm run dev
```

### 2. View in the Browser
Open `http://localhost:5173` in your browser. Toggle **Device Mode (Mobile Emulation)** in your browser developer tools (inspect element -> toggle device toolbar) for the best mobile-first responsive view.

### 3. Open and Test on a Mobile Device
To test on your iPhone or Android phone over your local Wi-Fi network:
1. Start Vite with the host flag:
   ```bash
   npm run dev -- --host
   ```
2. Note the local IP address printed in the terminal (e.g. `http://192.168.1.100:5173`).
3. Open this URL in Safari on your iPhone, or Chrome on your Android.
4. (Optional) In Safari, tap **Share -> Add to Home Screen** to install TurtleTracks as a standalone full-screen app. In Chrome on Android, tap **Settings -> Install App**.

### 4. Running the Built Version
To test the optimized production build:
```bash
npm run build
npm run preview
```
