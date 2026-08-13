"use client";

import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Settings, Database, Mail, MailX } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export function AdminOptionsDropdown() {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/email-security")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
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
        body: JSON.stringify({ enabled: !checked }),
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
      } else {
        toast.error("Failed to update email security setting");
        setEnabled(!checked);
      }
    } catch {
      toast.error("Network error");
      setEnabled(!checked);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Settings className="w-4 h-4" />
          Options
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>System Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Email Security Toggle inside dropdown menu */}
        <div className="flex items-center justify-between px-2 py-2">
          <div className="flex items-center gap-2">
            {enabled ? (
              <MailX className="h-4 w-4 text-red-500" />
            ) : (
              <Mail className="h-4 w-4 text-green-500" />
            )}
            <span className="text-sm font-medium">Decrease Email Security</span>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={loading}
            className={enabled ? "bg-red-500" : ""}
          />
        </div>

        <DropdownMenuSeparator />

        {/* Download Backup */}
        <DropdownMenuItem asChild>
          <a 
            href="/api/admin/backup" 
            download="backup.json" 
            className="flex items-center gap-2 cursor-pointer w-full text-blue-600 focus:text-blue-600 focus:bg-blue-50 dark:text-blue-400 dark:focus:bg-blue-950"
          >
            <Database className="w-4 h-4" />
            Download Database Backup
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
