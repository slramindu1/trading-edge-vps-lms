// app/complete-profile/CompleteProfileForm.tsx
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CompleteProfileFormProps {
  user: {
    id: string;
    email: string;
    fname: string;
    lname: string;
  };
}

export default function CompleteProfileForm({
  user,
}: CompleteProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    mobile: "",
    aboutMe: "",
    gender_id: "1",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, gender_id: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate mobile number (basic validation)
    if (!formData.mobile.trim()) {
      toast.error("Please enter your mobile number");
      return;
    }

    if (formData.mobile.trim().length < 10) {
      toast.error("Please enter a valid mobile number");
      return;
    }

    setIsLoading(true);

    try {
      // Note: Check your API path - you mentioned it's at /api/user/complete-profile
      // But in your form it's /api/users/complete-profile
      // Make sure this matches your actual API route
      const response = await fetch("/api/users/complete-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          mobile: formData.mobile.trim(),
          aboutMe: formData.aboutMe.trim(),
          gender_id: parseInt(formData.gender_id),
        }),
      });

      // Parse response
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("JSON parse error:", jsonError);
        toast.error("Server response error. Please try again.");
        setIsLoading(false);
        return;
      }

      if (response.ok && data.success) {
        toast.success("Profile completed successfully!");

        // Wait a moment before redirecting to show success message
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Get redirect URL from query params or go to dashboard
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTo = urlParams.get("redirect") || "/dashboard";

        // Force a hard navigation to ensure session cookies are updated
        window.location.href = redirectTo;
      } else {
        toast.error(data.message || data.error || "Failed to update profile");
      }
    } catch (error: unknown) {
      console.error("Profile update error:", error);

      if (
        error instanceof TypeError &&
        error.message.includes("Failed to fetch")
      ) {
        toast.error(
          "Network error. Please check your connection and try again."
        );
      } else {
        toast.error("An error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Check if form is valid (mobile is required)
  const isFormValid = formData.mobile.trim().length >= 10;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-2 border-primary/10">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <CheckCircle className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>
            Welcome, {user.fname}! Please complete your profile to continue.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                value={user.email}
                disabled
                className="bg-muted cursor-not-allowed"
              />
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fname">First Name</Label>
                <Input
                  id="fname"
                  value={user.fname}
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lname">Last Name</Label>
                <Input
                  id="lname"
                  value={user.lname}
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number *</Label>
              <Input
                id="mobile"
                name="mobile"
                type="tel"
                placeholder="07X XXX XXXX"
                value={formData.mobile}
                onChange={handleInputChange}
                required
                disabled={isLoading}
                className={isLoading ? "bg-muted" : ""}
              />
              <p className="text-xs text-muted-foreground">
                We&apos;ll use this for important notifications
              </p>
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label htmlFor="gender_id">Gender *</Label>
              <Select
                value={formData.gender_id}
                onValueChange={handleSelectChange}
                required
                disabled={isLoading}
              >
                <SelectTrigger className={isLoading ? "bg-muted" : ""}>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Male</SelectItem>
                  <SelectItem value="2">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* About Me */}
            <div className="space-y-2">
              <Label htmlFor="aboutMe">About Me</Label>
              <Textarea
                id="aboutMe"
                name="aboutMe"
                placeholder="Tell us a little about yourself, your interests, or your goals..."
                value={formData.aboutMe}
                onChange={handleInputChange}
                rows={3}
                maxLength={500}
                disabled={isLoading}
                className={isLoading ? "bg-muted resize-none" : "resize-none"}
              />
              <div className="flex justify-between">
                <p className="text-xs text-muted-foreground">
                  Optional - Share something about yourself
                </p>
                <p
                  className={`text-xs ${
                    formData.aboutMe.length >= 480
                      ? "text-amber-600"
                      : "text-muted-foreground"
                  }`}
                >
                  {formData.aboutMe.length}/500
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="">
              <Button
                type="submit"
                className="w-full h-12 text-base font-medium"
                disabled={isLoading || !isFormValid}
                variant={isLoading ? "secondary" : "default"}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Completing Profile...
                  </>
                ) : (
                  "Complete Profile"
                )}
              </Button>

              <div className="mt-4 space-y-2">
                <p className="text-xs text-muted-foreground text-center">
                  * Required fields must be filled to continue
                </p>
                {!isFormValid && formData.mobile.length > 0 && (
                  <p className="text-xs text-amber-600 text-center">
                    Please enter a valid mobile number (at least 10 digits)
                  </p>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
