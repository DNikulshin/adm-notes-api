import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Todo, User } from '@prisma/client';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

@Injectable()
export class TodosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTodoDto: CreateTodoDto, user: User): Promise<Todo> {
    return this.prisma.todo.create({
      data: {
        ...createTodoDto,
        user: {
          connect: { id: user.id },
        },
      },
    });
  }

  async findAll(user: User): Promise<Todo[]> {
    return this.prisma.todo.findMany({ where: { userId: user.id } });
  }

  async findOne(id: string, user: User): Promise<Todo | null> {
    const todo = await this.prisma.todo.findFirst({ where: { id, userId: user.id } });
    if (!todo) {
      throw new NotFoundException(`Todo with ID ${id} not found`);
    }
    return todo;
  }

  async update(id: string, updateTodoDto: UpdateTodoDto, user: User): Promise<Todo> {
    await this.findOne(id, user); // Check if the todo exists and belongs to the user
    return this.prisma.todo.update({
      where: { id },
      data: updateTodoDto,
    });
  }

  async remove(id: string, user: User): Promise<void> {
    await this.findOne(id, user); // Check if the todo exists and belongs to the user
    await this.prisma.todo.delete({ where: { id } });
  }

  async deleteAll(): Promise<void> {
    await this.prisma.todo.deleteMany();
  }
}
