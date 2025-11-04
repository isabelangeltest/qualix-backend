// backend-qualix/index.js
import express from "express";
import cors from "cors";
import puppeteer from "puppeteer";
import lighthouse from "lighthouse";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("✅ QualiX backend OK (Puppeteer + Lighthouse)");
});

app.post("/api/auditar", async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ error: "La URL es obligatoria" });

    // 1) Lanzar Chromium (instalado por Nixpacks) con flags para contenedor
    const executablePath =
      process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium";
    const browser = await puppeteer.launch({
      headless: "new",
      executablePath,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--remote-debugging-port=9222",
        "--remote-debugging-address=0.0.0.0",
      ],
    });

    // 2) Conectar Lighthouse al puerto de depuración de ese mismo Chrome
    const flags = {
      logLevel: "error",
      output: "json",
      port: 9222,
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    };

    const runnerResult = await lighthouse(url, flags);
    const cat = runnerResult.lhr.categories;

    const data = {
      performance: (cat.performance?.score ?? 0) * 100,
      accessibility: (cat.accessibility?.score ?? 0) * 100,
      bestPractices: (cat["best-practices"]?.score ?? 0) * 100,
      seo: (cat.seo?.score ?? 0) * 100,
    };

    // 3) Cerrar el navegador
    await browser.close();

    return res.json({
      ...data,
      promedio: (
        (data.performance + data.accessibility + data.bestPractices + data.seo) /
        4
      ).toFixed(2),
    });
  } catch (err) {
    console.error("❌ Error en auditoría:", err);
    return res.status(500).json({
      error: "No se pudo completar la auditoría",
      detalle: err?.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend escuchando en puerto ${PORT}`);
});
