import { ArgumentsHost, Catch, ConflictException, ExceptionFilter, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(e: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    if (e.code === 'P2002') {
      const err = new ConflictException('Registro duplicado');
      return res.status(err.getStatus()).json(err.getResponse());
    }
    if (e.code === 'P2025') {
      const err = new NotFoundException('No encontrado');
      return res.status(err.getStatus()).json(err.getResponse());
    }
    res.status(500).json({ statusCode: 500, message: 'DB error', code: e.code });
  }
}