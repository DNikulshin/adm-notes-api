import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { TodosService } from './todos.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { User, UserRole } from '@prisma/client';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new todo' })
  @ApiResponse({ status: 201, description: 'The todo has been successfully created.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  create(@Body() createTodoDto: CreateTodoDto, @Req() req) {
    return this.todosService.create(createTodoDto, req.user as User);
  }

  @Get()
  @ApiOperation({ summary: 'Find all todos for the current user, or all todos if the user is an admin.' })
  @ApiResponse({ status: 200, description: 'Return all todos.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @UseGuards(JwtAuthGuard)
  findAll(@Req() req) {
    return this.todosService.findAll(req.user as User);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a single todo by its ID. Users can only access their own todos. Admins can access any todo.' })
  @ApiResponse({ status: 200, description: 'Return a single todo.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Todo not found.' })
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @Req() req) {
    return this.todosService.findOne(id, req.user as User);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a todo. Users can only update their own todos.' })
  @ApiResponse({ status: 200, description: 'The todo has been successfully updated.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Todo not found.' })
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateTodoDto: UpdateTodoDto, @Req() req) {
    return this.todosService.update(id, updateTodoDto, req.user as User);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a todo. Users can only delete their own todos.' })
  @ApiResponse({ status: 200, description: 'The todo has been successfully deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Todo not found.' })
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Req() req) {
    return this.todosService.remove(id, req.user as User);
  }

  @Delete('admin/delete-all')
  @ApiOperation({ summary: 'Delete all todos (admin only).' })
  @ApiResponse({ status: 200, description: 'All todos have been successfully deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  deleteAll() {
    return this.todosService.deleteAll();
  }
}
