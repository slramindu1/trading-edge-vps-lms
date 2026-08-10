"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ReactNode, useEffect, useState } from "react";
import { CSS } from "@dnd-kit/utilities";
import { AdminCourseSingularType } from "@/app/data/admin-get-course";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";
import { reorderChapters, reorderLessons } from "../actions";
import { NewchapterModal } from "./NewChapterModal";
import { NewLessonModal } from "./NewLessonModal";
import { DeleteLesson } from "./DeleteLesson";
import { DeleteChapter } from "./DeleteChapter";
import { ShareLesson } from "./ShareLesson";
import { closestCenter } from "@dnd-kit/core";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent, // ← ADD THIS
  DraggableSyntheticListeners, // ← ADD THIS
} from "@dnd-kit/core";

interface iAppProps {
  data: AdminCourseSingularType;
}

interface SortableItemProps {
  id: string;

  children: (listeners: DraggableSyntheticListeners) => ReactNode; // ← FIXED
  className?: string;
  data?: {
    type: "chapter" | "lesson";
    chapterId?: string;
  };
}

export function SubTopicStrucutre({ data }: iAppProps) {
  const initialItems =
    data.chapters
      ?.slice()
      .sort((a, b) => a.position - b.position)
      .map((chapter) => ({
        id: chapter.id,
        title: chapter.title,
        order: chapter.position,
        isOpen: false,
        lessons: chapter.lessons
          ?.slice()
          .sort((a, b) => a.position - b.position)
          .map((lesson) => ({
            id: lesson.id,
            title: lesson.title,
            order: lesson.position,
          })),
      })) || [];

  const [items, setItems] = useState(initialItems);
  console.log("items", items);

  useEffect(() => {
    if (!data?.chapters) return;

    setItems((prev) => {
      const prevMap = new Map(prev.map((c) => [c.id, c]));

      return data.chapters
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((chapter) => ({
          id: chapter.id,
          title: chapter.title,
          order: chapter.position,
          isOpen: prevMap.get(chapter.id)?.isOpen ?? true,
          lessons: chapter.lessons
            ?.slice()
            .sort((a, b) => a.position - b.position)
            .map((lesson) => ({
              id: lesson.id,
              title: lesson.title,
              order: lesson.position,
            })),
        }));
    });
  }, [data.id]); // 🔥 NOT whole data

  function SortableItem({ children, id, className, data }: SortableItemProps) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id, data });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        className={cn("touch-none", className, isDragging ? "z-10" : "")}
      >
        {children(listeners)}
      </div>
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const activeId = active.id;
    const overId = over.id;
    const activeType = active.data.current?.type as "chapter" | "lesson";
    const overType = over.data.current?.type as "chapter" | "lesson";
    const CourseId = data.id;

    if (activeType === "chapter") {
      let targetChapterId = null;

      if (overType === "chapter") {
        targetChapterId = overId;
      } else if (overType === "lesson") {
        targetChapterId = over.data.current?.chapterId ?? null;
      }
      if (!targetChapterId) {
        toast.error("could not determine the chapter for reordering");
        return;
      }

      const oldIndex = items.findIndex((item) => item.id === activeId);
      const newIndex = items.findIndex((item) => item.id === targetChapterId);

      if (oldIndex === -1 || newIndex === -1) {
        toast.error("could not determine the chapter indices for reordering");
        return;
      }

      const reordedLocalChapters = arrayMove(items, oldIndex, newIndex);

      const UpdatedChapterForState = reordedLocalChapters.map(
        (chapter, index) => ({
          ...chapter,
          order: index + 1,
        })
      );

      const previousItems = structuredClone(items);

      setItems(UpdatedChapterForState);
      if (CourseId) {
        const chaptersToUpdate = UpdatedChapterForState.map((chapter) => ({
          id: chapter.id,
          position: chapter.order,
        }));

        const reorderPromise = () =>
          reorderChapters(CourseId, chaptersToUpdate);

        toast.promise(reorderPromise(), {
          loading: "Reordering chapters...",
          success: (result) => {
            if (result.status === "success") {
              return result.message;
            }
            throw new Error("Unexpected response from server.");
          },
          error: () => {
            setItems(previousItems);
            return "Failed to reorder chapters.";
          },
        });
      }
    }

    if (activeType === "lesson" && overType === "lesson") {
      const chapterId = active.data.current?.chapterId;
      const overChapterId = over.data.current?.chapterId;

      if (!chapterId || chapterId !== overChapterId) {
        toast.error("Cannot reorder lessons across different chapters");
        return;
      }

      const chapterIndex = items.findIndex(
        (chapter) => chapter.id === chapterId
      );

      if (chapterIndex === -1) {
        toast.error("Could not find the chapter for reordering lessons");
        return;
      }
      const chapterToUpdate = items[chapterIndex];
      const oldLessonIndex = chapterToUpdate.lessons.findIndex(
        (lesson) => lesson.id === activeId
      );
      const newLessonIndex = chapterToUpdate.lessons.findIndex(
        (lesson) => lesson.id === overId
      );
      if (oldLessonIndex === -1 || newLessonIndex === -1) {
        toast.error("Could not find the lesson indices for reordering");
        return;
      }

      const reorderedLessons = arrayMove(
        chapterToUpdate.lessons,
        oldLessonIndex,
        newLessonIndex
      );
      const updatedLessonsForState = reorderedLessons.map((lesson, index) => ({
        ...lesson,
        order: index + 1,
      }));

      const newItems = [...items];
      newItems[chapterIndex] = {
        ...chapterToUpdate,
        lessons: updatedLessonsForState,
      };

      const previousItems = structuredClone(items);
      setItems(newItems);

      if (CourseId) {
        const lessonsToUpdate = updatedLessonsForState.map((lesson) => ({
          id: lesson.id,
          position: lesson.order,
        }));

        const reorderLessonsPromise = reorderLessons(
          chapterId,
          lessonsToUpdate,
          CourseId
        );

        toast.promise(reorderLessonsPromise, {
          loading: "Reordering lessons...",
          success: (result) => {
            if (result.status === "success") {
              return result.message;
            } else {
              setItems(previousItems);
              return "Unexpected response from server.";
            }
          },
          error: () => {
            setItems(previousItems);
            return "Failed to reorder lessons.";
          },
        });
      }

      return;
    }
  }

  function toggleChapter(chapterId: string) {
    setItems((prev) =>
      prev.map((chapter) =>
        chapter.id === chapterId
          ? { ...chapter, isOpen: !chapter.isOpen }
          : chapter
      )
    );
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-border">
          <CardTitle>Chapters</CardTitle>
          <NewchapterModal courseId={data.id} />
        </CardHeader>
        <CardContent>
          <SortableContext
            items={items.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            {items.map((item) => (
              <SortableItem
                key={item.id}
                id={item.id}
                data={{ type: "chapter" }}
              >
                {(listeners) => (
                  <Card className="mb-3 border">
                    <Collapsible
                      open={item.isOpen}
                      onOpenChange={() => toggleChapter(item.id)}
                    >
                      <div className="flex items-center justify-between p-3 border-b border-border">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="cursor-grab opacity-60 hover:opacity-100"
                            {...listeners}
                          >
                            <GripVertical className="size-4" />
                          </Button>
                          <CollapsibleTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="flex items-center"
                            >
                              {item.isOpen ? (
                                <ChevronDown className="size-4" />
                              ) : (
                                <ChevronRight className="size-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>

                          <Link
                            href={`/admin/courses/${data.id}/${item.id}/edit`}
                          >
                            {item.title}
                          </Link>
                        </div>
                        <DeleteChapter
                          chapterId={item.id}
                          sectionId={data.id}
                        />
                      </div>

                      <CollapsibleContent>
                        <div className="p-1">
                          <SortableContext
                            items={item.lessons.map((lesson) => lesson.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {item.lessons.map((lesson) => (
                              <SortableItem
                                key={lesson.id}
                                id={lesson.id}
                                data={{ type: "lesson", chapterId: item.id }}
                              >
                                {(lessonListeners) => (
                                  <div className="flex items-center justify-between p-2 hover:bg-accent rounded-sm">
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        {...lessonListeners}
                                      >
                                        <GripVertical className="size-4" />
                                      </Button>
                                      <FileText className="size-4" />
                                      {/* <Link
                                          href={`/admin/courses/${data.id}/${item.id}/${lesson.id}`}
                                        > */}
                                      <Link
                                        href={`/admin/courses/${data.id}/${item.id}/${lesson.id}`}
                                      >
                                        {lesson.title}
                                      </Link>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <ShareLesson
                                        lessonId={lesson.id}
                                        chapterId={item.id}
                                        slug={data.slug} // Section.slug
                                      />

                                      <DeleteLesson
                                        chapterId={item.id}
                                        sectionId={data.id}
                                        lessonId={lesson.id}
                                      />
                                    </div>
                                  </div>
                                )}
                              </SortableItem>
                            ))}
                          </SortableContext>

                          <div className="p-2">
                            <NewLessonModal
                              chapterId={item.id}
                              courseId={data.id}
                            />
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                )}
              </SortableItem>
            ))}
          </SortableContext>
        </CardContent>
      </Card>
    </DndContext>
  );
}
