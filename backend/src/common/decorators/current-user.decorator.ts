import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator((data: string | undefined, ctx: ExecutionContext) => {
  const u = ctx.switchToHttp().getRequest().user;
  return data ? u?.[data] : u;
});