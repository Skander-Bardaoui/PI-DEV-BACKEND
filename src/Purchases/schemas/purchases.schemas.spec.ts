import { describe, it, expect } from '@jest/globals';
import {
  createSupplierSchema,
  createSupplierPOSchema,
  createPurchaseInvoiceSchema,
  createGoodsReceiptSchema,
  disputeInvoiceSchema,
} from './purchases.schemas';

describe('Purchases Schemas Validation', () => {
  describe('createSupplierSchema', () => {
    it('devrait valider un fournisseur valide', () => {
      const validSupplier = {
        name: 'Fournisseur Test',
        email: 'test@example.com',
        phone: '+216 71 000 000',
        payment_terms: 30,
      };

      const result = createSupplierSchema.safeParse(validSupplier);
      expect(result.success).toBe(true);
    });

    it('devrait rejeter un nom trop court', () => {
      const invalidSupplier = {
        name: 'A',
        email: 'test@example.com',
      };

      const result = createSupplierSchema.safeParse(invalidSupplier);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('au moins 2 caractères');
      }
    });

    it('devrait rejeter un email invalide', () => {
      const invalidSupplier = {
        name: 'Fournisseur Test',
        email: 'invalid-email',
      };

      const result = createSupplierSchema.safeParse(invalidSupplier);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('email invalide');
      }
    });

    it('devrait rejeter un délai de paiement négatif', () => {
      const invalidSupplier = {
        name: 'Fournisseur Test',
        payment_terms: -10,
      };

      const result = createSupplierSchema.safeParse(invalidSupplier);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('ne peut pas être négatif');
      }
    });

    it('devrait rejeter un délai de paiement > 365 jours', () => {
      const invalidSupplier = {
        name: 'Fournisseur Test',
        payment_terms: 400,
      };

      const result = createSupplierSchema.safeParse(invalidSupplier);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('365 jours');
      }
    });
  });

  describe('createSupplierPOSchema', () => {
    it('devrait valider un BC valide', () => {
      const validPO = {
        supplier_id: '123e4567-e89b-12d3-a456-426614174000',
        expected_delivery: '2024-12-31',
        items: [
          {
            description: 'Produit test',
            quantity_ordered: 10,
            unit_price_ht: 100.5,
            tax_rate_value: 19,
          },
        ],
      };

      const result = createSupplierPOSchema.safeParse(validPO);
      expect(result.success).toBe(true);
    });

    it('devrait rejeter un BC sans lignes', () => {
      const invalidPO = {
        supplier_id: '123e4567-e89b-12d3-a456-426614174000',
        items: [],
      };

      const result = createSupplierPOSchema.safeParse(invalidPO);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('au moins une ligne');
      }
    });

    it('devrait rejeter une quantité négative', () => {
      const invalidPO = {
        supplier_id: '123e4567-e89b-12d3-a456-426614174000',
        items: [
          {
            description: 'Produit test',
            quantity_ordered: -5,
            unit_price_ht: 100,
            tax_rate_value: 19,
          },
        ],
      };

      const result = createSupplierPOSchema.safeParse(invalidPO);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('supérieure à 0');
      }
    });

    it('devrait rejeter un prix unitaire négatif', () => {
      const invalidPO = {
        supplier_id: '123e4567-e89b-12d3-a456-426614174000',
        items: [
          {
            description: 'Produit test',
            quantity_ordered: 10,
            unit_price_ht: -100,
            tax_rate_value: 19,
          },
        ],
      };

      const result = createSupplierPOSchema.safeParse(invalidPO);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('ne peut pas être négatif');
      }
    });
  });

  describe('createPurchaseInvoiceSchema', () => {
    it('devrait valider une facture valide', () => {
      const validInvoice = {
        invoice_number_supplier: 'FACT-2024-001',
        supplier_id: '123e4567-e89b-12d3-a456-426614174000',
        invoice_date: '2024-01-15',
        subtotal_ht: 1000.5,
        tax_amount: 190.095,
        timbre_fiscal: 1.0,
      };

      const result = createPurchaseInvoiceSchema.safeParse(validInvoice);
      expect(result.success).toBe(true);
    });

    it('devrait rejeter une facture sans numéro', () => {
      const invalidInvoice = {
        invoice_number_supplier: '',
        supplier_id: '123e4567-e89b-12d3-a456-426614174000',
        invoice_date: '2024-01-15',
        subtotal_ht: 1000,
        tax_amount: 190,
      };

      const result = createPurchaseInvoiceSchema.safeParse(invalidInvoice);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('obligatoire');
      }
    });

    it('devrait rejeter une date invalide', () => {
      const invalidInvoice = {
        invoice_number_supplier: 'FACT-001',
        supplier_id: '123e4567-e89b-12d3-a456-426614174000',
        invoice_date: '15/01/2024', // Format invalide
        subtotal_ht: 1000,
        tax_amount: 190,
      };

      const result = createPurchaseInvoiceSchema.safeParse(invalidInvoice);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Date invalide');
      }
    });

    it('devrait rejeter un montant négatif', () => {
      const invalidInvoice = {
        invoice_number_supplier: 'FACT-001',
        supplier_id: '123e4567-e89b-12d3-a456-426614174000',
        invoice_date: '2024-01-15',
        subtotal_ht: -1000,
        tax_amount: 190,
      };

      const result = createPurchaseInvoiceSchema.safeParse(invalidInvoice);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('ne peut pas être négatif');
      }
    });
  });

  describe('createGoodsReceiptSchema', () => {
    it('devrait valider un BR valide', () => {
      const validGR = {
        receipt_date: '2024-01-15',
        items: [
          {
            supplier_po_item_id: '123e4567-e89b-12d3-a456-426614174000',
            quantity_received: 10.5,
          },
        ],
      };

      const result = createGoodsReceiptSchema.safeParse(validGR);
      expect(result.success).toBe(true);
    });

    it('devrait rejeter un BR sans lignes', () => {
      const invalidGR = {
        receipt_date: '2024-01-15',
        items: [],
      };

      const result = createGoodsReceiptSchema.safeParse(invalidGR);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('au moins une ligne');
      }
    });

    it('devrait rejeter une quantité négative', () => {
      const invalidGR = {
        receipt_date: '2024-01-15',
        items: [
          {
            supplier_po_item_id: '123e4567-e89b-12d3-a456-426614174000',
            quantity_received: -5,
          },
        ],
      };

      const result = createGoodsReceiptSchema.safeParse(invalidGR);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('positive');
      }
    });
  });

  describe('disputeInvoiceSchema', () => {
    it('devrait valider un litige valide', () => {
      const validDispute = {
        dispute_reason: 'Montant incorrect sur la facture, écart de 100 TND',
      };

      const result = disputeInvoiceSchema.safeParse(validDispute);
      expect(result.success).toBe(true);
    });

    it('devrait rejeter un motif trop court', () => {
      const invalidDispute = {
        dispute_reason: 'Court',
      };

      const result = disputeInvoiceSchema.safeParse(invalidDispute);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('au moins 10 caractères');
      }
    });

    it('devrait rejeter un motif trop long', () => {
      const invalidDispute = {
        dispute_reason: 'A'.repeat(501),
      };

      const result = disputeInvoiceSchema.safeParse(invalidDispute);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('500 caractères');
      }
    });
  });
});
