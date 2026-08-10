import { NextResponse } from "next/server"
import path from "path"
import fs from "fs/promises"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const fileName = body.name

    if (!fileName) {
      return NextResponse.json({ success: false, error: "File name is required" }, { status: 400 })
    }

    // Path to public/uploads
    const filePath = path.join(process.cwd(), "public", "uploads", fileName)

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
