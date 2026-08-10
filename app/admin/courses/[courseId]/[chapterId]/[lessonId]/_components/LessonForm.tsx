"use client";

import { AdminLessonType } from "@/app/data/admin-get-lesson";
import Uploader from "@/components/file-uploader/Uploader";
import { RichTextEditor } from "@/components/rich-text-editor/Editor";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { tryCatch } from "@/hooks/try-catch";
import { lessonSchema, LessonSchemaType } from "@/lib/zodSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { updateLesson } from "../actions";
import { toast } from "sonner";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { NewTopicModal } from "./NewTopicModal";

interface iAppProps {
  data: AdminLessonType;
  chapterId: string;
  courseId?: string;
}

export function LessonForm({ chapterId, data, courseId }: iAppProps) {
  const lessonTypeOptions = [
    { id: "1", name: "PDF", value: "PDF" },
    { id: "2", name: "Video", value: "VIDEO" },
  ];

  // Strongly typed state for lessonType
  const [selectedType, setSelectedType] = useState<"PDF" | "VIDEO" | undefined>(
    data.pdfUrl ? "PDF" : data.videoUrl ? "VIDEO" : undefined
  );

  const [pending, startTransition] = useTransition();
  const topics = data.chapter?.topics ?? [];

  const form = useForm<LessonSchemaType & { videoDuration?: string }>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      name: data.title,
      chapterId: chapterId,
      sectionId: courseId,
      description: data.description ?? undefined,
      thumbnailUrl: data.thumbnailUrl ?? undefined,
      videoUrl: data.videoUrl ?? undefined,
      pdfUrl: data.pdfUrl ?? undefined,
      topicId: data.topicId ?? undefined,
      lessonType: selectedType,
      videoDuration: data.videoDuration ?? undefined,
    },
  });

  function onSubmit(values: LessonSchemaType & { videoDuration?: string }) {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(updateLesson(values, data.id));

      if (error) {
        toast.error("An unexpected error occurred. Please try again later.");
        return;
      }

      if (result.status === "success") {
        toast.success(result.message);
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  }

  return (
    <div>
      <Link
        href={`/admin/courses/${courseId}/edit`}
        className={buttonVariants({ variant: "outline", className: "mb-6" })}
      >
        <ArrowLeft className="size-4" />
        <span>Go Back</span>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Lesson Configuration</CardTitle>
          <CardDescription>Configure the resources for this lesson.</CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Lesson Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lesson Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Lesson Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <RichTextEditor field={field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Thumbnail */}
              <FormField
                control={form.control}
                name="thumbnailUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thumbnail</FormLabel>
                    <FormControl>
                      <Uploader
                        onFileUpload={field.onChange}
                        defaultValue={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Resource Type */}
              <FormField
                control={form.control}
                name="lessonType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resource Type</FormLabel>
                    <Select
                      onValueChange={(val: "PDF" | "VIDEO") => {
                        setSelectedType(val);
                        field.onChange(val);
                      }}
                      defaultValue={selectedType}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Resource Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {lessonTypeOptions.map((type) => (
                          <SelectItem key={type.id} value={type.value}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Conditional Inputs */}
              {selectedType === "PDF" && (
                <FormField
                  control={form.control}
                  name="pdfUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PDF URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter PDF URL (Google Drive, etc.)"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {selectedType === "VIDEO" && (
                <>
                  <FormField
                    control={form.control}
                    name="videoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Video URL</FormLabel>
                        <FormControl>
                          <Input placeholder="Video URL" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="videoDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Video Duration</FormLabel>
                        <FormControl>
                          <Input placeholder="Video Duration (e.g., 12:34)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* Topic Dropdown */}
              <FormField
                control={form.control}
                name="topicId"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Resources Topic</FormLabel>
                    <div className="flex items-center gap-2">
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a topic" />
                        </SelectTrigger>
                        <SelectContent>
                          {topics.map((topic) => (
                            <SelectItem key={topic.id} value={topic.id}>
                              {topic.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <NewTopicModal chapterId={chapterId} />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={pending}>
                {pending ? "Saving..." : "Save Lesson"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
