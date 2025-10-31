import express from "express";
import cors from "cors";
import lighthouse from "lighthouse";
import puppeteer from "puppeteer";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.post("/api/auditar", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "La URL es obligatoria" });
  }

  try {
    console.log(`🚀 Iniciando auditoría para: ${url}`);

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu"
      ]
    });

    const { lhr } = await lighthouse(url, {
      port: new URL(browser.wsEndpoint()).port,
      output: "json",
      logLevel: "info",
    });

    await browser.close();

    res.json({
      url: lhr.finalUrl,
      performance: lhr.categories.performance.score,
      accessibility: lhr.categories.accessibility.score,
      bestPractices: lhr.categories["best-practices"].score,
      seo: lhr.categories.seo.score,
      promedio: (
        (lhr.categories.performance.score +
          lhr.categories.accessibility.score +
          lhr.categories["best-practices"].score +
          lhr.categories.seo.score) /
        4
      ).toFixed(2),
    });
  } catch (error) {
    console.error("❌ Error al auditar:", error);
    res.status(500).json({
      error: "No se pudo auditar el sitio",
      detalle: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Servidor backend en ejecución en puerto ${PORT}`);
});
