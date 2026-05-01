import { Test, TestingModule } from '@nestjs/testing';
import { GoodsReceiptsController } from './goods-receipts.controller';
import { GoodsReceiptsService } from '../services/goods-receipts.service';

describe('GoodsReceiptsController', () => {
  let controller: GoodsReceiptsController;
  let goodsReceiptsService: any;

  beforeEach(async () => {
    goodsReceiptsService = {
      create: jest.fn(),
      findAllByPO: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoodsReceiptsController],
      providers: [
        {
          provide: GoodsReceiptsService,
          useValue: goodsReceiptsService,
        },
      ],
    }).compile();

    controller = module.get<GoodsReceiptsController>(GoodsReceiptsController);
  });

  it('devrait être défini', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('devrait créer un bon de réception', async () => {
      const businessId = 'business-1';
      const poId = 'po-1';
      const createDto = {
        items: [
          {
            supplier_po_item_id: 'item-1',
            quantity_received: 100,
          },
        ],
        receipt_date: '2026-05-01',
        notes: 'Test notes',
      };

      const mockReq = {
        user: { id: 'user-1' },
      };

      const mockGR = {
        id: 'gr-1',
        gr_number: 'BR-2026-0001',
        ...createDto,
      };

      goodsReceiptsService.create.mockResolvedValue(mockGR);

      const result = await controller.create(businessId, poId, createDto as any, mockReq);

      expect(result).toEqual(mockGR);
      expect(goodsReceiptsService.create).toHaveBeenCalledWith(
        businessId,
        poId,
        createDto,
        'user-1',
      );
    });
  });

  describe('findAllByPO', () => {
    it('devrait retourner tous les bons de réception d\'un PO', async () => {
      const businessId = 'business-1';
      const poId = 'po-1';
      const mockGRs = [
        { id: 'gr-1', gr_number: 'BR-2026-0001' },
        { id: 'gr-2', gr_number: 'BR-2026-0002' },
      ];

      goodsReceiptsService.findAllByPO.mockResolvedValue(mockGRs);

      const result = await controller.findAllByPO(businessId, poId);

      expect(result).toEqual(mockGRs);
      expect(goodsReceiptsService.findAllByPO).toHaveBeenCalledWith(businessId, poId);
    });
  });

  describe('findOne', () => {
    it('devrait retourner un bon de réception par ID', async () => {
      const businessId = 'business-1';
      const grId = 'gr-1';
      const mockGR = {
        id: grId,
        gr_number: 'BR-2026-0001',
        items: [],
      };

      goodsReceiptsService.findOne.mockResolvedValue(mockGR);

      const result = await controller.findOne(businessId, grId);

      expect(result).toEqual(mockGR);
      expect(goodsReceiptsService.findOne).toHaveBeenCalledWith(businessId, grId);
    });
  });
});
