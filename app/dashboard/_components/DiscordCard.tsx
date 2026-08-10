"use client";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

export function DiscordCard() {
  return (
    <Card className="group relative py-0 gap-0">
      <Link
        href={`https://discord.com/invite/u4vNjJ2DyX`}
        className="font-medium text-lg line-clamp-2 hover:underline group-hover:text-primary transition-colors"
      >
        <Image
          src="/uploads/tradingedge95260.png"
          alt="Course Thumbnail"
          width={600}
          height={400}
          className="w-full rounded-t-lg aspect-video h-full object-cover"
          unoptimized
        />
      </Link>

      <CardContent className="p-4">
        <Link
          href={`https://discord.com/invite/u4vNjJ2DyX`}
          className="font-medium text-lg line-clamp-2 hover:underline group-hover:text-primary transition-colors"
        >
          Join Discord Server
        </Link>

        <p className="line-clamp-2 text-sm text-muted-foreground leading-tight mt-2">
          Connect with fellow learners and get support in our Discord community!
        </p>

        {/* --- Progress UI --- */}
        <div className="mt-4">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Your Progress</span>
            <span className="font-medium">100%</span>
          </div>

          <div className="relative w-full bg-muted rounded-full h-2 mt-1 overflow-hidden">
            <div
              className="h-2 bg-primary transition-all"
              style={{ width: `$100%` }}
            />
          </div>

          <p className="text-sm mt-2 font-medium">Link Clicked</p>
        </div>

        <Link
          href={`https://discord.com/invite/u4vNjJ2DyX`}
          // href={`/dashboard/Chapters`}
          className={buttonVariants({
            className: "w-full flex items-center justify-center gap-2 mt-4",
          })}
        >
          Continue Learning
        </Link>
      </CardContent>
    </Card>
  );
}
