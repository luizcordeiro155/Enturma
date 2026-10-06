export type Ride = {
  id: string;
  ownerId: string;
  name?: string;
  campusId?: string;
  campusName: string;
  originArea: string;
  departureAt: string;
  seats: number;
  acceptedSeats?: number;
  waitlistedSeats?: number;
  type: "OFFER" | "REQUEST";
  status: "OPEN" | "COMPLETED" | "CANCELLED";
  tripStatus:
    | "SCHEDULED"
    | "MATCHING"
    | "DRIVER_ON_THE_WAY"
    | "ARRIVING"
    | "WAITING_PASSENGER"
    | "IN_PROGRESS"
    | "ARRIVED"
    | "COMPLETED"
    | "CANCELLED";
  direction: "TO_CAMPUS" | "FROM_CAMPUS";
  areaLat?: number | null;
  areaLng?: number | null;
  ownerRating?: number;
  ownerReviews?: number;
  vehicleBrand?: string | null;
  vehicleModel?: string | null;
  vehicleColor?: string | null;
};

export type Match = {
  id: string;
  rideId: string;
  userId: string;
  ownerId: string;
  driverId: string;
  passengerId: string;
  requestedBy: string;
  requestRideId?: string | null;
  status:
    | "PENDING"
    | "WAITLISTED"
    | "ACCEPTED"
    | "REJECTED"
    | "CANCELLED"
    | "NO_SHOW";
  rideStatus: string;
  tripStatus: Ride["tripStatus"];
  driverConfirmed: boolean;
  passengerConfirmed: boolean;
  boardingCode?: string | null;
  boardedAt?: string | null;
  pickupOrder?: number | null;
  meetingPoint: string | null;
  pickupLat?: number | null;
  pickupLng?: number | null;
  startLabel?: string | null;
  startLat?: number | null;
  startLng?: number | null;
  endLabel?: string | null;
  endLat?: number | null;
  endLng?: number | null;
  passengerStartLabel?: string | null;
  passengerStartLat?: number | null;
  passengerStartLng?: number | null;
  passengerEndLabel?: string | null;
  passengerEndLat?: number | null;
  passengerEndLng?: number | null;
  closedAt: string | null;
  deletedAt: string | null;
  purgeAt: string | null;
  originArea: string;
  campusId: string;
  campusName: string;
  passengerName: string;
  driverName: string;
  ownerName: string;
  departureAt: string;
  vehicleBrand?: string | null;
  vehicleModel?: string | null;
  vehicleColor?: string | null;
  plateHint?: string | null;
  peerRating?: number;
  peerReviews?: number;
};

export type RideSuggestion = {
  id: string;
  ownerId: string;
  ownerName: string;
  type: "OFFER" | "REQUEST";
  originArea: string;
  campusName: string;
  departureAt: string;
  seats: number;
  acceptedSeats: number;
  availableSeats: number;
  full: boolean;
  distanceKm: number | null;
  estimatedDetourMinutes: number | null;
  timeDifferenceMinutes: number;
  matchLevel: "EXCELENTE" | "BOA" | "COMPATIVEL";
  rank: number;
  reasons: string[];
  rating: number;
  reviews: number;
  verifiedStudent: boolean;
  vehicle: string | null;
};

export type RideVehicle = {
  brand?: string;
  model?: string;
  color?: string;
  modelYear?: number | null;
  seats?: number;
  plateHint?: string | null;
};

export type RideRecurrence = {
  id: string;
  campusId: string;
  campusName: string;
  type: "OFFER" | "REQUEST";
  originArea: string;
  direction: "TO_CAMPUS" | "FROM_CAMPUS";
  localTime: string;
  timezone: string;
  weekdays: string;
  seats: number;
  active: boolean;
};

export type PickupZone = {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
};

export type PeerLocation = {
  available: boolean;
  lat?: number;
  lng?: number;
  accuracyM?: number;
  heading?: number | null;
  speedMps?: number | null;
  capturedAt?: string | null;
  updatedAt?: string;
  distanceKm?: number;
  etaMinutes?: number;
};

export type SafetyShare = {
  id: string;
  token: string;
  path: string;
  expiresAt: string;
};
