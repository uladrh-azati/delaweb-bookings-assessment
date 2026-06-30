import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/auth.entity.js';
import { JwtAuthGuard } from '../auth/jwt.guard.js';
import { BookingsService } from './bookings.service.js';
import {
  CreateBookingDto,
  ListBookingsDto,
  type BookingDto,
} from './dto/index.js';

@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Get()
  list(@Query() query: ListBookingsDto): Promise<readonly BookingDto[]> {
    return this.bookings.list(query);
  }

  @Post()
  create(
    @Body() dto: CreateBookingDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<BookingDto> {
    return this.bookings.create({ dto, userId: req.user.userId });
  }

  @Post('holds')
  hold(
    @Body() dto: CreateBookingDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<BookingDto> {
    return this.bookings.hold({ dto, userId: req.user.userId });
  }

  @Post(':id/confirm')
  confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<BookingDto> {
    return this.bookings.confirm({ id, userId: req.user.userId });
  }

  @Delete(':id')
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<BookingDto> {
    return this.bookings.cancel({ id, userId: req.user.userId });
  }
}
