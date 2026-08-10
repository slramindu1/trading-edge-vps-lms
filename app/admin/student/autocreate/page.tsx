"use client";

import React, { useTransition, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, PlusIcon } from "lucide-react";
import { buttonVariants, Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { StudentSchema, StudentSchemaType } from "@/lib/zodSchemas";
import { AddStudent } from "./actions";
import { toast } from "sonner";

// Define the form values type (matches StudentSchemaType)
interface FormValues {
  fname: string;
  lname: string;
  email: string;
  student_type: "FREE" | "PAID";
  user_type_id?: number;
  status_id?: number;
}

export default function StudentAddPage() {
  const [Pending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get URL parameters for auto-fill
  const emailParam = searchParams.get("email");
  const fullNameParam = searchParams.get("fullName");
  const paymentId = searchParams.get("paymentId");
  const fromPayment = searchParams.get("fromPayment") === "true";

  const form = useForm<FormValues>({
    resolver: zodResolver(StudentSchema),
    defaultValues: {
      fname: "",
      lname: "",
      email: "",
      student_type: fromPayment ? "PAID" : "FREE",
      user_type_id: 2, // Default value for student
      status_id: 1,    // Default value for active status
    },
  });

  // Auto-fill form when page loads with URL parameters
  useEffect(() => {
    if (emailParam || fullNameParam) {
      // Split full name into first and last names
      if (fullNameParam) {
        const nameParts = fullNameParam.trim().split(/\s+/);
        if (nameParts.length > 0) {
          form.setValue("fname", nameParts[0]);
          if (nameParts.length > 1) {
            form.setValue("lname", nameParts.slice(1).join(" "));
          } else {
            // If only one name provided
            form.setValue("lname", nameParts[0]);
          }
        }
      }

      if (emailParam) {
        form.setValue("email", emailParam);
      }

      // If coming from payment, show success message
      if (fromPayment) {
        toast.success("Payment approved! Student details auto-filled.");
      }
    }
  }, [emailParam, fullNameParam, fromPayment, form]);

  const onSubmit: SubmitHandler<FormValues> = (values) => {
    // Prepare data matching StudentSchemaType
    const data: StudentSchemaType = {
      fname: values.fname,
      lname: values.lname,
      email: values.email,
      student_type: values.student_type,
      user_type_id: values.user_type_id,
      status_id: values.status_id,
    };

    startTransition(async () => {
      const result = await AddStudent(data);

      if (result.status === "success") {
        toast.success(result.message);
        
        // If there was a paymentId, mark payment as completed
        if (paymentId) {
          try {
            await fetch(`/api/payments/complete`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                paymentId, 
                studentEmail: values.email,
                studentName: `${values.fname} ${values.lname}`
              }),
            });
          } catch (error) {
            console.error("Error updating payment:", error);
          }
        }
        
        form.reset();
        router.push("/admin/student");
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/student"
          className={buttonVariants({ variant: "outline", size: "icon" })}
        >
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="text-2xl font-bold">
          {fromPayment ? "Create Student from Payment" : "Add New Student"}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
          <CardDescription>
            {fromPayment 
              ? "Student details auto-filled from payment. Review and submit."
              : "Fill basic info to add student"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter First Name" 
                          {...field} 
                          readOnly={!!fullNameParam}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter Last Name" 
                          {...field} 
                          readOnly={!!fullNameParam}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="Enter Email Address" 
                        {...field} 
                        readOnly={!!emailParam}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="student_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={fromPayment}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FREE">FREE</SelectItem>
                        <SelectItem value="PAID">PAID</SelectItem>
                      </SelectContent>
                    </Select>
                    {fromPayment && (
                      <p className="text-sm text-green-600 mt-1">
                        Auto-set to PAID for payment students
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Hidden fields for user_type_id and status_id */}
              <input type="hidden" {...form.register("user_type_id")} />
              <input type="hidden" {...form.register("status_id")} />

              <Button type="submit" disabled={Pending}>
                {Pending ? (
                  <>
                    Adding...
                    <Loader2 className="animate-spin ml-1" />
                  </>
                ) : (
                  <>
                    {fromPayment ? "Create Student Account" : "Add Student"} 
                    <PlusIcon className="ml-1" size={16} />
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}