import { isFeatureEnabled } from "@/lib/feature-flags";
import { notFound } from "next/navigation";
import { ReactNode } from "react";

export default async function BuilderLayout({ children }: { children: ReactNode }) {
  const isTestimonialEnabled = await isFeatureEnabled("testimonial-tool");
  
  if (!isTestimonialEnabled) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-center p-8 border rounded-xl max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-red-500">Feature Disabled</h2>
          <p className="text-muted-foreground">
            The Testimonial Builder is currently disabled. Please enable it in the Master Control Panel to access this feature.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
