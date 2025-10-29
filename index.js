import express from "express";
import cors from "cors";
import lighthouse from "lighthouse";
import puppeteer from "puppeteer";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("✅ Servidor QualiX backend funcionando correctamente en Railway con Puppeteer + Lighthouse");
});

app.post("/api/auditar", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "Debe proporcionar una URL válida." });
    }

    const target = /^https?:\/\//i.test(url) ? url : `https://${url}`;

    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-zygote",
        "--single-process"
      ],
      executablePath: puppeteer.executablePath(),
    });

    const endpoint = new URL(browser.wsEndpoint());
    const port = endpoint.port;

    const runnerResult = await lighthouse(target, {
      logLevel: "info",
      output: "json",
      port,
    });

    await browser.close();

    res.json({
      metrics: {
        performance: runnerResult.lhr.categories.performance.score,
        accessibility: runnerResult.lhr.categories.accessibility.score,
        seo: runnerResult.lhr.categories.seo.score,
        bestPractices: runnerResult.lhr.categories["best-practices"].score,
      },
    });
  } catch (error) {
    console.error("❌ Error en auditoría:", error);
    res.status(500).json({
      error: "No se pudo auditar el sitio",
      detalle: error.message,
    });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend escuchando en el puerto ${PORT}`);
});
