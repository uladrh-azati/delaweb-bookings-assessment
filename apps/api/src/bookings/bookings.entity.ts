export type BookingStatus = 'held' | 'confirmed' | 'cancelled';

export type ClaimStatus = 'held' | 'confirmed';

export type Booking = {
  id: string;
  roomId: string;
  roomName: string;
  userId: string;
  userName: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};
