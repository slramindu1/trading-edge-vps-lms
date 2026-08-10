import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import Logo from "@/app/logo-white.png";
import Image from "next/image";
import { Toaster } from "sonner"; // ← Add this line

export default function AuthLayout({ children }: { children: ReactNode }) {
  const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL || "/";

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center">
      {/* Sonner Toaster */}
      <Toaster position="top-right" />

      <Link
        href={landingUrl}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "absolute top-4 left-4"
        )}
      >
        <ArrowLeft className="size-4 mr-2" />
        Back
      </Link>

      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          href={landingUrl}
          className="flex items-center gap-2 self-center font-medium"
        >
          <Image src={Logo} alt="Logo" width={292} height={252} />
        </Link>
        {children}
      </div>

      <div className="text-xs text-muted-foreground text-center mt-4">
        By clicking Login, you agree to our
        <div>
          <span className=" underline cursor-pointer hover:underline hover:text-primary">
            Terms of Service
          </span>{" "}
          and{" "}
          <span className=" underline cursor-pointer hover:underline hover:text-primary">
            Privacy Policy
          </span>
          .
        </div>
      </div>
    </div>
  );
}
