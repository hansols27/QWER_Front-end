import express from "express";
import cors from "cors";
import settingsRouter from "./routes/settings";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/settings", settingsRouter);

app.listen(4000, () => {
  console.log("Server running on http://localhost:4000");
});
