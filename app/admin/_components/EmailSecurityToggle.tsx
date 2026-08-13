"use client";

import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, MailX } from "lucide-react";

export function EmailSecurityToggle() {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/email-security")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          // emailSecurityEnabled = true means Normal security (emails ON)
          // enabled state for switch: true means "Decrease Security" is ON (emails OFF)
          // Wait, let's keep it simple: The switch is for "Decrease Email Security"
          // If setting is TRUE (emails on), "Decrease Security" is OFF.
          // If setting is FALSE (emails off), "Decrease Security" is ON.
          setEnabled(!data.emailSecurityEnabled);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleToggle = async (checked: boolean) => {
    setEnabled(checked);
    setLoading(true);
    
    try {
      const res = await fetch("/api/admin/email-security", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        // send enabled = !checked, because if "Decrease Security" is checked, we set emailSecurityEnabled to false
        body: JSON.stringify({ enabled: !checked }),
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
      } else {
        toast.error("Failed to update email security setting");
        setEnabled(!checked); // revert
      }
    } catch {
      toast.error("Network error");
      setEnabled(!checked); // revert
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-3 bg-card border border-border px-4 py-2 rounded-md shadow-sm">
      {enabled ? (
        <MailX className="h-4 w-4 text-red-500" />
      ) : (
        <Mail className="h-4 w-4 text-green-500" />
      )}
      <Label htmlFor="email-security-toggle" className="text-sm font-medium cursor-pointer">
        Decrease Email Security
      </Label>
      <Switch
        id="email-security-toggle"
        checked={enabled}
        onCheckedChange={handleToggle}
        disabled={loading}
        className={enabled ? "bg-red-500" : ""}
      />
    </div>
  );
}
