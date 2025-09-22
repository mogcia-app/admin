import React from "react";
import Link from "next/link";
import GuideList from "./GuideList";

export default function GuidesPage() {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Link href="/guides/new">
          <button style={{ padding: "8px 16px", fontWeight: "bold" }}>ガイド新規作成</button>
        </Link>
      </div>
      <GuideList />
    </div>
  );
}
