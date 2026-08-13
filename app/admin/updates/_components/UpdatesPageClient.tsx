"use client";

import { useState, useMemo, useEffect } from "react";
import { MasterPanel } from "./MasterPanel";
import { cn } from "@/lib/utils";
import { CheckCircle2, Lock, Download, RotateCcw, Sparkles, Shield, BookLock, Award, TimerOff, ChevronRight, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

type FeatureFlag = {
  id: string;
  featureKey: string;
  enabled: boolean;
  version: string | null;
  enabledAt: Date | null;
  enabledBy: string | null;
  availableAt?: Date | null;
};

type UpdateHistory = {
  id: string;
  featureKey: string;
  action: string;
  version: string;
  performedBy: string;
  createdAt: Date;
};

type ManifestUpdate = {
  id: string;
  name: string;
  version: string;
  tier: "FREE" | "PAID";
  price?: number;
  description: string;
  longDescription: string;
  icon: string;
  files: string[];
  requiresBuild: boolean;
  changelog: string[];
};

interface Props {
  isMaster: boolean;
  adminEmail: string;
  flags: FeatureFlag[];
  history: UpdateHistory[];
}

const STATIC_UPDATES: ManifestUpdate[] = [
  {
    id: "security-system",
    name: "Advanced Security System with Location Tracking",
    version: "1.0.0",
    tier: "FREE",
    description: "Device verification, OTP login, session tracking & live location map",
    longDescription: "Protect your LMS with military-grade session management. Every login is verified with OTP on new devices. Admins get a real-time location map of all active users.",
    icon: "shield",
    files: [],
    requiresBuild: false,
    changelog: ["OTP-based device verification", "Single-device session enforcement", "Live location map in settings", "Automatic session logout on new device"],
  },
  {
    id: "chapter-locking",
    name: "Chapter Locking System",
    version: "1.0.0",
    tier: "PAID",
    price: 3000,
    description: "Lock/unlock individual lessons, topics, chapters per student",
    longDescription: "Take full control of student access. Lock any lesson, topic or chapter for specific students. Perfect for phased course delivery or revoking access.",
    icon: "lock",
    files: [],
    requiresBuild: false,
    changelog: ["Per-student lesson locking", "Topic & chapter level controls", "Visual lock indicators in sidebar", "Admin access tree UI"],
  },
  {
    id: "testimonial-tool",
    name: "Customizable Testimonial Tool",
    version: "1.0.0",
    tier: "PAID",
    price: 3500,
    description: "Auto-generate beautiful testimonials on course completion",
    longDescription: "Reward your students with auto-generated completion testimonials. Fully customizable templates with student name, course name, date and your branding.",
    icon: "award",
    files: [],
    requiresBuild: false, // Changed to false as per new toggle system
    changelog: ["Auto-generate on course completion", "Custom template designer", "PDF download for students", "Admin testimonial management"],
  },
  {
    id: "auto-deactivation",
    name: "Automatic Student Deactivation",
    version: "1.0.0",
    tier: "PAID",
    price: 1500,
    description: "Automatically deactivate student accounts after 1 year",
    longDescription: "Set it and forget it. Student accounts are automatically deactivated exactly 1 year after enrollment. Customizable duration and email warnings before deactivation.",
    icon: "timer",
    files: [],
    requiresBuild: false,
    changelog: ["Auto-deactivate after 1 year", "30/7/1 day warning emails", "Configurable duration per student", "Admin override controls"],
  },
  {
    id: "settings-page",
    name: "User Settings Dashboard",
    version: "1.0.0",
    tier: "FREE",
    description: "Allow students to manage their profile, security, and data",
    longDescription: "A comprehensive settings page allowing students to view their profile, change their avatar, manage account security, and download their data.",
    icon: "shield",
    files: [],
    requiresBuild: false,
    changelog: ["Account Profile Tab", "Security Tab", "Sessions Map Tab", "Data Management Tab"],
  },
  {
    id: "landing-new-code-optimization-update",
    name: "Landing Page Optimizations",
    version: "1.0.0",
    tier: "PAID",
    price: 2500,
    description: "Caching and performance optimizations for the Landing Page.",
    longDescription: "Dramatically improves loading speed using Incremental Static Regeneration and Next.js Image optimizations.",
    icon: "timer",
    files: [],
    requiresBuild: true,
    changelog: ["Next.js Image component optimization", "Incremental Static Regeneration (ISR)", "Production environment variable fixes", "Bug fixes in builder module"]
  },
  {
    id: "lms-new-code-optimization-update",
    name: "LMS Security & Performance Update",
    version: "1.0.0",
    tier: "PAID",
    price: 5000,
    description: "Major security fixes and speed improvements for LMS.",
    longDescription: "Includes advanced error logging, database connection pooling to prevent crashes, backend pagination, and fixes for timezone and location mapping.",
    icon: "shield",
    files: [],
    requiresBuild: true,
    changelog: ["Prisma Connection Pooling Singleton", "Advanced Admin Error Logging", "Admin Student List Pagination", "Location mapping API fix", "Next.js cache tag signature fix"]
  }
];

const ICONS: Record<string, React.ReactNode> = {
  shield: <Shield className="w-7 h-7" />,
  lock: <BookLock className="w-7 h-7" />,
  award: <Award className="w-7 h-7" />,
  timer: <TimerOff className="w-7 h-7" />,
};

const ICON_COLORS: Record<string, string> = {
  shield: "from-emerald-500/20 to-emerald-600/10 text-emerald-400 border-emerald-500/20",
  lock: "from-blue-500/20 to-blue-600/10 text-blue-400 border-blue-500/20",
  award: "from-amber-500/20 to-amber-600/10 text-amber-400 border-amber-500/20",
  timer: "from-purple-500/20 to-purple-600/10 text-purple-400 border-purple-500/20",
};

export function UpdatesPageClient({ isMaster, adminEmail, flags, history }: Props) {
  const [localFlags, setLocalFlags] = useState(flags);
  const [localHistory, setLocalHistory] = useState(history);
  const [rollbackTarget, setRollbackTarget] = useState<string | null>(null);
  const [loadingUpdate, setLoadingUpdate] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const updates = useMemo(() => [...STATIC_UPDATES], []);

  const getFlag = (id: string) => localFlags.find(f => f.featureKey === id);
  const isLicensed = (update: ManifestUpdate) => getFlag(update.id) !== undefined;
  
  // A feature is "Installed" if it is both licensed and enabled
  const isInstalled = (update: ManifestUpdate) => {
    const flag = getFlag(update.id);
    return flag ? flag.enabled : false;
  };

  const getInstalledVersion = (id: string): string | null => {
    const flag = getFlag(id);
    return flag && flag.enabled ? (flag.version || "1.0.0") : null;
  };

  const handleInstall = async (update: ManifestUpdate) => {
    if (!isLicensed(update)) {
      toast.error("This update requires a license. Contact your provider.");
      return;
    }
    
    setLoadingUpdate(update.id);
    try {
      const res = await fetch("/api/admin/updates/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featureKey: update.id, version: update.version }),
      });

      if (!res.ok) throw new Error("Failed to enable feature");

      const data = await res.json();
      
      setLocalFlags(prev => prev.map(f => f.featureKey === update.id ? { ...f, enabled: true, version: update.version } : f));
      setLocalHistory(prev => [{
        id: crypto.randomUUID(),
        featureKey: update.id,
        action: "INSTALLED",
        version: update.version,
        performedBy: adminEmail,
        createdAt: new Date()
      }, ...prev]);
      
      toast.success(`${update.name} enabled successfully!`);
    } catch (err) {
      toast.error("Failed to enable feature. Please try again.");
    } finally {
      setLoadingUpdate(null);
    }
  };

  const handleRollback = async (update: ManifestUpdate) => {
    setLoadingUpdate(update.id);
    setRollbackTarget(null);
    
    try {
      const res = await fetch("/api/admin/updates/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featureKey: update.id, version: update.version }),
      });

      if (!res.ok) throw new Error("Failed to disable feature");

      setLocalFlags(prev => prev.map(f => f.featureKey === update.id ? { ...f, enabled: false } : f));
      setLocalHistory(prev => [{
        id: crypto.randomUUID(),
        featureKey: update.id,
        action: "ROLLED_BACK",
        version: update.version,
        performedBy: adminEmail,
        createdAt: new Date()
      }, ...prev]);
      
      toast.success(`${update.name} disabled successfully!`);
    } catch (err) {
      toast.error("Failed to disable feature. Please try again.");
    } finally {
      setLoadingUpdate(null);
    }
  };

  if (isMaster) {
    return <MasterPanel updates={updates} flags={localFlags} history={localHistory} adminEmail={adminEmail} onFlagsChange={setLocalFlags} />;
  }

  return (
    <div className="min-h-screen p-6 md:p-10">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
          <span>Admin</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground font-medium">System Features</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent">
            System Features
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Manage and enable features for your LMS platform instantly.
          </p>
        </div>
      </div>

      {/* Update Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {updates.map((update) => {
          const installed = isInstalled(update);
          const licensed = isLicensed(update);
          const installedVer = getInstalledVersion(update.id);
          const isProcessing = loadingUpdate === update.id;

          return (
            <div
              key={update.id}
              className={cn(
                "group relative rounded-2xl border bg-card overflow-hidden transition-all duration-300",
                installed
                  ? "border-emerald-500/30 shadow-emerald-500/5 shadow-lg"
                  : licensed
                  ? "border-primary/30 hover:border-primary/50 hover:shadow-primary/5 hover:shadow-lg"
                  : "border-border/50 opacity-80"
              )}
            >
              {/* Gradient overlay top */}
              <div className={cn(
                "absolute top-0 inset-x-0 h-1 rounded-t-2xl",
                installed ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                : licensed ? "bg-gradient-to-r from-primary to-primary/60"
                : "bg-gradient-to-r from-muted to-muted/50"
              )} />

              <div className="p-6">
                {/* Top row: icon + badge */}
                <div className="flex items-start justify-between mb-5">
                  <div className={cn(
                    "w-14 h-14 rounded-xl border bg-gradient-to-br flex items-center justify-center",
                    ICON_COLORS[update.icon]
                  )}>
                    {ICONS[update.icon]}
                  </div>

                  <div className="flex items-center gap-2">
                    {update.tier === "FREE" ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                        <Sparkles className="w-3 h-3" /> FREE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                        <Award className="w-3 h-3" /> {update.price ? `Rs. ${update.price}` : "PREMIUM"}
                      </span>
                    )}
                    {installed ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> Enabled
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Title + description */}
                <h3 className="text-lg font-bold mb-2 leading-tight">{update.name}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">{update.longDescription}</p>

                {/* Changelog */}
                <ul className="space-y-1.5 mb-6">
                  {update.changelog.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>

                {/* Version + installed info */}
                {installedVer && (
                  <p className="text-xs text-muted-foreground/60 mb-4">
                    Enabled v{installedVer}
                  </p>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-3 flex-wrap">
                  {installed ? (
                    <>
                      <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        Feature Active
                      </div>
                      {rollbackTarget === update.id ? (
                        <div className="flex items-center gap-2 ml-auto">
                          <span className="text-xs text-amber-400">Are you sure?</span>
                          <button
                            disabled={isProcessing}
                            onClick={() => handleRollback(update)}
                            className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/20 hover:bg-rose-500/25 transition-colors font-medium disabled:opacity-50"
                          >
                            {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                            Yes, Disable
                          </button>
                          <button
                            disabled={isProcessing}
                            onClick={() => setRollbackTarget(null)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          disabled={isProcessing}
                          onClick={() => setRollbackTarget(update.id)}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-muted text-muted-foreground border border-border hover:bg-muted/80 transition-colors ml-auto disabled:opacity-50"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Disable
                        </button>
                      )}
                    </>
                  ) : licensed ? (
                    (() => {
                      const flag = getFlag(update.id);
                      const availableAt = flag?.availableAt ? new Date(flag.availableAt) : null;
                      const isLocked = availableAt && availableAt > now;

                      if (isLocked) {
                        const diff = availableAt.getTime() - now.getTime();
                        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
                        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
                        const m = Math.floor((diff / 1000 / 60) % 60);
                        const s = Math.floor((diff / 1000) % 60);
                        
                        return (
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Available in</span>
                            <div className="flex items-center gap-2 font-mono text-sm">
                              <div className="flex flex-col items-center bg-muted/50 rounded px-2 py-1 min-w-10">
                                <span className="font-semibold text-primary">{d}</span>
                                <span className="text-[8px] uppercase text-muted-foreground">Days</span>
                              </div>
                              <span className="text-muted-foreground">:</span>
                              <div className="flex flex-col items-center bg-muted/50 rounded px-2 py-1 min-w-10">
                                <span className="font-semibold text-primary">{h.toString().padStart(2, '0')}</span>
                                <span className="text-[8px] uppercase text-muted-foreground">Hrs</span>
                              </div>
                              <span className="text-muted-foreground">:</span>
                              <div className="flex flex-col items-center bg-muted/50 rounded px-2 py-1 min-w-10">
                                <span className="font-semibold text-primary">{m.toString().padStart(2, '0')}</span>
                                <span className="text-[8px] uppercase text-muted-foreground">Mins</span>
                              </div>
                              <span className="text-muted-foreground">:</span>
                              <div className="flex flex-col items-center bg-muted/50 rounded px-2 py-1 min-w-10">
                                <span className="font-semibold text-primary">{s.toString().padStart(2, '0')}</span>
                                <span className="text-[8px] uppercase text-muted-foreground">Secs</span>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <button
                          disabled={isProcessing}
                          onClick={() => handleInstall(update)}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                          Enable Feature
                        </button>
                      );
                    })()
                  ) : (
                    <button
                      disabled
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-muted text-muted-foreground font-semibold text-sm cursor-not-allowed border border-border"
                    >
                      <Lock className="w-4 h-4" />
                      Contact Provider to Unlock
                    </button>
                  )}
                </div>

                {/* Rollback warning */}
                {rollbackTarget === update.id && (
                  <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-400/90">
                      Disabling this feature will remove it instantly. Students will lose access. You can enable it again anytime.
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Update History */}
      {localHistory.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-4">Feature History</h2>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Feature</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Action</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Version</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {localHistory.map((h) => (
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
                    <td className="px-5 py-3 text-muted-foreground">v{h.version}</td>
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
