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
import { topicSchema, TopicSchemaType } from "@/lib/zodSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { DialogTitle } from "@radix-ui/react-dialog";
import { PlusIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { createTopic } from "../actions";
import { toast } from "sonner";
import { tryCatch } from "@/hooks/try-catch";

export function NewTopicModal({ chapterId }: { chapterId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const form = useForm<TopicSchemaType>({
    resolver: zodResolver(topicSchema),
    defaultValues: {
      title: "",
      chapterId: chapterId,
    },
  });

  async function onSubmit(data: TopicSchemaType) {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(createTopic(data));

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
    if (!open) {
      form.reset();
    }
    setIsOpen(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="default"
          className="gap-3 cursor-pointer py-3 px-4 rounded-lg"
        >
          <PlusIcon className="h-4 w-4" /> New Topic
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[640px] w-full p-8 rounded-2xl min-h-[260px]">
        <DialogHeader className="mb-6 text-left">
          <DialogTitle className="text-2xl font-semibold leading-tight">
            Create New Topic
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            Enter the topic name
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium">Topic Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Topic Name"
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
