# StadiumSync Full-Stack

A premium full-stack application for modern venue logistics.
Features interactive heatmaps, real-time wait times, virtual queuing, and emergency SOS coordination.

## Prerequisites
- Node.js (v18+)
- npm

## Installation & Setup

1. **Install Frontend Dependencies:**
   ```bash
   npm install
   ```

2. **Install Backend Dependencies:**
   ```bash
   cd server
   npm install
   ```

## Running the Application

For the full experience, you must run *both* the backend server and the frontend client concurrently.

1. **Start the Backend Server (Terminal 1):**
   ```bash
   cd server
   npm run dev
   ```
   *Runs on `http://localhost:3001`*

2. **Start the Frontend Client (Terminal 2):**
   ```bash
   npm run dev
   ```
   *Runs on `http://localhost:5173` and proxies `/api` to the backend.*
