import express from "express";
import cors from "cors";
import puppeteer from "puppeteer";
import lighthouse from "lighthouse";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("✅ QualiX backend OK (Puppeteer + Lighthouse en Render)");
});

app.post("/api/auditar", async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ error: "La URL es obligatoria" });

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
        "--remote-debugging-address=0.0.0.0"
      ]
    });

    const flags = {
      logLevel: "error",
      output: "json",
      port: 9222,
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"]
    };

    const runner = await lighthouse(url, flags);
    const cat = runner.lhr.categories;

    const data = {
      performance: Math.round((cat.performance?.score ?? 0) * 100),
      accessibility: Math.round((cat.accessibility?.score ?? 0) * 100),
      bestPractices: Math.round((cat["best-practices"]?.score ?? 0) * 100),
      seo: Math.round((cat.seo?.score ?? 0) * 100)
    };

    await browser.close();

    res.json({
      ...data,
      promedio: (
        (data.performance + data.accessibility + data.bestPractices + data.seo) / 4
      ).toFixed(2)
    });
  } catch (err) {
    console.error("❌ Error en auditoría:", err);
    res.status(500).json({ error: "No se pudo completar la auditoría", detalle: err?.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend escuchando en puerto ${PORT}`);
});
