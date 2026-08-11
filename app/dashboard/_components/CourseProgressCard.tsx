"use client";

import type { SectionType } from "@/app/data/user/get-enrolled-courses";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCourseProgress } from "@/hooks/use-course-progress";
import Image from "next/image";
import Link from "next/link";

import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface iAppProps {
  data: SectionType; // <-- You are receiving only the SECTION
  isLocked?: boolean;
}

export function CourseProgressCard({ data, isLocked }: iAppProps) {
  const section = data; // <-- FIX: This is already the section

  const { totalLessons, completedLessons, progressPercentage } =
    useCourseProgress({ courseData: section });

  return (
    <Card className={cn("group relative py-0 gap-0 transition-all", isLocked && "border-rose-500/20 shadow-md")}>
      <Link href={isLocked ? "#" : `/dashboard/sections/${section.slug}/chapters`} className={cn(isLocked && "pointer-events-none")}>
        <div className="relative">
          <Image
            src={section.fileKey}
            alt="Course Thumbnail"
            width={600}
            height={400}
            className={cn("w-full rounded-t-lg aspect-video h-full object-cover", isLocked && "grayscale-[80%] blur-[3px]")}
            unoptimized
          />
          {isLocked && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30">
              <div className="bg-background/90 backdrop-blur-xl border border-white/10 dark:border-white/5 shadow-2xl rounded-xl p-4 flex flex-col items-center text-center mx-4 max-w-[80%]">
                <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center mb-2 border border-rose-500/20">
                  <Lock className="w-5 h-5 text-rose-500" />
                </div>
                <h3 className="text-base font-bold text-foreground">Content Locked</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                  You do not have access to this course.
                </p>
              </div>
            </div>
          )}
        </div>
      </Link>
      <CardContent className="p-4">
        <Link
          href={isLocked ? "#" : `/dashboard/${section.slug}`}
          className={cn("font-medium text-lg line-clamp-2 hover:underline group-hover:text-primary transition-colors", isLocked && "pointer-events-none")}
        >
          {section.title}
        </Link>

        <p className="line-clamp-2 text-sm text-muted-foreground leading-tight mt-2">
          {section.smallDescription}
        </p>

        {/* --- Progress UI --- */}
        <div className="mt-4">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Your Progress</span>
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
          href={isLocked ? "#" : `/dashboard/sections/${section.slug}/chapters`}
          className={buttonVariants({
            className: cn("w-full flex items-center justify-center gap-2 mt-4", isLocked && "cursor-not-allowed bg-muted text-muted-foreground hover:bg-muted pointer-events-none"),
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
