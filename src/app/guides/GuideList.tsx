"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function GuideList() {
  const [guides, setGuides] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/guides")
      .then(res => res.json())
      .then(data => setGuides(data.guides || []));
  }, []);

  if (guides.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📚</div>
        <h3 className="text-lg font-semibold mb-2">ガイドがありません</h3>
        <p className="text-muted-foreground">新しいガイドを作成してください。</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {guides.map((guide) => (
        <Card key={guide.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {guide.thumbnail && (
                  <img src={guide.thumbnail} alt="thumbnail" className="w-20 h-20 object-cover rounded" />
                )}
                <div>
                  <CardTitle className="text-lg">{guide.title}</CardTitle>
                  <div className="text-xs text-muted-foreground mt-1">
                    {guide.createdAt && new Date(guide.createdAt.seconds ? guide.createdAt.seconds * 1000 : guide.createdAt).toLocaleDateString("ja-JP")}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/guides/${guide.id}/edit`}>
                  <Button variant="ghost" size="sm">編集</Button>
                </Link>
                <Link href={`/guides/${guide.id}/delete`}>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">削除</Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
              {guide.content}
            </p>
            {guide.images && guide.images.length > 0 && (
              <div className="flex gap-2 mt-2">
                {guide.images.map((img: string, idx: number) => (
                  <img key={idx} src={img} alt="guide-img" className="w-12 h-12 object-cover rounded" />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
