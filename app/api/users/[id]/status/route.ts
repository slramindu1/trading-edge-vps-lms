import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status_id } = body;

    console.log(`Updating user ${id} status to:`, status_id);

    if (!status_id || ![1, 2, 3].includes(status_id)) {
      return NextResponse.json(
        { error: "Invalid status_id. Must be 1 (active), 2 (inactive), or 3 (pending)" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (user.user_type_id === 1) {
      return NextResponse.json(
        { error: "Cannot modify admin users" },
        { status: 403 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status_id },
    });

    const statusText = status_id === 1 ? "active" : status_id === 2 ? "inactive" : "pending";
    
    return NextResponse.json({
      message: `User status updated to ${statusText} successfully`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fname: updatedUser.fname,
        lname: updatedUser.lname,
        status_id: updatedUser.status_id,
      }
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    return NextResponse.json(
      { 
        error: "Failed to update user status",
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';