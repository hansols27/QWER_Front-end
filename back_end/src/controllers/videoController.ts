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
    // VideoItem.id가 number 타입이지만, URL 파라미터는 string이므로 서비스 계층에서 변환이 필요할 수 있습니다.
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
      return res.status(400).json({ error: "Missing required fields (title or src)" });
    }
    
    const createdAt = new Date().toISOString(); 
    
    const video = await videoService.createVideo({ title, src, createdAt });
    
    res.status(201).json(video); // 생성 성공 시 201 상태 코드 사용
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create video" });
  }
}

export async function updateVideo(req: Request, res: Response) {
  try {
    const { id } = req.params;
    // updateVideo는 partial update를 가정하며, createdAt은 일반적으로 수정하지 않습니다.
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
