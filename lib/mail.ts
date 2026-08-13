import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

const baseTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const mailTransporter = {
  async sendMail(options: any) {
    try {
      // Check if email security (email sending) is enabled globally
      const setting = await prisma.systemSetting.findUnique({
        where: { id: "global" }
      });
      
      // Default is true if setting doesn't exist
      const isEnabled = setting ? setting.emailSecurityEnabled : true;
      
      if (!isEnabled) {
        console.log(`[MAIL] Email security is decreased (emails disabled). Skipping email to: ${options.to}`);
        return { skipped: true, message: "Email sending is globally disabled" };
      }
      
      return await baseTransporter.sendMail(options);
    } catch (error) {
      console.error("[MAIL] Error in sendMail interceptor:", error);
      throw error;
    }
  }
};
