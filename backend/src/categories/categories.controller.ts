import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoriesDto } from './dto/query-categories.dto';
import { AccessJwtGuard } from '../auth/guards/access-jwt.guard';

@UseGuards(AccessJwtGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  list(@Req() req: any, @Query() q: QueryCategoriesDto) {
    return this.categories.list(req.user.sub, q.type);
  }

  @Get(':id')
  get(@Req() req: any, @Param('id') id: string) {
    return this.categories.get(req.user.sub, id);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateCategoryDto) {
    return this.categories.create(req.user.sub, dto);
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categories.update(req.user.sub, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.categories.remove(req.user.sub, id);
  }
}