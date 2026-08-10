"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import "@fortawesome/fontawesome-free/css/all.min.css";
interface iAppProps {
  lesson: {
    id: string;
    title: string;
    position: number;
    description: string | null;
    videoDuration?: string | null;
    lessonType?: "VIDEO" | "PDF" | null;
  };
  slug: string;
  chapterId: string;
  isActive?: boolean;
  completed: boolean;
  isLocked?: boolean;
}

export function LessonItem({
  lesson,
  slug,
  chapterId,
  isActive,
  completed,
  isLocked,
}: iAppProps) {
  
  const content = (
    <>
      {/* Left: icon + text */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p
              className={cn(
                "text-sm font-medium truncate",
                completed
                  ? "text-green-800 dark:text-green-200"
                  : "text-foreground",
                isLocked && "text-muted-foreground line-through opacity-70"
              )}
            >
              {lesson.title}
            </p>
            {isLocked && <span className="text-xs">🔒</span>}
          </div>
          {/* Video duration or PDF label */}
          {!completed && (
            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1.5 leading-none">
              {lesson.lessonType === "PDF" ? (
                <>
                  <i className="fas fa-file-pdf text-[11px] relative top-[0.5px] opacity-80"></i>
                  <span className="leading-none">PDF</span>
                </>
              ) : lesson.lessonType === "VIDEO" ? (
                <>
                  <i className="fas fa-video text-[11px] relative top-[0.5px] opacity-80"></i>
                  <span className="leading-none">
                    VIDEO {lesson.videoDuration || ""}
                  </span>
                </>
              ) : null}
            </p>
          )}

          {completed && (
            <p className="text-[10px] text-green-700 dark:text-green-300 font-medium">
              Completed
            </p>
          )}
        </div>
      </div>

      {/* Right: currently watching */}
      {isActive && !completed && !isLocked && (
        <div className="flex items-center ml-2">
          <p className="text-[10px] text-primary font-medium whitespace-nowrap">
            Currently Watching
          </p>
        </div>
      )}
    </>
  );

  const containerClasses = cn(
    "group flex w-full rounded-lg border transition-all p-3 pr-4",
    isLocked 
      ? "opacity-50 cursor-not-allowed bg-muted/30 border-transparent" 
      : "hover:bg-accent hover:text-accent-foreground",
    completed && !isLocked && "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    !completed && !isLocked && "border-border bg-background",
    isActive && !completed && !isLocked && "bg-primary/10 dark:bg-primary/20 border-primary/50 hover:bg-primary/20 dark:hover:bg-primary/30 text-primary-foreground"
  );

  if (isLocked) {
    return <div className={containerClasses}>{content}</div>;
  }

  return (
    <Link
      href={`/dashboard/sections/${slug}/chapters/${chapterId}/${lesson.id}`}
      className={containerClasses}
    >
      {content}
    </Link>
  );
}
