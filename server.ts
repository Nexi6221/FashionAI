import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { handleGenerate } from "./src/server/gemini.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

// API Endpoints
app.post("/api/gemini/generate", async (req, res) => {
  try {
    const result = await handleGenerate(req.body);
    res.status(result.success ? 200 : 500).json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Internal server error" });
  }
});

app.get("/api/gemini/status", (_req, res) => {
  res.json({
    configured: Boolean(process.env.GEMINI_API_KEY),
    model: "gemini-3.7-flash",
    status: "ready",
  });
});

// Serve static assets in production
app.use(express.static(path.join(__dirname, "dist")));

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
});
