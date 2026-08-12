import Link from "next/link";
import { XCircle } from "lucide-react";

export default function NotAdminPage() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md text-center bg-white p-8 rounded-xl shadow-sm border">
        <div className="flex justify-center mb-6">
          <XCircle className="h-16 w-16 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-500 mb-8">
          You do not have permission to access the admin dashboard. This area is restricted to administrators only.
        </p>
        <Link 
          href="/dashboard" 
          className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-8 text-sm font-medium text-white shadow transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-700"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
