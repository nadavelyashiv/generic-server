import nodemailer, { Transporter } from 'nodemailer';
import { config } from '@/config/environment';
import { EmailData, EmailTemplateData } from '@/types/common.types';
import { ExternalServiceError } from '@/utils/errors';
import prisma from '@/config/database';
import logger from '@/utils/logger';

class EmailService {
  private transporter: Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    if (!config.email.smtp.host || !config.email.smtp.auth.user) {
      logger.warn('Email configuration not complete. Email service will be disabled.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: config.email.smtp.host,
      port: config.email.smtp.port || 587,
      secure: config.email.smtp.secure || false,
      auth: {
        user: config.email.smtp.auth.user,
        pass: config.email.smtp.auth.pass,
      },
    });

    // Verify connection
    this.transporter.verify((error) => {
      if (error) {
        logger.error('Email transporter verification failed:', error);
      } else {
        logger.info('✅ Email service configured successfully');
      }
    });
  }

  async sendEmail(emailData: EmailData): Promise<void> {
    if (!this.transporter) {
      logger.warn('Email service not configured. Skipping email send.');
      return;
    }

    try {
      const mailOptions = {
        from: {
          name: config.email.from.name,
          address: config.email.from.email,
        },
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info('Email sent successfully:', {
        to: emailData.to,
        subject: emailData.subject,
        messageId: result.messageId,
      });
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw new ExternalServiceError('Failed to send email', 'email');
    }
  }

  async sendEmailFromTemplate(
    templateName: string,
    to: string,
    templateData: EmailTemplateData
  ): Promise<void> {
    try {
      const template = await prisma.emailTemplate.findUnique({
        where: { name: templateName },
      });

      if (!template) {
        throw new Error(`Email template '${templateName}' not found`);
      }

      // Replace template variables
      const subject = this.replaceTemplateVariables(template.subject, templateData);
      const html = this.replaceTemplateVariables(template.htmlContent, templateData);
      const text = template.textContent
        ? this.replaceTemplateVariables(template.textContent, templateData)
        : undefined;

      await this.sendEmail({
        to,
        subject,
        html,
        text,
      });
    } catch (error) {
      logger.error('Failed to send template email:', error);
      throw error;
    }
  }

  private replaceTemplateVariables(template: string, data: EmailTemplateData): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key]?.toString() || match;
    });
  }

  async sendVerificationEmail(
    email: string,
    firstName: string,
    verificationToken: string
  ): Promise<void> {
    const verificationUrl = `${config.urls.client}/auth/verify-email?token=${verificationToken}`;

    await this.sendEmailFromTemplate('verification', email, {
      firstName,
      verificationUrl,
    });
  }

  async sendPasswordResetEmail(
    email: string,
    firstName: string,
    resetToken: string
  ): Promise<void> {
    const resetUrl = `${config.urls.client}/auth/reset-password?token=${resetToken}`;

    await this.sendEmailFromTemplate('password_reset', email, {
      firstName,
      resetUrl,
    });
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    await this.sendEmailFromTemplate('welcome', email, {
      firstName,
    });
  }

  async sendPasswordChangedNotification(email: string, firstName: string): Promise<void> {
    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #333;">Password Changed Successfully</h2>
        <p>Hi ${firstName},</p>
        <p>This is to confirm that your password has been changed successfully.</p>
        <p>If you didn't make this change, please contact our support team immediately.</p>
        <p>For your security:</p>
        <ul>
          <li>Never share your password with anyone</li>
          <li>Use a strong, unique password</li>
          <li>Enable two-factor authentication if available</li>
        </ul>
        <p>Best regards,<br>The Security Team</p>
      </div>
    `;

    const text = `
      Password Changed Successfully
      
      Hi ${firstName},
      
      This is to confirm that your password has been changed successfully.
      
      If you didn't make this change, please contact our support team immediately.
      
      Best regards,
      The Security Team
    `;

    await this.sendEmail({
      to: email,
      subject: 'Password Changed Successfully',
      html,
      text,
    });
  }

  async sendAccountLockedNotification(email: string, firstName: string): Promise<void> {
    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #dc3545;">Account Security Alert</h2>
        <p>Hi ${firstName},</p>
        <p>Your account has been temporarily locked due to multiple failed login attempts.</p>
        <p>If this was you, please try again later or reset your password.</p>
        <p>If this wasn't you, someone may be trying to access your account. Please:</p>
        <ul>
          <li>Change your password immediately</li>
          <li>Review your account for any suspicious activity</li>
          <li>Contact our support team if you need assistance</li>
        </ul>
        <p>Best regards,<br>The Security Team</p>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Account Security Alert - Account Locked',
      html,
    });
  }

  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      logger.error('Email service test failed:', error);
      return false;
    }
  }
}

export default new EmailService();