"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AlertCircle, Eye, EyeOff, Mail, ShieldAlert, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

type Step = "CREDENTIALS" | "VERIFICATION";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");
  const reason = searchParams.get("reason");
  const sessionExpired = reason === "session_expired";

  const [step, setStep] = useState<Step>("CREDENTIALS");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const redirectAfterLogin = (userTypeId: number) => {
    if (redirectUrl) {
      window.location.href = redirectUrl;
    } else if (userTypeId === 1) {
      window.location.href = "/admin";
    } else if (userTypeId === 2) {
      window.location.href = "/dashboard";
    } else {
      window.location.href = "/not-user";
    }
  };

  const handleLogin = async () => {
    setErrors({});
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = "Please enter the email address";
    else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) newErrors.email = "Invalid email address";
    }
    if (!password) newErrors.password = "Please enter the password";
    else if (password.length < 6) newErrors.password = "Password must be at least 6 characters";

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setIsLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        if (data.requireVerification) {
          setPendingEmail(data.email);
          setStep("VERIFICATION");
          toast.info("A verification code has been sent to your email.");
        } else {
          toast.success("Login Successful!");
          setTimeout(() => redirectAfterLogin(data.user?.user_type_id), 500);
        }
      } else {
        if (data.error === "Account is blocked. Please contact support.") {
          toast.error("Your account has been blocked. Please contact support.", { duration: 5000, icon: <AlertCircle className="h-4 w-4" /> });
        } else if (data.error === "Account is pending approval. Please wait for admin approval.") {
          toast.warning("Your account is pending approval. Please wait for admin approval.", { duration: 5000, icon: <AlertCircle className="h-4 w-4" /> });
        } else {
          toast.error(data.error || "Login Failed");
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Server error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) { toast.error("Please enter the full 6-digit code."); return; }
    setIsLoading(true);
    try {
      const res = await fetch("/api/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail, otp }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("Device verified! Signing you in...");
        setTimeout(() => redirectAfterLogin(data.user?.user_type_id), 600);
      } else {
        toast.error(data.error || "Verification failed.");
        if (data.error?.includes("expired")) { setStep("CREDENTIALS"); setOtp(""); }
      }
    } catch (err) {
      console.error("Verification error:", err);
      toast.error("Server error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      if (step === "CREDENTIALS") handleLogin();
      else handleVerifyOTP();
    }
  };

  if (step === "VERIFICATION") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Verify New Device</CardTitle>
              <CardDescription>Check your email for a 6-digit code</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
            <Mail className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-primary">Code sent to:</p>
              <p className="text-sm text-muted-foreground mt-0.5">{pendingEmail}</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <Label className="self-start">Enter Verification Code</Label>
            <InputOTP maxLength={6} value={otp} onChange={setOtp} onKeyDown={handleKeyPress} disabled={isLoading}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <p className="text-xs text-muted-foreground">Code expires in 10 minutes</p>
          </div>

          <Button onClick={handleVerifyOTP} disabled={isLoading || otp.length !== 6} className="w-full">
            {isLoading ? (
              <><div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />Verifying...</>
            ) : "Verify and Sign In"}
          </Button>

          <button type="button" onClick={() => { setStep("CREDENTIALS"); setOtp(""); }} className="text-sm text-muted-foreground hover:text-foreground text-center transition-colors">
            Back to Login
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      {sessionExpired && (
        <div className="mx-6 mt-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <ShieldAlert className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-400">Session Signed Out</p>
            <p className="text-xs text-amber-400/80 mt-0.5">Your account was signed in from another device. Only one active session is allowed.</p>
          </div>
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-xl">Welcome back!</CardTitle>
        <CardDescription>Login with your email account</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyPress={handleKeyPress} placeholder="m@example.com" disabled={isLoading} className={errors.email ? "border-destructive focus:border-destructive focus:ring-destructive" : ""} />
          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
        </div>

        <div className="flex flex-col gap-2 relative">
          <Label>Password</Label>
          <div className="relative">
            <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} onKeyPress={handleKeyPress} placeholder="******" disabled={isLoading} className={errors.password ? "border-destructive focus:border-destructive focus:ring-destructive pr-10" : "pr-10"} />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(!showPassword)} disabled={isLoading}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
        </div>

        <div className="flex justify-end">
          <a href="/forgot-password" className="text-sm text-primary hover:underline">Forgot Password?</a>
        </div>

        <Button onClick={handleLogin} disabled={isLoading} className="hover:cursor-pointer w-full">
          {isLoading ? (
            <><div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />Signing in...</>
          ) : "Sign In"}
        </Button>
      </CardContent>
    </Card>
  );
}
