require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const db = require("./config/db");

const app = express();
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false }));
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ success: true, message: "TicketHub API and database are running." });
  } catch {
    res.status(503).json({ success: false, message: "Database connection failed." });
  }
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/events", require("./routes/events"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/tickets", require("./routes/tickets"));
app.use("/api/payments", require("./routes/payments"));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "An unexpected server error occurred." });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`TicketHub running at http://localhost:${port}`));
