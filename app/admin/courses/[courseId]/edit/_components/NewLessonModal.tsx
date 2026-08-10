import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  lessonSchema,
  LessonSchemaType,
} from "@/lib/zodSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { DialogTitle } from "@radix-ui/react-dialog";
import { PlusIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createLesson } from "../actions";
import { toast } from "sonner";
import { tryCatch } from "@/hooks/try-catch";

export function NewLessonModal({
  courseId,
  chapterId,
}: {
  courseId: string;
  chapterId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const form = useForm<LessonSchemaType>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      name: "",
      sectionId: courseId,
      chapterId: chapterId,
    },
  });

  async function onSubmit(data: LessonSchemaType) {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(createLesson(data));

      if (error) {
        toast.error("An unexpected error occurred");
        return;
      }

      if (result.status === "success") {
        toast.success(result.message);
        form.reset();
        setIsOpen(false);
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  }

  function handleOpenChange(open: boolean) {
    if(!open){
      form.reset();
    }
    setIsOpen(open);
  }
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {/* Button size vadi kara, gap vadi kara */}
        <Button
          variant="outline"
          size="default"
          className="w-full justify-center gap-1"
        >
          <PlusIcon className="h-4 w-4" /> New Lesson
        </Button>
      </DialogTrigger>

      {/* Dialog content: wider, more padding, taller min-height, larger rounded */}
      <DialogContent className="sm:max-w-[640px] w-full p-8 rounded-2xl min-h-[260px]">
        <DialogHeader className="mb-6 text-left">
          {/* Bigger title */}
          <DialogTitle className="text-2xl font-semibold leading-tight">
            Create New Lesson
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            Enter your Lesson name
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium">
                    Lesson Name
                  </FormLabel>

                  <FormControl>
                    <Input
                      placeholder="Lesson Name"
                      {...field}
                      className="w-full h-12 rounded-lg text-base placeholder:opacity-70 px-4"
                    />
                  </FormControl>

                  <FormMessage className="text-sm" />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <div className="flex items-center justify-end gap-3">
                <Button
                  type="submit"
                  size="default"
                  className="py-3 px-5 rounded-lg"
                  disabled={pending}
                >
                  {pending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
