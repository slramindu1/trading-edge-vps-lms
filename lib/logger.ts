import { prisma } from "@/lib/prisma";
import { ErrorCategory } from "../lib/generated/prisma";
import { headers } from "next/headers";

interface LogErrorParams {
  message: string;
  stack?: string;
  category?: ErrorCategory;
  url?: string;
  method?: string;
  userAgent?: string;
  ipAddress?: string;
  userId?: string;
}

export async function logSystemError(params: LogErrorParams) {
  try {
    let finalUrl = params.url;
    let finalMethod = params.method;
    let finalUserAgent = params.userAgent;
    let finalIpAddress = params.ipAddress;

    // Try to extract context from headers if not provided
    try {
      const headersList = await headers();
      if (!finalUserAgent) finalUserAgent = headersList.get("user-agent") || undefined;
      if (!finalIpAddress) {
        finalIpAddress = headersList.get("x-forwarded-for")?.split(',')[0] || 
                         headersList.get("x-real-ip") || 
                         undefined;
      }
      if (!finalUrl) finalUrl = headersList.get("referer") || headersList.get("x-invoke-path") || undefined;
    } catch (e) {
      // Ignore if headers() can't be called (e.g. outside request context)
    }

    await prisma.systemError.create({
      data: {
        message: params.message.substring(0, 1000),
        stack: params.stack,
        category: params.category || ErrorCategory.SYSTEM,
        url: finalUrl,
        method: finalMethod,
        userAgent: finalUserAgent,
        ipAddress: finalIpAddress,
        userId: params.userId,
      },
    });
  } catch (error) {
    console.error("Failed to log system error to DB:", error);
  }
}
