import express, { type Express } from "express";
import cors from "cors";
import { healthRouter } from "./routes/health";
import { trackRouter } from "./routes/track";
import { adminRouter } from "./routes/admin";
import { facebookRouter } from "./routes/facebook";

const app: Express = express();
app.use(cors());
app.use(express.json());

app.use("/api", healthRouter);
app.use("/api", trackRouter);
app.use("/api/admin", adminRouter);
app.use("/api/facebook", facebookRouter);

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

export { app };
