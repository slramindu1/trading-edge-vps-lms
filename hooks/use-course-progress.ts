"use client";

import { useMemo } from "react";

interface ProgressLesson {
  id: string;
  LessonProgress: { completed: boolean; LessonId: string }[];
}

interface ProgressTopic {
  lessons?: ProgressLesson[];
}

interface ProgressChapter {
  topics?: ProgressTopic[];
}

interface ProgressCourse {
  chapters: ProgressChapter[];
}

interface iAppProps {
  courseData: ProgressCourse;
}

interface CourseProgressResult {
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
}

export function useCourseProgress({ courseData }: iAppProps): CourseProgressResult {
  return useMemo(() => {
    let totalLessons = 0;
    let completedLessons = 0;

    courseData.chapters.forEach((chapter) => {
      // 🔹 Fix: iterate topics first
      (chapter.topics ?? []).forEach((topic) => {
        (topic.lessons ?? []).forEach((lesson) => {
          totalLessons++;

          const isCompleted = lesson.LessonProgress.some(
            (progress) => progress.LessonId === lesson.id && progress.completed
          );

          if (isCompleted) {
            completedLessons++;
          }
        });
      });
    });

    const progressPercentage =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return {
      totalLessons,
      completedLessons,
      progressPercentage,
    };
  }, [courseData]);
}
