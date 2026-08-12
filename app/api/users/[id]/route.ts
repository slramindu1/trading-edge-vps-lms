import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { getServerSession } from "@/lib/getServerSession";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session || session.user.user_type_id !== 1) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    console.log("🔍 Deleting user with ID:", id);

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      console.log("❌ User not found:", id);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (user.user_type_id === 1) {
      console.log("🚫 Attempted to delete admin user:", id);
      return NextResponse.json(
        { error: "Cannot delete admin users" },
        { status: 403 }
      );
    }

    console.log("🗑️ Deleting user:", `${user.fname} ${user.lname}`, `(${user.email})`);

    // Check if auto-deactivation feature is enabled before allowing student deletion
    if (user.user_type_id === 2) {
      const autoDeactivationEnabled = await isFeatureEnabled("auto-deactivation");
      if (!autoDeactivationEnabled) {
        return NextResponse.json(
          { error: "Student deletion is disabled. Please enable the Automatic Student Deactivation feature to delete students." },
          { status: 403 }
        );
      }
    }

    await prisma.user.delete({
      where: { id },
    });

    console.log("✅ User deleted successfully:", id);
    
    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error deleting user:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    
    return NextResponse.json(
      { 
        error: "Failed to delete user",
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';