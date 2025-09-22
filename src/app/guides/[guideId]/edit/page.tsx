"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function GuideEditPage(props: any) {
  const router = useRouter();
  const guideId = props?.params?.guideId ?? "";
  const [guide, setGuide] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    if (guideId) {
      fetch(`/api/guides?id=${guideId}`)
        .then(res => res.json())
        .then(data => {
          setGuide(data.guide);
          setTitle(data.guide.title || "");
          setThumbnail(data.guide.thumbnail || "");
          setContent(data.guide.content || "");
          setImages(data.guide.images || []);
        });
    }
  }, [guideId]);

  const handleAddImage = () => {
    if (imageUrl) {
      setImages([...images, imageUrl]);
      setImageUrl("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/guides?id=${guideId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, thumbnail, content, images })
    });
    alert("ガイドを更新しました");
    router.push("/guides");
  };

  if (!guide) return <div>読み込み中...</div>;

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 600, margin: "0 auto" }}>
      <h2>ガイド編集</h2>
      <div>
        <label>見出し：</label>
        <input value={title} onChange={e => setTitle(e.target.value)} required style={{ width: "100%" }} />
      </div>
      <div>
        <label>サムネイル画像URL：</label>
        <input value={thumbnail} onChange={e => setThumbnail(e.target.value)} style={{ width: "100%" }} />
      </div>
      <div>
        <label>本文：</label>
        <textarea value={content} onChange={e => setContent(e.target.value)} required rows={8} style={{ width: "100%" }} />
      </div>
      <div>
        <label>本文内画像URL：</label>
        <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} style={{ width: "80%" }} />
        <button type="button" onClick={handleAddImage}>画像追加</button>
        <div>
          {images.map((img, idx) => (
            <img key={idx} src={img} alt="guide-img" style={{ maxWidth: 120, margin: 4 }} />
          ))}
        </div>
      </div>
      <button type="submit" style={{ marginTop: 24 }}>更新</button>
    </form>
  );
}
