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
        <div className="relative w-full rounded-t-lg aspect-video overflow-hidden border-b">
          <Image
            src={thumbnail}
            alt={chapter.title}
            width={600}
            height={400}
            className={cn("w-full aspect-video h-full object-cover transition-all", isLocked && "grayscale-[50%] blur-[2px] brightness-[0.25]")}
            unoptimized
          />
          {isLocked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
              <Lock className="w-12 h-12 text-white/90 drop-shadow-lg mb-2" />
              <p className="text-sm font-medium text-white/90 drop-shadow-md text-center">
                You don't have access to this chapter
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
