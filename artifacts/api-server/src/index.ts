import express, { type Express } from "express";
import cors from "cors";
import healthRouter from "./routes/health.js";
import trackRouter from "./routes/track.js";
import adminRouter from "./routes/admin.js";
import facebookRouter from "./routes/facebook.js";

const app: Express = express();
const PORT = process.env["PORT"] ?? 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Routes
app.use("/api", healthRouter);
app.use("/api", trackRouter);
app.use("/api/admin", adminRouter);
app.use("/api/facebook", facebookRouter);

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

export default app;
