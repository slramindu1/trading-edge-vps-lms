"use client";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCourseProgress } from "@/hooks/useCourseProgress";

import Image from "next/image";
import Link from "next/link";
import { SectionType, ChapterType } from "./types";

interface ChapterProgressCardProps {
  section: SectionType; // full section
  chapter: ChapterType; // current chapter
}

export function ChapterProgressCard({
  section,
  chapter,
}: ChapterProgressCardProps) {
  // Pass only the current chapter to the hook
  const { totalLessons, completedLessons, progressPercentage } =
    useCourseProgress({ courseData: { ...section, chapters: [chapter] } });

  const thumbnail = chapter.fileKey ?? "/default-chapter-thumbnail.jpg";

  return (
    <Card className="group relative py-0 gap-0">
      <Link
        href={`/dashboard/sections/${section.slug}/chapters/${chapter.id}`}
      >
        <Image
          src={thumbnail}
          alt={chapter.title}
          width={600}
          height={400}
          className="w-full rounded-t-lg aspect-video h-full object-cover"
          unoptimized
        />
      </Link>

      <CardContent className="p-4">
        <h3 className="font-medium text-lg">{chapter.title}</h3>
        {chapter.smallDescription && (
          <p className="text-sm text-muted-foreground mt-1">
            {chapter.smallDescription}
          </p>
        )}

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Progress</span>
            <span className="font-medium">{progressPercentage}%</span>
          </div>
          <div className="relative w-full bg-muted rounded-full h-2 mt-1 overflow-hidden">
            <div
              className="h-2 bg-primary transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-sm mt-2 font-medium">
            {completedLessons}/{totalLessons} Lessons Completed
          </p>
        </div>

        <Link
          href={`/dashboard/sections/${section.slug}/chapters/${chapter.id}`}
          className={buttonVariants({
            className: "w-full flex items-center justify-center gap-2 mt-4",
          })}
        >
          Continue Learning
        </Link>
      </CardContent>
    </Card>
  );
}
