import fs from "fs";
import path from "path";

const settingsFile = path.join("/tmp", "settings.json");

export default function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "https://qwer-fansite-admin.vercel.app/");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    if (fs.existsSync(settingsFile)) {
      return res.status(200).json(JSON.parse(fs.readFileSync(settingsFile, "utf-8")));
    }
    return res.status(200).json({ snsLinks: [], mainImage: "/assets/images/main.png" });
  }

  if (req.method === "POST") {
    const body = req.body;
    fs.writeFileSync(settingsFile, JSON.stringify(body, null, 2), "utf-8");
    return res.status(200).json({ success: true, data: body });
  }

  return res.status(405).json({ message: "Method Not Allowed" });
}
