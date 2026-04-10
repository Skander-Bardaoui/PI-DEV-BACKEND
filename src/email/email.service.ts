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
      from: `"NovEntra" <${this.configService.get<string>('GMAIL_USER')}>`,
      to,
      subject: 'Vérifiez votre adresse email - NovEntra',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; border-radius: 20px;">
          <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 32px; margin: 0;">NovEntra</h1>
            </div>
            <h2 style="color: #333; margin-bottom: 20px;">Bienvenue, ${userName}! 👋</h2>
            <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
              Merci de vous être inscrit sur NovEntra. Pour commencer à utiliser votre compte, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :
            </p>
            <div style="text-align: center; margin: 40px 0;">
              <a href="${verificationLink}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: bold; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                Vérifier mon email
              </a>
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Ou copiez et collez ce lien dans votre navigateur :<br>
              <a href="${verificationLink}" style="color: #667eea; word-break: break-all;">${verificationLink}</a>
            </p>
            <p style="color: #999; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              Ce lien expirera dans 24 heures. Si vous n'avez pas créé de compte, vous pouvez ignorer cet email en toute sécurité.
            </p>
          </div>
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
      from: `"NovEntra" <${this.configService.get<string>('GMAIL_USER')}>`,
      to,
      subject: 'Réinitialisation de votre mot de passe - NovEntra',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; border-radius: 20px;">
          <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 32px; margin: 0;">NovEntra</h1>
            </div>
            <h2 style="color: #333; margin-bottom: 20px;">Réinitialisation de mot de passe</h2>
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">Bonjour ${userName},</p>
            <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
              Nous avons reçu une demande de réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
            </p>
            <div style="text-align: center; margin: 40px 0;">
              <a href="${resetLink}" 
                 style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: bold; box-shadow: 0 4px 15px rgba(231, 76, 60, 0.4);">
                Réinitialiser mon mot de passe
              </a>
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Ou copiez et collez ce lien dans votre navigateur :<br>
              <a href="${resetLink}" style="color: #667eea; word-break: break-all;">${resetLink}</a>
            </p>
            <p style="color: #999; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              Ce lien expirera dans 1 heure. Si vous n'avez pas demandé de réinitialisation, vous pouvez ignorer cet email en toute sécurité. Votre mot de passe ne sera pas modifié.
            </p>
          </div>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${to}`);
  }

  // ─── Send Welcome Email (after verification) ────────────────────────────
  async sendWelcomeEmail(to: string, userName: string): Promise<void> {
    const mailOptions = {
      from: `"NovEntra" <${this.configService.get<string>('GMAIL_USER')}>`,
      to,
      subject: 'Bienvenue sur NovEntra ! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; border-radius: 20px;">
          <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 32px; margin: 0;">NovEntra</h1>
            </div>
            <h2 style="color: #333; margin-bottom: 20px;">Bienvenue, ${userName}! 🎉</h2>
            <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
              Votre email a été vérifié avec succès. Vous êtes maintenant prêt à utiliser NovEntra pour gérer votre entreprise.
            </p>
            <div style="background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border-radius: 12px; padding: 20px; margin: 30px 0;">
              <h3 style="color: #333; margin-top: 0;">Prochaines étapes :</h3>
              <ul style="color: #666; line-height: 2;">
                <li>✅ Configurez votre profil d'entreprise</li>
                <li>📄 Créez votre première facture</li>
                <li>👥 Invitez les membres de votre équipe</li>
                <li>💰 Suivez vos dépenses et revenus</li>
              </ul>
            </div>
            <div style="text-align: center; margin: 40px 0;">
              <a href="${this.configService.get<string>('FRONTEND_URL')}/app/dashboard" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: bold; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                Accéder au tableau de bord
              </a>
            </div>
            <p style="color: #999; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
              Si vous avez des questions, n'hésitez pas à contacter notre équipe de support.
            </p>
          </div>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${to}`);
  }
}