"use client";
import React from "react";
import { useRouter } from "next/navigation";

export default function GuideDeletePage(props: any) {
  const router = useRouter();
  const guideId = props?.params?.guideId ?? "";

  const handleDelete = async () => {
    if (window.confirm("本当に削除しますか？")) {
      await fetch(`/api/guides?id=${guideId}`, {
        method: "DELETE"
      });
      alert("ガイドを削除しました");
      router.push("/guides");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", textAlign: "center" }}>
      <h2>ガイド削除</h2>
      <p>このガイドを削除しますか？</p>
      <button onClick={handleDelete} style={{ background: "red", color: "white", padding: "8px 16px" }}>削除する</button>
      <button onClick={() => router.push("/guides")} style={{ marginLeft: 16 }}>キャンセル</button>
    </div>
  );
}
