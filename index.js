import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import WebSocket from "ws";
import cors from "cors";

// Your actual Gemini API key here:
const GEMINI_API_KEY = "AIzaSyARyMkhfGDvF3BPpc7e-bSSmfpT8_hp2oY";
const PORT = 5000;

const app = express();
app.use(cors());

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/live" });

const toB64 = (buf) =>
  Buffer.isBuffer(buf) ? buf.toString("base64") : Buffer.from(buf).toString("base64");

wss.on("connection", (client) => {
  console.log("✅ Browser connected to backend");

  let gws = null;
  let bufferQueue = [];
  let isSetupComplete = false;

  const connectToGemini = () => {
    const geminiUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${GEMINI_API_KEY}`;

    gws = new WebSocket(geminiUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    gws.on("open", () => {
      console.log("🌐 Connected to Gemini");

      const setup = {
        setup: {
          model: "models/gemini-2.5-flash-preview-native-audio-dialog",
          generationConfig: {
            responseModalities: ["AUDIO"],
          },
          systemInstruction: {
            parts: [{
              text: "You are a Revolt Motors voice assistant. Keep responses very short.",
            }],
          },
        },
      };

      console.log("Sending Gemini setup:", JSON.stringify(setup));
      gws.send(JSON.stringify(setup));
    });

    gws.on("message", (data) => {
      const msg = JSON.parse(data.toString());

      if (msg.setupComplete) {
        console.log("✅ Gemini setup complete");
        isSetupComplete = true;
        client.send(JSON.stringify({ type: "info", message: "Assistant ready" }));
        bufferQueue.forEach((b) => gws.send(b));
        bufferQueue = [];
      }

      const parts = msg?.serverContent?.modelTurn?.parts;
      if (parts) {
        parts.forEach((part) => {
          if (part.text) {
            console.log("💬 Text:", part.text);
            client.send(JSON.stringify({ type: "text", text: part.text }));
          }

          if (part.inlineData?.mimeType.includes("audio")) {
            console.log("🔊 Audio received");
            const mimeType = part.inlineData.mimeType;
            console.log("🔈 Received MIME type:", mimeType);

            const rate = parseInt(mimeType.match(/rate=(\d+)/)?.[1] || "24000", 10);

            client.send(JSON.stringify({
              type: "audio",
              b64: part.inlineData.data,
              rate,
            }));
          }
        });
      }
    });

    gws.on("error", (err) => {
      console.error("❌ Gemini error:", err.message);
      client.send(JSON.stringify({ type: "error", message: err.message }));
    });

    gws.on("close", (code, reason) => {
      console.warn(`⚠️ Gemini WebSocket closed with code ${code}, reason: ${reason.toString()}`);
      isSetupComplete = false;
    });
  };

  connectToGemini();

  client.on("message", (data) => {
    let payload = null;

    try {
      const parsed = JSON.parse(data.toString());
      if (parsed.type === "text") {
        payload = {
          clientContent: {
            turns: [{ role: "user", parts: [{ text: parsed.message }] }],
            turnComplete: true,
          },
        };
        gws.send(JSON.stringify(payload));
        return;
      }
    } catch {}

    payload = {
      realtimeInput: {
        mediaChunks: [{
          mimeType: "audio/pcm;rate=16000",
          data: toB64(data),
        }],
      },
    };

    if (!isSetupComplete) {
      bufferQueue.push(JSON.stringify(payload));
    } else {
      gws.send(JSON.stringify(payload));
    }
  });

  client.on("close", () => {
    console.log("🔌 Browser disconnected");
    if (gws?.readyState === WebSocket.OPEN) gws.close(1000);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Backend running: http://localhost:${PORT}`);
});
