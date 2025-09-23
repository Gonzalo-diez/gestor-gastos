import { Test } from '@nestjs/testing';
import { ImportsController } from './imports.controller';
import { ImportsService } from './imports.service';

describe('ImportsController', () => {
  let controller: ImportsController;

  const serviceMock = {
    preview: jest.fn(),
    confirm: jest.fn(),
  };

  const req = { user: { sub: 'u1' } } as any;

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod = await Test.createTestingModule({
      controllers: [ImportsController],
      providers: [{ provide: ImportsService, useValue: serviceMock }],
    }).compile();

    controller = mod.get(ImportsController);
  });

  it('POST /imports/preview delega en service.preview', async () => {
    serviceMock.preview.mockResolvedValue({ uploadId: 'up1', rows: 2 });

    // ajusta los parámetros a la firma real de tu controller (file/dto)
    const file: any = { buffer: Buffer.from('csv'), originalname: 'sample.csv' };
    const body: any = { accountId: 'a1' };

    const res = await (controller as any).preview(req, file, body);

    expect(serviceMock.preview).toHaveBeenCalled(); // sincrónico y delegado
    expect(res).toEqual({ uploadId: 'up1', rows: 2 });
  });

  it('POST /imports/confirm delega en service.confirm y devuelve { created }', async () => {
    serviceMock.confirm.mockResolvedValue({ created: 2 });

    const body: any = {
      accountId: 'a1',
      uploadId: 'up1',
      columnMap: {
        date: 'fecha',
        amount: 'monto',
        note: 'nota',
        categoryName: 'categoria',
        categoryType: 'tipo',
      },
      createMissingCategories: true,
      createBudgets: 'none',
    };

    const res = await (controller as any).confirm(req, body);

    expect(serviceMock.confirm).toHaveBeenCalled();
    expect(res).toEqual({ created: 2 });
  });
});
