# RattanIndia-backend
# Revolt Motors Voice Assistant – Backend

This is the backend for the Revolt Motors Voice Assistant, powered by the Gemini Live API. It handles real-time bidirectional audio communication between the user's microphone and the Gemini AI model, enabling spoken input and audio responses in real time.

---

## Features

- Real-time audio input streaming from the browser (16kHz PCM)
- AI processing using Gemini’s Bidirectional Generate Content API
- Audio responses streamed back to the browser (24kHz PCM)
- Supports interruptions: Users can talk over the assistant and it will respond to the latest input
- Low latency with streaming input/output over WebSockets
- Includes everything to run out of the box, including `node_modules`

---

## Folder Structure

backend/
├── node_modules/ # All installed npm dependencies (already included)
│ └── ... # Internal libraries
├── index.js # Main backend server code
├── package.json # Project configuration and declared dependencies
├── package-lock.json # Exact versions of dependencies for reproducibility
├── README.md # This documentation file


> Note: `node_modules` is included for direct usage. No need to run `npm install`.

---

## Setup Instructions

### 1. Prerequisites

- Node.js v16 or higher
- A Gemini API Key from [Google AI Studio](https://makersuite.google.com/)

### 2. Configure Gemini API Key

Open `index.js` and replace the placeholder value with your real API key:

```js
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE";




Running the Server

From inside the backend/ directory, run:

node index.js


Expected output:

🚀 Backend running: http://localhost:5000
✅ Browser connected to backend
🌐 Connected to Gemini



WebSocket Endpoint
ws://localhost:5000/live
