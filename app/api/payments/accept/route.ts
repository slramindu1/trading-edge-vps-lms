import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma"; // Admin Prisma client

// Initialize Prisma client
const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get("paymentId");
    const email = searchParams.get("email");
    const fullName = searchParams.get("fullName");

    console.log("📧 Payment Accept Request:", { paymentId, email, fullName });

    if (!paymentId || !email || !fullName) {
      return NextResponse.json(
        { success: false, message: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Verify payment exists
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, message: "Payment not found" },
        { status: 404 }
      );
    }

    // Update payment status to APPROVED
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: "APPROVED" },
    });

    console.log("✅ Payment approved:", paymentId);

    // Create URL for autocreate page with query parameters
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    const redirectUrl = `${baseUrl}/admin/student/autocreate?email=${encodeURIComponent(email)}&fullName=${encodeURIComponent(fullName)}&paymentId=${paymentId}&fromPayment=true`;

    // Redirect to autocreate page
    return NextResponse.redirect(redirectUrl);
    
  } catch (err) {
    console.error("❌ Accept payment error:", err);
    
    // Fallback to error page or admin dashboard
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    return NextResponse.redirect(`${baseUrl}/admin/student?error=payment_accept_failed`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId } = body;

    if (!paymentId) {
      return NextResponse.json(
        { success: false, message: "Payment ID is required" },
        { status: 400 }
      );
    }

    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: "APPROVED" },
    });

    return NextResponse.json({
      success: true,
      message: "Payment approved successfully"
    });
  } catch (err) {
    console.error("Payment approval error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to approve payment" },
      { status: 500 }
    );
  }
}