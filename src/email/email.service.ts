// src/email/email.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    // Create the email transporter using Gmail
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('GMAIL_USER'),
        pass: this.configService.get<string>('GMAIL_PASS'),
      },
    });
  }

  // ─── Send Email Verification ─────────────────────────────────────────────
  async sendVerificationEmail(to: string, token: string, userName: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const verificationLink = `${frontendUrl}/verify-email?token=${token}`;

    const mailOptions = {
      from: `"SaaS Platform" <${this.configService.get<string>('GMAIL_USER')}>`,
      to,
      subject: 'Verify Your Email Address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to SaaS Platform, ${userName}!</h2>
          <p>Thanks for signing up. Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}"
               style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Or copy and paste this link into your browser:<br>
            <a href="${verificationLink}">${verificationLink}</a>
          </p>
          <p style="color: #666; font-size: 14px;">
            This link will expire in 24 hours.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${to}`);
  }

  // ─── Send Password Reset Email ───────────────────────────────────────────
  async sendPasswordResetEmail(to: string, token: string, userName: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    const mailOptions = {
      from: `"SaaS Platform" <${this.configService.get<string>('GMAIL_USER')}>`,
      to,
      subject: 'Reset Your Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hi ${userName},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}"
               style="background-color: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Or copy and paste this link into your browser:<br>
            <a href="${resetLink}">${resetLink}</a>
          </p>
          <p style="color: #666; font-size: 14px;">
            This link will expire in 1 hour.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            If you didn't request a password reset, you can safely ignore this email. Your password won't be changed.
          </p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${to}`);
  }

  // ─── Send Welcome Email (after verification) ────────────────────────────
  async sendWelcomeEmail(to: string, userName: string): Promise<void> {
    const mailOptions = {
      from: `"SaaS Platform" <${this.configService.get<string>('GMAIL_USER')}>`,
      to,
      subject: 'Welcome to SaaS Platform!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome aboard, ${userName}! 🎉</h2>
          <p>Your email has been verified successfully. You're all set to start using SaaS Platform.</p>
          <p>Here's what you can do next:</p>
          <ul style="line-height: 1.8;">
            <li>Set up your business profile</li>
            <li>Create your first invoice</li>
            <li>Invite team members</li>
            <li>Track expenses</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.configService.get<string>('FRONTEND_URL')}/dashboard"
               style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            If you have any questions, feel free to reach out to our support team.
          </p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${to}`);
  }

  // ─── Send Payment Schedule Approval Email ───────────────────────────────
  async sendPaymentScheduleApprovalEmail(
    to: string,
    supplierName: string,
    invoiceNumber: string,
    totalAmount: number,
    installments: { installment_number: number; due_date: Date; amount: number }[],
    acceptUrl: string,
    rejectUrl: string,
  ): Promise<void> {
    const installmentRows = installments
      .map(
        (i) => `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#374151">
              Échéance #${i.installment_number}
            </td>
            <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#374151">
              ${new Date(i.due_date).toLocaleDateString('fr-TN')}
            </td>
            <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;
                       font-weight:600;color:#111827">
              ${Number(i.amount).toFixed(3)} TND
            </td>
          </tr>`,
      )
      .join('');

    const mailOptions = {
      from: `"SaaS Platform" <${this.configService.get<string>('GMAIL_USER')}>`,
      to,
      subject: `Proposition de paiement échelonné — Facture ${invoiceNumber}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;
                    margin:0 auto;color:#1f2937">

          <!-- Header -->
          <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);
                      padding:32px;border-radius:16px 16px 0 0">
            <h1 style="color:#fff;margin:0;font-size:22px">
              Proposition de paiement échelonné
            </h1>
            <p style="color:#c7d2fe;margin:8px 0 0;font-size:14px">
              Facture ${invoiceNumber}
            </p>
          </div>

          <!-- Body -->
          <div style="background:#fff;padding:32px;
                      border:1px solid #e5e7eb;border-top:none;
                      border-radius:0 0 16px 16px">

            <p style="margin-top:0">
              Bonjour <strong>${supplierName}</strong>,
            </p>
            <p>
              Notre équipe vous propose un plan de paiement échelonné
              pour la facture <strong>${invoiceNumber}</strong>
              d'un montant total de
              <strong>${Number(totalAmount).toFixed(3)} TND</strong>.
            </p>

            <!-- Installments table -->
            <table style="width:100%;border-collapse:collapse;
                          margin:20px 0;border-radius:8px;
                          overflow:hidden;font-size:14px">
              <thead>
                <tr style="background:#4f46e5;color:#fff">
                  <th style="padding:10px 12px;text-align:left;
                             font-weight:600">
                    Échéance
                  </th>
                  <th style="padding:10px 12px;text-align:left;
                             font-weight:600">
                    Date
                  </th>
                  <th style="padding:10px 12px;text-align:left;
                             font-weight:600">
                    Montant
                  </th>
                </tr>
              </thead>
              <tbody style="background:#f9fafb">
                ${installmentRows}
              </tbody>
            </table>

            <p style="color:#6b7280;font-size:14px">
              Veuillez accepter ou refuser cette proposition
              en cliquant sur l'un des boutons ci-dessous.
            </p>

            <!-- CTA buttons — table layout for email client compatibility -->
            <table style="width:100%;margin-top:24px;
                          border-collapse:collapse">
              <tr>
                <td style="padding-right:8px">
                  <a href="${acceptUrl}"
                     style="display:block;text-align:center;
                            padding:14px 24px;background:#10b981;
                            color:#fff;text-decoration:none;
                            border-radius:10px;font-weight:600;
                            font-size:15px">
                    ✅ Accepter
                  </a>
                </td>
                <td style="padding-left:8px">
                  <a href="${rejectUrl}"
                     style="display:block;text-align:center;
                            padding:14px 24px;background:#ef4444;
                            color:#fff;text-decoration:none;
                            border-radius:10px;font-weight:600;
                            font-size:15px">
                    ❌ Refuser
                  </a>
                </td>
              </tr>
            </table>

            <p style="color:#9ca3af;font-size:12px;margin-top:24px">
              Ce lien est à usage unique et sécurisé.
              Si vous n'êtes pas concerné par ce message,
              ignorez cet email.
            </p>
          </div>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
    console.log(`Payment schedule approval email sent to ${to}`);
  }
}
