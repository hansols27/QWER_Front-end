import { Request, Response } from "express";
import * as noticeService from "../services/noticeService";

// 목록 조회
export async function getNotices(req: Request, res: Response) {
  try {
    const notices = await noticeService.getNotices();
    res.json(notices);
  } catch (err) {
    res.status(500).json({ error: "공지사항 조회 실패" });
  }
}

// 상세 조회
export async function getNotice(req: Request, res: Response) {
  try {
    const notice = await noticeService.getNotice(req.params.id);
    res.json(notice);
  } catch (err) {
    res.status(404).json({ error: "공지사항을 찾을 수 없습니다." });
  }
}

// 등록
export async function createNotice(req: Request, res: Response) {
  try {
    const { type, title, content } = req.body;
    const newNotice = await noticeService.createNotice({ type, title, content });
    res.status(201).json(newNotice);
  } catch (err) {
    res.status(500).json({ error: "공지사항 등록 실패" });
  }
}

// 수정
export async function updateNotice(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { type, title, content } = req.body;
    await noticeService.updateNotice(id, { type, title, content });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "공지사항 수정 실패" });
  }
}

// 삭제
export async function deleteNotice(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await noticeService.deleteNotice(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "공지사항 삭제 실패" });
  }
}
