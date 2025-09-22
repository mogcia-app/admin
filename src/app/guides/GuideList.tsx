"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function GuideList() {
  const [guides, setGuides] = useState<any[]>([]);

  useEffect(() => {
    // APIからガイド一覧取得
    fetch("/api/guides")
      .then(res => res.json())
      .then(data => setGuides(data.guides || []));
  }, []);

  return (
    <div>
      <h2>ガイド一覧</h2>
      <ul>
        {guides.map(guide => (
          <li key={guide.id} style={{ marginBottom: 24, borderBottom: "1px solid #eee", paddingBottom: 16 }}>
            {guide.thumbnail && (
              <img src={guide.thumbnail} alt="thumbnail" style={{ maxWidth: 120, marginRight: 16 }} />
            )}
            <div>
              <strong>{guide.title}</strong>
            </div>
            <div style={{ margin: "8px 0" }}>
              {guide.content?.slice(0, 60)}...
            </div>
            <Link href={`/guides/${guide.id}/edit`}>
              <button style={{ marginRight: 8 }}>編集</button>
            </Link>
            <Link href={`/guides/${guide.id}/delete`}>
              <button>削除</button>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
