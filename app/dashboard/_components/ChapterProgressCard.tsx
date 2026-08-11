"use client";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCourseProgress } from "@/hooks/useCourseProgress";

import Image from "next/image";
import Link from "next/link";
import { SectionType, ChapterType } from "./types";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChapterProgressCardProps {
  section: SectionType; // full section
  chapter: ChapterType; // current chapter
  isLocked?: boolean;
}

export function ChapterProgressCard({
  section,
  chapter,
  isLocked,
}: ChapterProgressCardProps) {
  // Pass only the current chapter to the hook
  const { totalLessons, completedLessons, progressPercentage } =
    useCourseProgress({ courseData: { ...section, chapters: [chapter] } });

  const thumbnail = chapter.fileKey ?? "/default-chapter-thumbnail.jpg";

  return (
    <Card className={cn("group relative py-0 gap-0 transition-all", isLocked && "opacity-60")}>
      <Link href={isLocked ? "#" : `/dashboard/sections/${section.slug}/chapters/${chapter.id}`} className={cn(isLocked && "pointer-events-none")}>
        <div className="relative">
          <Image
            src={thumbnail}
            alt={chapter.title}
            width={600}
            height={400}
            className={cn("w-full rounded-t-lg aspect-video h-full object-cover", isLocked && "grayscale-[50%] blur-[2px]")}
            unoptimized
          />
          {isLocked && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="bg-background/80 backdrop-blur-md p-3 rounded-full shadow-lg">
                <Lock className="w-6 h-6 text-primary" />
              </div>
            </div>
          )}
        </div>
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
          href={isLocked ? "#" : `/dashboard/sections/${section.slug}/chapters/${chapter.id}`}
          className={buttonVariants({
            className: cn("w-full flex items-center justify-center gap-2 mt-4", isLocked && "cursor-not-allowed bg-muted text-muted-foreground hover:bg-muted pointer-events-none"),
          })}
        >
          {isLocked ? (
            <>
              <Lock className="w-4 h-4 mr-1" /> Locked
            </>
          ) : (
            "Continue Learning"
          )}
        </Link>
      </CardContent>
    </Card>
  );
}
