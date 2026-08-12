"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ServerCrash, WifiOff, AlertCircle, Laptop, Globe, MapPin, Search } from "lucide-react";

interface ErrorDetailsModalProps {
  error: any;
  isOpen: boolean;
  onClose: () => void;
}

export function ErrorDetailsModal({ error, isOpen, onClose }: ErrorDetailsModalProps) {
  if (!error) return null;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "SYSTEM":
        return <ServerCrash className="w-5 h-5 text-rose-500" />;
      case "NETWORK":
        return <WifiOff className="w-5 h-5 text-orange-500" />;
      case "USER":
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "SYSTEM":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      case "NETWORK":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "USER":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background">
        <DialogHeader className="p-6 border-b bg-muted/20">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${getCategoryColor(error.category).split(" ")[0]}`}>
              {getCategoryIcon(error.category)}
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-xl">{error.category} ERROR</DialogTitle>
              <p className="text-sm font-medium text-muted-foreground break-all">
                {error.message}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
          {/* Main Error Content (Stack Trace) */}
          <div className="md:col-span-2 p-6 bg-muted/5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">Error Location (URL)</h3>
              <div className="p-2.5 rounded-md bg-muted font-mono text-xs break-all">
                {error.method ? <span className="font-bold mr-2 text-primary">{error.method}</span> : null}
                {error.url || "Unknown URL"}
              </div>
            </div>

            {error.stack && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Stack Trace</h3>
                <div className="h-[250px] w-full rounded-md bg-black/90 p-4 border border-zinc-800 overflow-auto">
                  <pre className="font-mono text-[11px] leading-relaxed text-red-400 break-all whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Metadata */}
          <div className="p-6 space-y-6 bg-muted/10">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Context</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Recorded At</p>
                    <p className="font-medium">{new Date(error.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Laptop className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">User Agent</p>
                    <p className="font-medium text-xs truncate max-w-[150px]" title={error.userAgent}>
                      {error.userAgent || "Unknown"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Network</p>
                    <p className="font-medium">{error.networkSpeed || "Unknown"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">IP Address</p>
                    <p className="font-mono text-xs">{error.ipAddress || "Unknown"}</p>
                  </div>
                </div>
              </div>
            </div>

            {error.userId && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Affected User</h3>
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/10 flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">User ID</span>
                  <span className="text-sm font-mono break-all">{error.userId}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
