import { Request, Response } from "express";
import * as videoService from "../services/videoService";

export async function getVideos(req: Request, res: Response) {
  try {
    const videos = await videoService.getVideos();
    res.json(videos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
}

export async function getVideoById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const video = await videoService.getVideoById(id);
    if (!video) return res.status(404).json({ error: "Not found" });
    res.json(video);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch video" });
  }
}

export async function createVideo(req: Request, res: Response) {
  try {
    const { title, src } = req.body;
    if (!title || !src) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const video = await videoService.createVideo({ title, src });
    res.json(video);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create video" });
  }
}

export async function updateVideo(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await videoService.updateVideo(id, req.body);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update video" });
  }
}

export async function deleteVideo(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await videoService.deleteVideo(id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete video" });
  }
}
