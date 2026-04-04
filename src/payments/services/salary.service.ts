// src/payments/services/salary.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { BusinessMember } from '../../businesses/entities/business-member.entity';
import { EmailService } from '../../email/email.service';
import { SalaryProposal, SalaryProposalStatus } from '../entities/salary-proposal.entity';

export interface SalaryProposalInput {
  userId: string;
  amount: number;
  currency: string;
  message?: string;
}

export interface RespondToProposalInput {
  action: 'ACCEPT' | 'REJECT' | 'COUNTER';
  counterAmount?: number;
  note?: string;
}

@Injectable()
export class SalaryService {
  constructor(
    @InjectRepository(BusinessMember)
    private businessMemberRepository: Repository<BusinessMember>,

    @InjectRepository(SalaryProposal)
    private salaryProposalRepository: Repository<SalaryProposal>,

    private emailService: EmailService,
  ) {}

  // ─── Get all active members of a business ──────────────────────────────────
  async getBusinessMembers(businessId: string): Promise<BusinessMember[]> {
    return this.businessMemberRepository.find({
      where: { business_id: businessId, is_active: true },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  // ─── Get latest proposal status for each member ────────────────────────────
  async getProposalStatuses(
    businessId: string,
  ): Promise<Record<string, SalaryProposal>> {
    const proposals = await this.salaryProposalRepository.find({
      where: { business_id: businessId },
      order: { created_at: 'DESC' },
    });

    // Keep only the most recent proposal per user
    const map: Record<string, SalaryProposal> = {};
    for (const p of proposals) {
      if (!map[p.user_id]) map[p.user_id] = p;
    }
    return map;
  }

  // ─── Send a salary proposal email with a unique token link ─────────────────
  async sendSalaryProposal(
    businessId: string,
    proposal: SalaryProposalInput,
    senderName: string,
    senderEmail: string,
    businessName: string,
  ): Promise<{ success: boolean; message: string }> {
    const member = await this.businessMemberRepository.findOne({
      where: {
        business_id: businessId,
        user_id: proposal.userId,
        is_active: true,
      },
      relations: ['user'],
    });

    if (!member) {
      throw new NotFoundException(
        `Member with userId=${proposal.userId} not found in business=${businessId}`,
      );
    }

    const recipientEmail = member.user.email;
    const recipientName =
      `${member.user.firstName ?? ''} ${member.user.lastName ?? ''}`.trim() ||
      recipientEmail;

    // Generate a secure unique token
    const token = randomBytes(32).toString('hex');

    // Save proposal to DB
    const saved = this.salaryProposalRepository.create({
      business_id: businessId,
      user_id: proposal.userId,
      recipient_email: recipientEmail,
      recipient_name: recipientName,
      sender_name: senderName,
      sender_email: senderEmail,
      business_name: businessName,
      proposed_amount: proposal.amount,
      currency: proposal.currency || 'TND',
      message: proposal.message ?? null,
      status: SalaryProposalStatus.PENDING,
      token,
    });
    await this.salaryProposalRepository.save(saved);

    const formattedAmount = new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: proposal.currency || 'TND',
    }).format(proposal.amount);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const respondUrl = `${frontendUrl}/salary-respond/${token}`;

    await this.emailService['transporter'].sendMail({
      from: `"BizManage" <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject: `Salary Proposal from ${businessName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Segoe UI', sans-serif; background: #f4f6fb; margin: 0; padding: 0; }
            .container { max-width: 580px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
            .header { background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 36px 40px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 22px; font-weight: 600; }
            .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px; }
            .body { padding: 36px 40px; }
            .amount-box { background: #f0f7ff; border: 2px solid #2563eb; border-radius: 10px; padding: 24px; text-align: center; margin: 24px 0; }
            .amount-box .label { font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
            .amount-box .amount { font-size: 36px; font-weight: 700; color: #1e3a5f; margin-top: 6px; }
            .message-box { background: #f8fafc; border-left: 4px solid #2563eb; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 20px 0; color: #475569; font-size: 14px; line-height: 1.6; }
            .btn-row { display: flex; gap: 12px; margin-top: 28px; }
            .btn { flex: 1; padding: 14px 0; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block; text-align: center; }
            .btn-primary { background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); color: white; }
            .footer { background: #f8fafc; padding: 20px 40px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💼 Salary Proposal</h1>
              <p>From ${businessName}</p>
            </div>
            <div class="body">
              <p style="color:#1e293b;font-size:16px;">Dear ${recipientName},</p>
              <p style="color:#475569;font-size:15px;line-height:1.6;">
                <strong>${senderName}</strong> from <strong>${businessName}</strong> has sent you a salary proposal.
              </p>
              <div class="amount-box">
                <div class="label">Proposed Monthly Salary</div>
                <div class="amount">${formattedAmount}</div>
              </div>
              ${proposal.message ? `<div class="message-box"><strong>Message:</strong><br/>${proposal.message}</div>` : ''}
              <p style="color:#64748b;font-size:14px;">Please review this proposal and respond using the button below.</p>
              <div style="text-align:center;margin-top:28px;">
                <a href="${respondUrl}" class="btn btn-primary">
                  Review &amp; Respond →
                </a>
              </div>
            </div>
            <div class="footer">
              This email was sent by ${businessName} via BizManage.
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return { success: true, message: `Salary proposal sent to ${recipientEmail}` };
  }

  // ─── Load a proposal by token (public, no auth) ────────────────────────────
  async getProposalByToken(token: string): Promise<SalaryProposal> {
    const proposal = await this.salaryProposalRepository.findOne({
      where: { token },
    });
    if (!proposal) throw new NotFoundException('Proposal not found or link is invalid.');
    return proposal;
  }

  // ─── Member responds to a proposal ────────────────────────────────────────
  async respondToProposal(
    token: string,
    response: RespondToProposalInput,
  ): Promise<{ success: boolean; message: string }> {
    const proposal = await this.salaryProposalRepository.findOne({
      where: { token },
    });
    if (!proposal) throw new NotFoundException('Proposal not found.');

    if (proposal.status !== SalaryProposalStatus.PENDING) {
      throw new BadRequestException('This proposal has already been responded to.');
    }

    if (response.action === 'COUNTER') {
      if (!response.counterAmount || response.counterAmount <= 0) {
        throw new BadRequestException('Counter amount must be a positive number.');
      }
      proposal.status = SalaryProposalStatus.COUNTERED;
      proposal.counter_amount = response.counterAmount;
    } else if (response.action === 'ACCEPT') {
      proposal.status = SalaryProposalStatus.ACCEPTED;
    } else {
      proposal.status = SalaryProposalStatus.REJECTED;
    }

    proposal.response_note = response.note ?? null;
    proposal.responded_at = new Date();
    await this.salaryProposalRepository.save(proposal);

    // Email the manager
    await this._notifyManager(proposal, response);

    return { success: true, message: 'Response submitted successfully.' };
  }

  // ─── Send notification email to manager ───────────────────────────────────
  private async _notifyManager(
    proposal: SalaryProposal,
    response: RespondToProposalInput,
  ) {
    const statusLabels: Record<string, { label: string; color: string; icon: string }> = {
      ACCEPT:  { label: 'Accepted',        color: '#16a34a', icon: '✅' },
      REJECT:  { label: 'Rejected',        color: '#dc2626', icon: '❌' },
      COUNTER: { label: 'Counter-Offered', color: '#d97706', icon: '🔄' },
    };
    const { label, color, icon } = statusLabels[response.action];

    const formattedProposed = new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: proposal.currency,
    }).format(Number(proposal.proposed_amount));

    const formattedCounter = response.counterAmount
      ? new Intl.NumberFormat('fr-TN', {
          style: 'currency',
          currency: proposal.currency,
        }).format(response.counterAmount)
      : null;

    // ── Use the sender_email stored at proposal creation time ────────────────
    const managerEmail = proposal.sender_email;
    if (!managerEmail) return;

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    await this.emailService['transporter'].sendMail({
      from: `"BizManage" <${process.env.SMTP_USER}>`,
      to: managerEmail,
      subject: `${icon} ${proposal.recipient_name} ${label} the Salary Proposal`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Segoe UI', sans-serif; background: #f4f6fb; margin: 0; padding: 0; }
            .container { max-width: 580px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
            .header { background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 32px 40px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 20px; font-weight: 600; }
            .body { padding: 32px 40px; }
            .status-badge { display: inline-block; background: ${color}18; color: ${color}; border: 1px solid ${color}40; border-radius: 20px; padding: 6px 18px; font-weight: 700; font-size: 15px; margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
            .row .lbl { color: #64748b; }
            .row .val { font-weight: 600; color: #1e293b; }
            .note-box { background: #f8fafc; border-left: 4px solid #94a3b8; padding: 14px 18px; border-radius: 0 8px 8px 0; margin: 16px 0; color: #475569; font-size: 14px; }
            .footer { background: #f8fafc; padding: 18px 40px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${icon} Salary Proposal Response</h1>
            </div>
            <div class="body">
              <p style="color:#1e293b;font-size:15px;margin-bottom:16px;">
                <strong>${proposal.recipient_name}</strong> has responded to your salary proposal.
              </p>
              <div><span class="status-badge">${icon} ${label}</span></div>
              <div class="row"><span class="lbl">Employee</span><span class="val">${proposal.recipient_name}</span></div>
              <div class="row"><span class="lbl">Proposed Salary</span><span class="val">${formattedProposed}</span></div>
              ${formattedCounter ? `<div class="row"><span class="lbl">Counter Offer</span><span class="val" style="color:${color}">${formattedCounter}</span></div>` : ''}
              ${response.note ? `<div class="note-box"><strong>Note from employee:</strong><br/>${response.note}</div>` : ''}
              <div style="text-align:center;margin-top:24px;">
                <a href="${frontendUrl}/app/treasury/salaries"
                   style="background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%);color:white;padding:13px 30px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block;">
                  View in Dashboard →
                </a>
              </div>
            </div>
            <div class="footer">BizManage · Salary Management</div>
          </div>
        </body>
        </html>
      `,
    });
  }
}
