import Link from "next/link";
import { XCircle } from "lucide-react";

export default function NotAdminPage() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4">
      <div className="max-w-md text-center bg-card p-8 rounded-xl shadow-sm border border-border">
        <div className="flex justify-center mb-6">
          <XCircle className="h-16 w-16 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-8">
          You do not have permission to access the admin dashboard. This area is restricted to administrators only.
        </p>
        <Link 
          href="/dashboard" 
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
