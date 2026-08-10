import { Ban, PlusCircle } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "../ui/button";

interface iAppProps {
  title: string;
  description: string;
  buttonText: string;
  href: string;
}

export function EmptyState({ title, description, buttonText, href}: iAppProps) {
  return (
    <div className="flex flex-col flex-1 h-full items-center justify-center rounded-md border-dashed border p-8 text-center animate-in fade-in-50">
      
      <div className="flex w-20 h-20 items-center justify-center rounded-full bg-primary/10 mb-6">
        <Ban className="w-10 h-10 text-primary" />
      </div>

      <h2 className="mt-6 text-2xl font-semibold text-white">{title}</h2>
      {description && (
        <p className="mt-2 mb-8 text-sm leading-tight text-white">
          {description}
        </p>
      )}

      {buttonText && (
        <Link
          href={href}
          className={buttonVariants({ variant: "default" })}
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          {buttonText}
        </Link>
      )}
    </div>
  );
}
