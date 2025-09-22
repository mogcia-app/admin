import type { NextApiRequest, NextApiResponse } from "next";

const API_BASE = "https://us-central1-signal-v1-fc481.cloudfunctions.net";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, body, query } = req;
  const id = query.id as string | undefined;

  try {
    if (method === "GET") {
      if (id) {
        // 単一ガイド取得
        const r = await fetch(`${API_BASE}/getGuides`);
        const data = await r.json();
        const guide = (data.guides || []).find((g: any) => g.id === id);
        res.status(200).json({ guide });
      } else {
        // 一覧取得
        const r = await fetch(`${API_BASE}/getGuides`);
        const data = await r.json();
        res.status(200).json(data);
      }
    } else if (method === "POST") {
      // 作成
      const r = await fetch(`${API_BASE}/createGuide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await r.json();
      res.status(201).json(data);
    } else if (method === "PUT") {
      // 更新
      const r = await fetch(`${API_BASE}/updateGuide?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await r.json();
      res.status(200).json(data);
    } else if (method === "DELETE") {
      // 削除
      const r = await fetch(`${API_BASE}/deleteGuide?id=${id}`, {
        method: "DELETE" });
      const data = await r.json();
      res.status(200).json(data);
    } else {
      res.status(405).end();
    }
  } catch (error) {
    res.status(500).json({ error: "API連携エラー" });
  }
}
