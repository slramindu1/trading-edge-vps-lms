"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  User, Shield, Key, Database, ArrowRight, ArrowLeft,
  Mail, Loader2, MapPin, Camera, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import dynamic from "next/dynamic";

const LeafletMap = dynamic(
  () => import("./LeafletMap").then((m) => m.LeafletMap),
  { ssr: false, loading: () => <div className="w-full h-full bg-neutral-900 animate-pulse rounded-xl" /> }
);

type Tab = "account" | "security" | "sessions" | "data";

interface SettingsClientProps {
  user: {
    fname: string;
    lname: string;
    email: string;
    joined_date: Date;
    profile_image: string | null;
  };
  securityEnabled?: boolean;
  autoDeactivationEnabled?: boolean;
}

export function SettingsClient({ user, securityEnabled = true, autoDeactivationEnabled = true }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("account");
  const [profileImage, setProfileImage] = useState<string | null>(user.profile_image);

  const createdDate = new Date(user.joined_date).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });

  const initials = `${user.fname.charAt(0)}${user.lname.charAt(0)}`.toUpperCase();
  const handleSubscriptionClick = () => setActiveTab("data");

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-neutral-800">
      {/* Top Navbar */}
      <nav className="w-full flex items-center justify-between px-10 py-5 border-b border-neutral-900">
        <div className="flex items-center gap-5">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back
          </Link>
          <div className="h-5 w-px bg-neutral-800" />
          <Link href="/dashboard" className="flex items-center">
            <Image src="/logo-dark.png" alt="Trading Edge Logo" width={160} height={52} className="h-10 w-auto object-contain invert" priority />
          </Link>
        </div>
        {/* Avatar in navbar */}
        <div className="w-10 h-10 rounded-full border border-neutral-700 flex items-center justify-center text-sm font-semibold uppercase bg-neutral-900 tracking-wider overflow-hidden">
          {profileImage ? (
            <Image src={profileImage} alt="Profile" width={40} height={40} className="object-cover w-full h-full" unoptimized />
          ) : (
            initials
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-[1300px] mx-auto px-10 py-16 flex flex-col md:flex-row gap-20 md:gap-40">
        {/* Left Column */}
        <div className="w-full md:w-72 shrink-0">
          <h1 className="text-4xl font-medium tracking-tight mb-2">Welcome, {user.fname}.</h1>
          <p className="text-neutral-400 text-xl mb-14 tracking-tight">Manage your account.</p>

          <div className="flex flex-col gap-1">
            <TabButton active={activeTab === "account"} onClick={() => setActiveTab("account")} icon={<User className="w-5 h-5" />} label="Account" />
            {securityEnabled && (
              <>
                <TabButton active={activeTab === "security"} onClick={() => setActiveTab("security")} icon={<Shield className="w-5 h-5" />} label="Security" />
                <TabButton active={activeTab === "sessions"} onClick={() => setActiveTab("sessions")} icon={<Key className="w-5 h-5" />} label="Sessions" />
              </>
            )}
            <TabButton active={activeTab === "data"} onClick={() => setActiveTab("data")} icon={<Database className="w-5 h-5" />} label="Data" />
          </div>
        </div>

        {/* Right Column */}
        <div className="flex-1 max-w-[700px]">
          {activeTab === "account" && (
            <AccountTab
              user={user}
              createdDate={createdDate}
              initials={initials}
              profileImage={profileImage}
              onProfileImageChange={setProfileImage}
              onSubscriptionClick={handleSubscriptionClick}
            />
          )}
          {securityEnabled && activeTab === "security" && <SecurityTab />}
          {securityEnabled && activeTab === "sessions" && <SessionsTab securityEnabled={securityEnabled} />}
          {activeTab === "data" && <DataTab joinedDate={user.joined_date} autoDeactivationEnabled={autoDeactivationEnabled} />}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-3 py-2.5 px-1 text-base font-medium transition-colors cursor-pointer ${
        active ? "text-white" : "text-neutral-500 hover:text-neutral-300"
      }`}
    >
      {active && <div className="absolute -left-5 w-2 h-2 rounded-full bg-white" />}
      <div className={`${active ? "opacity-100" : "opacity-60"}`}>{icon}</div>
      {label}
    </button>
  );
}

function AccountTab({
  user, createdDate, initials, profileImage, onProfileImageChange, onSubscriptionClick,
}: {
  user: any; createdDate: string; initials: string;
  profileImage: string | null;
  onProfileImageChange: (url: string) => void;
  onSubscriptionClick: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploaded(false);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload/profile", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        onProfileImageChange(data.url);
        setUploaded(true);
        toast.success("Profile photo updated!");
        setTimeout(() => setUploaded(false), 2000);
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      // reset input so same file can be re-uploaded
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-2xl font-medium tracking-tight mb-1.5">Your account</h2>
          <p className="text-base text-neutral-400">Manage your account information.</p>
        </div>

        {/* Clickable Avatar with Camera overlay */}
        <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
          <div className="w-20 h-20 rounded-full border-2 border-neutral-700 bg-neutral-900 flex items-center justify-center font-bold tracking-widest text-lg overflow-hidden">
            {profileImage ? (
              <Image src={profileImage} alt="Profile" width={80} height={80} className="object-cover w-full h-full" unoptimized />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          {/* Camera overlay on hover */}
          <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : uploaded ? (
              <Check className="w-5 h-5 text-green-400" />
            ) : (
              <Camera className="w-5 h-5 text-white" />
            )}
          </div>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Account info card */}
      <div className="bg-[#0a0a0a] border border-neutral-800/60 rounded-3xl overflow-hidden mb-12">
        <div className="flex items-center justify-between px-7 py-5 border-b border-neutral-800/50">
          <div>
            <div className="text-sm text-neutral-500 mb-1">Full name</div>
            <div className="text-base font-medium">{user.fname} {user.lname}</div>
          </div>
          <Button variant="outline" className="rounded-full bg-transparent border-neutral-700 hover:bg-neutral-800 hover:text-white text-sm h-9 px-5 cursor-pointer" onClick={() => toast.info("Name update coming soon")}>
            Edit name
          </Button>
        </div>

        <div className="flex items-center justify-between px-7 py-5 border-b border-neutral-800/50">
          <div>
            <div className="text-sm text-neutral-500 mb-1">Email</div>
            <div className="text-base font-medium">{user.email}</div>
          </div>
          <Button variant="outline" className="rounded-full bg-transparent border-neutral-700 hover:bg-neutral-800 hover:text-white text-sm h-9 px-5 cursor-pointer" onClick={() => toast.info("Email update coming soon")}>
            Update email
          </Button>
        </div>

        <div className="flex items-center justify-between px-7 py-5 border-b border-neutral-800/50">
          <div>
            <div className="text-sm text-neutral-500 mb-1">Subscription</div>
            <div className="text-base font-medium">Manage your Trading Edge subscription</div>
          </div>
          <Button variant="outline" onClick={onSubscriptionClick} className="rounded-full bg-transparent border-neutral-700 hover:bg-neutral-800 hover:text-white text-sm h-9 px-5 flex items-center gap-2 cursor-pointer">
            Manage <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="px-7 py-5">
          <div className="text-sm text-neutral-500 mb-1">Account created</div>
          <div className="text-base font-medium">{createdDate}</div>
        </div>
      </div>

      {/* Sign-in methods */}
      <h2 className="text-2xl font-medium tracking-tight mb-1.5">Sign-in methods</h2>
      <p className="text-base text-neutral-400 mb-7">Manage your ways of logging into Trading Edge.</p>

      <div className="bg-[#0a0a0a] border border-neutral-800/60 rounded-3xl overflow-hidden">
        <div className="flex items-center justify-between px-7 py-5">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-full border border-neutral-700 flex items-center justify-center bg-neutral-900">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-medium">Email and password</div>
              <div className="text-sm text-neutral-500 mt-0.5">Enable login with email</div>
            </div>
          </div>
          <span className="cursor-not-allowed" title="You must have at least one sign-in method enabled">
            <Button variant="outline" disabled className="rounded-full bg-transparent border-neutral-700 text-sm h-9 px-6 pointer-events-none opacity-50">
              Disable
            </Button>
          </span>
        </div>
      </div>
    </div>
  );
}

function SecurityTab() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <h2 className="text-2xl font-medium tracking-tight mb-10">Account security</h2>
      <div className="space-y-8">
        <div className="flex items-center justify-between border-b border-neutral-800/50 pb-8">
          <div>
            <div className="text-base font-medium mb-1">Login with password</div>
            <div className="text-sm text-neutral-500">Manage the password for your account.</div>
          </div>
          <Button variant="outline" className="rounded-full bg-transparent border-neutral-700 hover:bg-neutral-800 hover:text-white text-sm h-9 px-5 cursor-pointer" onClick={() => toast.info("Password change feature coming soon")}>
            Change password
          </Button>
        </div>
        <div className="flex items-center justify-between border-b border-neutral-800/50 pb-8">
          <div>
            <div className="text-base font-medium mb-1">Multi-factor authentication</div>
            <div className="text-sm text-neutral-500">Secure your account with a second factor of authentication.</div>
          </div>
          <Button variant="outline" className="rounded-full bg-transparent border-neutral-700 hover:bg-neutral-800 hover:text-white text-sm h-9 px-5 cursor-pointer" onClick={() => toast.info("MFA setup coming soon")}>
            Enable MFA
          </Button>
        </div>
        <div>
          <div className="text-base font-medium mb-2">Recovery codes</div>
          <div className="text-sm text-neutral-500 max-w-md leading-relaxed">
            You need to have at least one multi-factor method enabled to generate recovery codes.
          </div>
        </div>
      </div>
    </div>
  );
}

interface LocationData {
  city: string;
  region: string;
  country_name: string;
  country_code: string;
  timezone: string;
  ip: string;
  latitude: number;
  longitude: number;
}

function SessionsTab({ securityEnabled = true }: { securityEnabled?: boolean }) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://ipwho.is/")
      .then((res) => res.json())
      .then((data: any) => {
        if (data.success) {
          setLocation({
            city: data.city,
            region: data.region,
            country_name: data.country,
            country_code: data.country_code,
            timezone: data.timezone?.id || "Unknown",
            ip: data.ip,
            latitude: data.latitude,
            longitude: data.longitude,
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // OSM via Leaflet — works everywhere
  const hasLocation = !loading && location !== null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <h2 className="text-2xl font-medium tracking-tight mb-6">Your sessions</h2>
      <div className="border-t border-neutral-800 mb-8" />

      {securityEnabled && (
        <div className="mb-2">
          <div className="text-base font-semibold mb-6">Current session location</div>

        {loading ? (
          <div className="flex items-center gap-3 text-neutral-500 py-8">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Detecting location...</span>
          </div>
        ) : location ? (
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-full md:w-72 h-44 rounded-xl overflow-hidden shrink-0 border border-neutral-800 bg-neutral-900">
              {!loading && location && typeof location.latitude === "number" && typeof location.longitude === "number" ? (
                <LeafletMap latitude={location.latitude} longitude={location.longitude} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-600">
                  <MapPin className="w-8 h-8" />
                </div>
              )}
            </div>
            <div className="flex-1 w-full">
              {[
                { label: "City", value: location.city || "Unknown" },
                { label: "Region", value: location.region || "Unknown" },
                { label: "Country", value: location.country_name || "Unknown" },
                { label: "Timezone", value: location.timezone || "Unknown" },
                { label: "IP Address", value: location.ip || "Unknown" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-neutral-500">{label}</span>
                  <span className="text-sm font-semibold font-mono">{value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-sm text-neutral-500 py-4">Could not detect session location.</div>
        )}
      </div>
      )}

      <div className="border-t border-neutral-800 my-8" />
      <div>
        <div className="text-base font-semibold mb-3">Active sessions</div>
        <p className="text-sm text-amber-500">No other active sessions found.</p>
      </div>
    </div>
  );
}

function DataTab({ joinedDate, autoDeactivationEnabled = true }: { joinedDate: Date, autoDeactivationEnabled?: boolean }) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const expiryDate = new Date(joinedDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    const tick = () => {
      const distance = expiryDate.getTime() - Date.now();
      if (distance < 0) {
        setIsExpired(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [joinedDate]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-10">
        <h2 className="text-2xl font-medium tracking-tight mb-1.5">Your data</h2>
        <p className="text-base text-neutral-400">Manage your personal data.</p>
      </div>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between border-b border-neutral-800/50 pb-8 gap-5">
          <div>
            <div className="text-base font-medium mb-1">Download account data</div>
            <div className="text-sm text-neutral-500 leading-relaxed max-w-sm">
              You can download all data associated with your account. This includes everything stored across all Trading Edge products.
            </div>
          </div>
          <Button variant="outline" className="rounded-full bg-transparent border-neutral-700 hover:bg-neutral-800 hover:text-white text-sm h-9 px-5 shrink-0 cursor-pointer">
            Download
          </Button>
        </div>
        {autoDeactivationEnabled && (
          <div className="flex flex-col gap-5">
            <div>
              <div className="text-base font-medium mb-1 text-rose-400">Account deactivated in</div>
              <div className="text-sm text-neutral-500 leading-relaxed max-w-sm">
                Your account automatically deactivates exactly 1 year after registration. You will lose access to all course materials after this date.
              </div>
            </div>
            {isExpired ? (
              <div className="inline-flex items-center gap-2 text-rose-500 font-bold border border-rose-500/30 bg-rose-500/10 px-5 py-3 rounded-xl text-sm w-fit">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                Account Deactivated
              </div>
            ) : (
              <div className="flex gap-3">
                <TimeUnit value={timeLeft.days} label="Days" />
                <TimeUnit value={timeLeft.hours} label="Hours" />
                <TimeUnit value={timeLeft.minutes} label="Mins" />
                <TimeUnit value={timeLeft.seconds} label="Secs" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center w-16 h-20 bg-neutral-900 border border-neutral-800 rounded-xl">
      <span className="text-2xl font-bold font-mono leading-none">{value.toString().padStart(2, "0")}</span>
      <span className="text-[11px] text-neutral-500 mt-1.5 uppercase font-semibold tracking-wider">{label}</span>
    </div>
  );
}
