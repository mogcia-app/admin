import React, { useState } from "react";

export default function GuideNewPage() {
  const [title, setTitle] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);

  // 画像追加用
  const [imageUrl, setImageUrl] = useState("");

  const handleAddImage = () => {
    if (imageUrl) {
      setImages([...images, imageUrl]);
      setImageUrl("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // APIリクエスト例
    await fetch("/api/guides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, thumbnail, content, images, createdBy: "admin" })
    });
    alert("ガイドを作成しました");
    // リダイレクト等
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 600, margin: "0 auto" }}>
      <h2>ガイド新規作成</h2>
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
      <button type="submit" style={{ marginTop: 24 }}>作成</button>
    </form>
  );
}
