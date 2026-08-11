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
    <Card className={cn("group relative py-0 gap-0 transition-all", isLocked && "border-rose-500/20 shadow-md")}>
      <Link href={isLocked ? "#" : `/dashboard/sections/${section.slug}/chapters/${chapter.id}`} className={cn(isLocked && "pointer-events-none")}>
        <div className="relative w-full rounded-t-lg aspect-video bg-muted/20 flex flex-col items-center justify-center border-b">
          {!isLocked ? (
            <Image
              src={thumbnail}
              alt={chapter.title}
              width={600}
              height={400}
              className="w-full rounded-t-lg aspect-video h-full object-cover"
              unoptimized
            />
          ) : (
            <div className="flex flex-col items-center text-center p-6 w-full h-full justify-center bg-background/50">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-4 border border-rose-500/20 shadow-sm">
                <Lock className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Chapter Locked</h3>
              <p className="text-sm text-muted-foreground mt-1">
                You do not have access to this chapter.
              </p>
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
            variant: isLocked ? "secondary" : "default",
            className: cn("w-full flex items-center justify-center gap-2 mt-4", isLocked && "cursor-not-allowed opacity-80 pointer-events-none"),
          })}
        >
          {isLocked ? (
            <>
              <Lock className="w-4 h-4 mr-1 text-rose-500" /> <span className="text-rose-500 font-medium">Locked</span>
            </>
          ) : (
            "Continue Learning"
          )}
        </Link>
      </CardContent>
    </Card>
  );
}
