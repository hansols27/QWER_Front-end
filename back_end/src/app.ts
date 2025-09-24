import express from "express";
import cors from "cors";
import settingsRouter from "./routes/settings";

const app = express();

app.use(cors({
  origin: ["https://your-admin.vercel.app", "https://your-front.vercel.app"]
}));
app.use(express.json());
app.use("/api/settings", settingsRouter);

export default app;
