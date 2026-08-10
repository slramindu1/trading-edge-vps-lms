"use client";

import { useState } from "react";
import { Shield, BookLock, Award, TimerOff, CheckCircle2, XCircle, ChevronRight, Power, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ManifestUpdate {
  id: string;
  name: string;
  version: string;
  tier: string;
  description: string;
  longDescription: string;
  icon: string;
  files: string[];
  requiresBuild: boolean;
  changelog: string[];
}

interface FeatureFlag {
  id: string;
  featureKey: string;
  enabled: boolean;
  version: string | null;
  enabledAt: Date | null;
  enabledBy: string | null;
  availableAt?: Date | null;
}

interface UpdateHistory {
  id: string;
  featureKey: string;
  action: string;
  version: string;
  performedBy: string;
  createdAt: Date;
}

interface Props {
  updates: ManifestUpdate[];
  flags: FeatureFlag[];
  history: UpdateHistory[];
  adminEmail: string;
  onFlagsChange: (flags: FeatureFlag[]) => void;
}

const ICONS: Record<string, React.ReactNode> = {
  shield: <Shield className="w-5 h-5" />,
  lock: <BookLock className="w-5 h-5" />,
  award: <Award className="w-5 h-5" />,
  timer: <TimerOff className="w-5 h-5" />,
};

export function MasterPanel({ updates, flags, history, onFlagsChange }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [localFlags, setLocalFlags] = useState(flags);
  const [scheduleDates, setScheduleDates] = useState<Record<string, string>>({});

  const getFlag = (id: string) => localFlags.find(f => f.featureKey === id);

  const isEnabled = (id: string) => {
    return getFlag(id) !== undefined;
  };

  const handleToggle = async (update: ManifestUpdate, newEnabled: boolean) => {

    setLoading(update.id);
    try {
      const payload: any = { featureKey: update.id, enabled: newEnabled, version: update.version };
      if (newEnabled && scheduleDates[update.id]) {
        payload.availableAt = new Date(scheduleDates[update.id]).toISOString();
      }

      const res = await fetch("/api/admin/updates/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        let newFlags: FeatureFlag[];
        if (newEnabled) {
          const exists = localFlags.some(f => f.featureKey === update.id);
          if (exists) {
            newFlags = localFlags.map(f => 
              f.featureKey === update.id ? { ...f, availableAt: payload.availableAt ? new Date(payload.availableAt) : null } : f
            );
          } else {
            newFlags = [...localFlags, {
              id: crypto.randomUUID(), featureKey: update.id, enabled: false,
              version: update.version, enabledAt: null, enabledBy: null,
              availableAt: payload.availableAt ? new Date(payload.availableAt) : null
            }] as FeatureFlag[];
          }
        } else {
          newFlags = localFlags.filter(f => f.featureKey !== update.id);
        }
        setLocalFlags(newFlags);
        onFlagsChange(newFlags);
        toast.success(`${update.name} ${newEnabled ? "enabled" : "disabled"} for client.`);
      } else {
        const err = await res.json();
        toast.error(err.error || "Toggle failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (update: ManifestUpdate) => {
    
    if (!confirm(`Are you sure you want to permanently delete "${update.name}"? Clients will no longer see this update.`)) {
      return;
    }

    setDeleting(update.id);
    try {
      const res = await fetch("/api/admin/updates/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: update.id }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Update deleted successfully");
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error(data.error || "Delete failed");
      }
    } catch {
      toast.error("Network error while deleting");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-10">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
            <span>Admin</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-medium">Master Control Panel</span>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 border border-primary/20">
              <Power className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent">
              Master Control Panel
            </h1>
          </div>
          <p className="text-muted-foreground text-lg mt-1">
            Enable or disable feature updates for this installation.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Authenticated as Master Admin
          </div>
        </div>
      </div>

      {/* Feature Toggle Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
        {updates.map((update) => {
          const enabled = isEnabled(update.id);
          const isLoading = loading === update.id;

          return (
            <div
              key={update.id}
              className={cn(
                "rounded-2xl border p-6 transition-all duration-300",
                enabled ? "border-emerald-500/30 bg-emerald-500/5" : "border-border bg-card"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                    enabled ? "bg-emerald-500/20 text-emerald-400" : "bg-muted text-muted-foreground"
                  )}>
                    {ICONS[update.icon]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-sm leading-tight">{update.name}</p>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        update.tier === "FREE"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-amber-500/15 text-amber-400"
                      )}>
                        {update.tier}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{update.description}</p>
                    <p className="text-xs text-muted-foreground/50 mt-1">v{update.version}</p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={() => handleToggle(update, !enabled)}
                  disabled={isLoading}
                  className={cn(
                    "relative w-14 h-7 rounded-full transition-all duration-300 shrink-0 mt-1",
                    enabled ? "bg-emerald-500" : "bg-muted",
                    !isLoading && "cursor-pointer hover:opacity-90"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300",
                    enabled ? "left-8" : "left-1"
                  )} />
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3 h-3 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {enabled ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Client can enable this feature
                      </div>
                      {getFlag(update.id)?.availableAt && new Date(getFlag(update.id)!.availableAt!) > new Date() && (
                        <div className="text-[10px] text-emerald-500/70 ml-5">
                          Scheduled for: {new Date(getFlag(update.id)!.availableAt!).toLocaleString()}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <XCircle className="w-3.5 h-3.5" />
                        Client sees locked button
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Schedule Release:</label>
                        <input
                          type="datetime-local"
                          value={scheduleDates[update.id] || ""}
                          onChange={(e) => setScheduleDates(prev => ({ ...prev, [update.id]: e.target.value }))}
                          className="bg-muted border border-border rounded text-xs px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(update)}
                  disabled={deleting === update.id}
                  title="Revoke Feature License"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] uppercase font-bold tracking-wider rounded border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                >
                  {deleting === update.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Feature History</h2>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Feature</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Action</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">By</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                    <td className="px-5 py-3 font-medium">{h.featureKey}</td>
                    <td className="px-5 py-3">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                        h.action === "INSTALLED" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
                      )}>
                        {h.action === "INSTALLED" ? "ENABLED" : "DISABLED"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">{h.performedBy}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {new Date(h.createdAt).toLocaleDateString("en-GB", { dateStyle: "medium" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
