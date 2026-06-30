import {
  Body,
  Controller,
  Delete,
  Get,
  NotImplementedException,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { BookingsService } from './bookings.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Get()
  list() {
    throw new NotImplementedException();
  }

  @Post()
  create(@Body() _dto: CreateBookingDto, @Req() _req: Request) {
    throw new NotImplementedException();
  }

  @Delete(':id')
  cancel(@Param('id') _id: string, @Req() _req: Request) {
    throw new NotImplementedException();
  }
}
