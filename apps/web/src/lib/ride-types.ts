export type Ride = {
  id: string;
  ownerId: string;
  name: string;
  campusName: string;
  originArea: string;
  departureAt: string;
  seats: number;
  type: string;
  status: string;
  direction: string;
};
export type Match = {
  id: string;
  rideId: string;
  userId: string;
  ownerId: string;
  status: string;
  rideStatus: string;
  meetingPoint: string | null;
  closedAt: string | null;
  deletedAt: string | null;
  purgeAt: string | null;
  originArea: string;
  passengerName: string;
  ownerName: string;
  departureAt: string;
};
