import express from "express";
import cors from "cors";
import settingsRouter from "./routes/settings";
import profileRoutes from "./routes/members";
import scheduleRoutes from "./routes/schedule";

const app = express();

app.use(cors({
  origin: [
    "https://qwer-fansite-admin.vercel.app", // admin 페이지의 실제 URL
    "https://qwer-fansite-front.vercel.app" // front_end 페이지의 실제 URL 
  ]
}));
app.use(express.json());
app.use("/api/settings", settingsRouter);
app.use("/api/members", profileRoutes);
app.use("/api/schedule", scheduleRoutes);

export default app;