"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { chapterSchema, ChapterSchemaType } from "@/lib/zodSchemas";
import { useForm } from "react-hook-form";
import { useTransition } from "react";
import { tryCatch } from "@/hooks/try-catch";
import { updateChapter } from "../actions";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { RichTextEditor } from "@/components/rich-text-editor/Editor";
import Uploader from "@/components/file-uploader/Uploader";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface Props {
  data: ChapterSchemaType;
  chapterId: string;
  courseId: string;
}

export function ChapterEditForm({ data, chapterId, courseId }: Props) {
  const [pending, startTransition] = useTransition();

  const form = useForm<ChapterSchemaType>({
    resolver: zodResolver(chapterSchema),
    defaultValues: {
      name: data.name,
      description: data.description ?? "",
      smallDescription: data.smallDescription ?? "",
      fileKey: data.fileKey ?? undefined,
      courseId: data.courseId,
    },
  });

  function onSubmit(values: ChapterSchemaType) {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(
        updateChapter(values, chapterId)
      );

      if (error) {
        toast.error("Unexpected error, try again later");
        return;
      }

      if (result.status === "success") toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <div>
      <Link
        href={`/admin/courses/${courseId}/edit`}
        className="mb-6 inline-flex items-center gap-2 border px-3 py-1 rounded-md"
      >
        <ArrowLeft className="size-4" /> Go Back
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Chapter Configurations</CardTitle>
          <CardDescription>
            Update the chapter name, description, and thumbnail.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chapter Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter chapter name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

              <FormField
                control={form.control}
                name="smallDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Short description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fileKey"
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

              <Button type="submit" disabled={pending}>
                {pending ? "Saving..." : "Save Chapter"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
