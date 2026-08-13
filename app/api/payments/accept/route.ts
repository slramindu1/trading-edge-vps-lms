import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/getSession";

export async function GET(request: NextRequest) {
  try {
    // ── Bug #2 Fix: Require admin session ──────────────────────────────────
    const session = await getSession();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

    if (!session || session.user.user_type_id !== 1) {
      // Not logged in as admin — redirect to login, then back to this URL
      const returnUrl = encodeURIComponent(request.url);
      return NextResponse.redirect(`${baseUrl}/sign-in?redirect=${returnUrl}`);
    }

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

    // ── Bug #5 Fix: Check if payment already fully processed ───────────────
    if (payment.status === "COMPLETED") {
      return NextResponse.redirect(
        `${baseUrl}/admin/student?info=payment_already_completed`
      );
    }

    // Update payment status to APPROVED (safe to run again if already APPROVED)
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: "APPROVED" },
    });

    console.log("✅ Payment approved:", paymentId);

    // Redirect to autocreate page
    const redirectUrl = `${baseUrl}/admin/student/autocreate?email=${encodeURIComponent(email)}&fullName=${encodeURIComponent(fullName)}&paymentId=${paymentId}&fromPayment=true`;
    return NextResponse.redirect(redirectUrl);

  } catch (err) {
    console.error("❌ Accept payment error:", err);
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
