import { Request, Response } from "express";
import * as settingsService from "../services/settingsService";
import type { SnsLink } from "@shared/types/settings";

export const getSettings = async (req: Request, res: Response) => {
  try {
    const settings = await settingsService.getSettings();
    res.json({ success: true, data: settings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch settings" });
  }
};

export const saveSettings = async (req: Request, res: Response) => {
  try {
    let snsLinks: SnsLink[] = [];
    try {
      snsLinks = JSON.parse(req.body.snsLinks || "[]") as SnsLink[];
      if (!Array.isArray(snsLinks) || !snsLinks.every(l => l.id && l.url)) {
        throw new Error("Invalid SNS links");
      }
    } catch {
      return res.status(400).json({ success: false, message: "Invalid SNS links" });
    }

    const file = req.file;
    const settings = await settingsService.saveSettings(snsLinks, file);
    res.json({ success: true, data: settings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to save settings" });
  }
};
