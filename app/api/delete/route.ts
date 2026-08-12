import { NextResponse } from "next/server"
import path from "path"
import fs from "fs/promises"
import { getServerSession } from "@/lib/getServerSession";

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session || session.user.user_type_id !== 1) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json()
    const fileName = body.name

    if (!fileName || typeof fileName !== 'string' || fileName.includes('..') || fileName.includes('/')) {
      return NextResponse.json({ success: false, error: "Invalid file name" }, { status: 400 })
    }

    // Path to public/uploads
    const uploadDir = path.resolve(process.cwd(), "public", "uploads")
    const filePath = path.resolve(uploadDir, fileName)

    if (!filePath.startsWith(uploadDir)) {
      return NextResponse.json({ success: false, error: "Invalid file path" }, { status: 400 })
    }

    // Check if file exists before deleting
    try {
      await fs.access(filePath)
      await fs.unlink(filePath) // delete the file
      return NextResponse.json({ success: true, message: "File deleted successfully" })
    } catch {
      return NextResponse.json({ success: false, error: "File not found" }, { status: 404 })
    }
  } catch (err) {
    console.error("Delete error:", err)
    return NextResponse.json({ success: false, error: "Delete failed" }, { status: 500 })
  }
}
