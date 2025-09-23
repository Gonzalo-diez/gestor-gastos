import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, currency: true, createdAt: true },
    });
  }

  async get(userId: string, id: string) {
    const a = await this.prisma.account.findUnique({
      where: { id },
      select: { id: true, name: true, currency: true, userId: true, createdAt: true },
    });
    if (!a || a.userId !== userId) throw new NotFoundException();
    const { userId: _, ...view } = a;
    return view;
  }

  async create(userId: string, dto: { name: string; currencyCode: string }) {
    const code = dto.currencyCode.toUpperCase();
    const cur = await this.prisma.currency.findUnique({ where: { code } });
    if (!cur) throw new BadRequestException('currencyCode inválido');

    try {
      return await this.prisma.account.create({
        data: { userId, name: dto.name.trim(), currencyCode: code },
        select: {
          id: true,
          name: true,
          currencyCode: true,
          currency: { select: { code: true, name: true, symbol: true, decimals: true } },
          createdAt: true,
        },
      });
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('Ya existe una cuenta con ese nombre');
      throw e;
    }
  }

  async update(userId: string, id: string, dto: { name?: string; currencyCode?: string }) {
    await this.assertOwner(userId, id);

    const data: any = {};
    if (dto.name) data.name = dto.name.trim();
    if (dto.currencyCode) {
      const code = dto.currencyCode.toUpperCase();
      const cur = await this.prisma.currency.findUnique({ where: { code } });
      if (!cur) throw new BadRequestException('currencyCode inválido');
      data.currencyCode = code;
    }

    try {
      return await this.prisma.account.update({
        where: { id },
        data,
        select: {
          id: true,
          name: true,
          currencyCode: true,
          currency: { select: { code: true, name: true, symbol: true, decimals: true } },
          createdAt: true,
        },
      });
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('Ya existe una cuenta con ese nombre');
      throw e;
    }
  }

  async remove(userId: string, id: string) {
    await this.assertOwner(userId, id);
    // opcional: impedir borrar si tiene transacciones
    const count = await this.prisma.transaction.count({ where: { accountId: id } });
    if (count > 0) throw new BadRequestException('La cuenta tiene transacciones asociadas');
    await this.prisma.account.delete({ where: { id } });
    return { ok: true };
  }

  private async assertOwner(userId: string, id: string) {
    const acc = await this.prisma.account.findUnique({ where: { id }, select: { userId: true } });
    if (!acc || acc.userId !== userId) throw new ForbiddenException();
  }
}