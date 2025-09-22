import React from "react";

export default function GuidesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: "32px" }}>
      <h1>ガイド管理</h1>
      {children}
    </div>
  );
}
