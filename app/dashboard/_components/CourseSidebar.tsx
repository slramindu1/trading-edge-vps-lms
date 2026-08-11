"use client";
import { CourseSidebarDataType } from "@/app/data/course/get-course-sidebar-data";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ChevronDown, Play, Lock } from "lucide-react";
import { LessonItem } from "./LessonItem";
import { usePathname } from "next/navigation";
import { useCourseProgress } from "@/hooks/use-course-progress";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface iAppProps {
  course: CourseSidebarDataType["course"];
}

export function CourseSidebar({ course }: iAppProps) {
  const pathname = usePathname();
  const currentLessonId = pathname.split("/").pop();

  const parts = pathname.split("/");
  const currentChapterId = parts[5];

  const currentChapter = course.chapters.find(
    (ch) => ch.id === currentChapterId
  );

  const { completedLessons, progressPercentage, totalLessons } =
    useCourseProgress({ courseData: course });

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <Link
        href={`/dashboard/sections/${course.slug}/chapters`}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "absolute top-4 left-4 mt-13"
        )}
      >
        <ArrowLeft className="size-4 mr-2" />
        Back
      </Link>
      <div className="pb-4 pr-4 border-b border-border mt-12">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Play className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-base leading-tight truncate">
              {currentChapter?.title}
            </h1>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              Forex Trading
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {completedLessons}/{totalLessons} Lessons
            </span>
          </div>
          <Progress value={progressPercentage} className="h-1.5" />
          <p className="text-xs text-muted-foreground">
            {progressPercentage}% Complete
          </p>
        </div>
      </div>

      {/* Chapters → Topics → Lessons */}
      <div className="py-4 pr-2 space-y-3">
        {/* Chapters → Topics → Lessons */}
        <div className="py-4 pr-2 space-y-3">
          {course.chapters.map((chapter) =>
            chapter.topics
              .filter((topic) => topic.lessons.length > 0)
              .map((topic) => (
                <Collapsible key={topic.id}>
                  {/* 🔽 TOPIC TRIGGER */}
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={topic.isLocked || chapter.isLocked}
                      className={cn("w-full flex items-center gap-2 px-3 py-2 h-auto text-left", (topic.isLocked || chapter.isLocked) && "opacity-60 cursor-not-allowed bg-muted/30")}
                    >
                      <ChevronDown className="w-4 h-4 text-primary transition-transform data-[state=open]:rotate-180" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm truncate">
                            {topic.title}
                          </p>
                          {(topic.isLocked || chapter.isLocked) && <Lock className="w-3.5 h-3.5 text-muted-foreground/70" />}
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {topic.lessons.length} Lessons
                        </p>
                      </div>
                    </Button>
                  </CollapsibleTrigger>

                  {/* 🔽 LESSONS */}
                  <CollapsibleContent
                    className="mt-2 pl-4 space-y-1 overflow-hidden
            data-[state=open]:animate-collapsible-down
            data-[state=closed]:animate-collapsible-up"
                  >
                    {topic.lessons.map((lesson) => (
                      <LessonItem
                        key={lesson.id}
                        lesson={lesson}
                        slug={course.slug}
                        chapterId={chapter.id}
                        isActive={currentLessonId === lesson.id}
                        isLocked={lesson.isLocked || topic.isLocked || chapter.isLocked}
                        completed={
                          lesson.LessonProgress.find(
                            (p) => p.LessonId === lesson.id
                          )?.completed || false
                        }
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
