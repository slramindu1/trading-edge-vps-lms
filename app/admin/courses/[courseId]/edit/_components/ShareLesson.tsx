"use client";

import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

export function ShareLesson({ lessonId, slug, chapterId }: {
  lessonId: string,
  slug: string,
  chapterId: string
}) {
  const handleShare = () => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/dashboard/sections/${slug}/chapters/${chapterId}/${lessonId}`
        : "";

    navigator.clipboard.writeText(url);
    toast.success("Lesson link copied to clipboard!");
  };

  return (
    <Button size="icon" variant="outline" onClick={handleShare}>
      <Share2 className="size-4" />
    </Button>
  );
}

