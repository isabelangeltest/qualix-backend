import express from "express";
import cors from "cors";
import puppeteer from "puppeteer";
import lighthouse from "lighthouse";
import { URL } from "url";

const app = express();
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("✅ QualiX backend OK (Puppeteer + Lighthouse)");
});

app.post("/api/auditar", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL requerida" });

  let browser;
  try {
    // Lanza Chromium de Puppeteer
    browser = await puppeteer.launch({
      headless: "new",
      executablePath: puppeteer.executablePath(),
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-zygote",
        "--remote-debugging-port=9222", // 👈 Fuerza el puerto para Lighthouse
      ],
    });

    // Lighthouse necesita la URL del navegador
    const endpointURL = new URL(browser.wsEndpoint());
    const port = endpointURL.port;

    // Ejecuta Lighthouse en ese puerto
    const { lhr } = await lighthouse(url, {
      port,
      output: "json",
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    });

    const result = {
      performance: Math.round(lhr.categories.performance.score * 100),
      accessibility: Math.round(lhr.categories.accessibility.score * 100),
      bestPractices: Math.round(lhr.categories["best-practices"].score * 100),
      seo: Math.round(lhr.categories.seo.score * 100),
    };

    res.json(result);
  } catch (error) {
    console.error("❌ Error en auditoría:", error);
    res.status(500).json({ error: "Fallo al ejecutar Lighthouse" });
  } finally {
    if (browser) await browser.close();
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Backend escuchando en puerto ${PORT}`);
});
