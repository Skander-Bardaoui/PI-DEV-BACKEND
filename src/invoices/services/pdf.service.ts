// src/invoices/services/pdf.service.ts
import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { Invoice } from '../entities/invoice.entity';

@Injectable()
export class PdfService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'invoices');

  constructor() {
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  // ─── Generate Invoice PDF ────────────────────────────────────────────────
  async generateInvoicePdf(invoice: Invoice): Promise<string> {
    const filename = `${invoice.invoice_number.replace(/\//g, '-')}.pdf`;
    const filepath = path.join(this.uploadDir, filename);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = fs.createWriteStream(filepath);

      doc.pipe(stream);

      // ─── Header Section ──────────────────────────────────────────────────
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('FACTURE / INVOICE', 50, 50);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Numéro: ${invoice.invoice_number}`, 50, 80)
        .text(`Date: ${new Date(invoice.date).toLocaleDateString('fr-TN')}`, 50, 95)
        .text(`Échéance: ${new Date(invoice.due_date).toLocaleDateString('fr-TN')}`, 50, 110);

      // Status badge
      const statusColors = {
        DRAFT: '#95a5a6',
        SENT: '#3498db',
        PAID: '#27ae60',
        OVERDUE: '#e74c3c',
        CANCELLED: '#7f8c8d',
      };

      doc
        .fontSize(12)
        .fillColor(statusColors[invoice.status] || '#000')
        .text(`Statut: ${invoice.status}`, 400, 80)
        .fillColor('#000');

      // ─── Business Info (Left) ────────────────────────────────────────────
      doc.fontSize(10).font('Helvetica-Bold').text('DE:', 50, 150);

      doc
        .fontSize(9)
        .font('Helvetica')
        .text(invoice.business?.name || 'N/A', 50, 165)
        .text(`Matricule Fiscal: ${invoice.business?.tax_id || 'N/A'}`, 50, 180);

      if (invoice.business?.address) {
        const addr = invoice.business.address as any;
        doc.text(`${addr.street || ''}`, 50, 195);
        doc.text(`${addr.city || ''} ${addr.postal_code || ''}`, 50, 210);
        doc.text(`${addr.country || ''}`, 50, 225);
      }

      // ─── Client Info (Right) ─────────────────────────────────────────────
      doc.fontSize(10).font('Helvetica-Bold').text('À:', 320, 150);

      doc
        .fontSize(9)
        .font('Helvetica')
        .text(invoice.client?.name || 'N/A', 320, 165)
        .text(invoice.client?.email || '', 320, 180);

      if (invoice.client?.address) {
        const cAddr = invoice.client.address as any;
        doc.text(`${cAddr.street || ''}`, 320, 195);
        doc.text(`${cAddr.city || ''} ${cAddr.postal_code || ''}`, 320, 210);
      }

      // ─── Line Separator ──────────────────────────────────────────────────
      doc
        .strokeColor('#cccccc')
        .lineWidth(1)
        .moveTo(50, 260)
        .lineTo(545, 260)
        .stroke();

      // ─── Invoice Items Table ─────────────────────────────────────────────
      let yPosition = 280;

      // Table Header
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#2c3e50')
        .text('Description', 50, yPosition)
        .text('Qté', 320, yPosition, { width: 60, align: 'right' })
        .text('P.U. (TND)', 380, yPosition, { width: 80, align: 'right' })
        .text('Montant (TND)', 460, yPosition, { width: 85, align: 'right' })
        .fillColor('#000');

      yPosition += 20;

      // Table Header Line
      doc
        .strokeColor('#2c3e50')
        .lineWidth(1)
        .moveTo(50, yPosition)
        .lineTo(545, yPosition)
        .stroke();

      yPosition += 10;

      // Items
      doc.font('Helvetica').fontSize(9);

      invoice.items.forEach((item) => {
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }

        doc
          .text(item.description, 50, yPosition, { width: 260 })
          .text(Number(item.quantity).toFixed(3), 320, yPosition, { width: 60, align: 'right' })
          .text(Number(item.unit_price).toFixed(3), 380, yPosition, { width: 80, align: 'right' })
          .text(Number(item.amount).toFixed(3), 460, yPosition, { width: 85, align: 'right' });

        yPosition += 25;
      });

      // ─── Totals Section ──────────────────────────────────────────────────
      yPosition += 20;

      doc
        .strokeColor('#cccccc')
        .lineWidth(1)
        .moveTo(320, yPosition)
        .lineTo(545, yPosition)
        .stroke();

      yPosition += 15;

      // Subtotal
      doc
        .fontSize(10)
        .font('Helvetica')
        .text('Sous-total HT:', 320, yPosition)
        .text(`${Number(invoice.subtotal).toFixed(3)} TND`, 460, yPosition, {
          width: 85,
          align: 'right',
        });

      yPosition += 20;

      // Tax
      if (invoice.tax_rate) {
        doc
          .text(`TVA (${Number(invoice.tax_rate).toFixed(2)}%):`, 320, yPosition)
          .text(`${Number(invoice.tax).toFixed(3)} TND`, 460, yPosition, { width: 85, align: 'right' });
        yPosition += 20;
      }

      // Total
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#2c3e50')
        .text('TOTAL TTC:', 320, yPosition)
        .text(`${Number(invoice.total).toFixed(3)} TND`, 460, yPosition, { width: 85, align: 'right' })
        .fillColor('#000');

      // ─── Notes Section ───────────────────────────────────────────────────
      if (invoice.notes) {
        yPosition += 40;
        doc.fontSize(9).font('Helvetica-Bold').text('Notes:', 50, yPosition);
        yPosition += 15;
        doc.fontSize(8).font('Helvetica').text(invoice.notes, 50, yPosition, { width: 495 });
      }

      // ─── Footer ──────────────────────────────────────────────────────────
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#7f8c8d')
        .text('Merci pour votre confiance', 50, 750, { align: 'center', width: 495 });

      doc.end();

      stream.on('finish', () => {
        resolve(`/uploads/invoices/${filename}`);
      });

      stream.on('error', (err) => {
        reject(err);
      });
    });
  }

  // ─── Get PDF File Path ───────────────────────────────────────────────────
  getPdfPath(pdfUrl: string): string {
    return path.join(process.cwd(), pdfUrl);
  }

  // ─── Delete PDF ──────────────────────────────────────────────────────────
  deletePdf(pdfUrl: string): void {
    const filepath = this.getPdfPath(pdfUrl);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }
}