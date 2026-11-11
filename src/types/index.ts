export type UserRole = 'cliente' | 'admin' | 'validador';

export type TravelClass = 'turistica' | 'executiva' | 'primeira';

export type PaymentMethod = 'cartao' | 'transferencia_bancaria' | 'deposito';

export type PaymentStatus = 
  | 'aguardando_pagamento'
  | 'comprovativo_recebido'
  | 'em_analise'
  | 'pagamento_confirmado'
  | 'pagamento_rejeitado'
  | 'pagamento_expirado'
  | 'reembolso';

export type TicketStatus = 'valido' | 'utilizado' | 'cancelado' | 'pendente' | 'expirado';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  biNumber?: string;
  birthDate?: string;
  gender?: 'M' | 'F' | 'Outro';
  nationality?: string;
  address?: string;
  province?: string;
  municipality?: string;
  locality?: string;
  avatarUrl?: string;
  locationPermission?: boolean;
  latitude?: number;
  longitude?: number;
  status: 'activo' | 'suspenso';
  createdAt: string;
  lastLoginAt?: string;
  loginCount: number;
}

export interface Station {
  id: string;
  name: string;
  code: string;
  city: string;
  province: string;
  isMainHub: boolean;
  latitude: number;
  longitude: number;
  lineName: string; // e.g., "CFL - Caminho de Ferro de Luanda"
  description: string;
}

export interface RouteStop {
  stationId: string;
  stationName: string;
  province: string;
  stopOrder: number;
  arrivalOffsetMinutes: number; // minutes from trip start
  departureOffsetMinutes: number;
  distanceKm: number;
  touristHighlight?: string;
}

export interface Route {
  id: string;
  name: string;
  originStationId: string;
  originStationName: string;
  destinationStationId: string;
  destinationStationName: string;
  distanceKm: number;
  estimatedDurationMinutes: number;
  line: string;
  active: boolean;
  stops: RouteStop[];
}

export interface Seat {
  id: string; // e.g. "C01-01"
  carriageId: string;
  carriageNumber: number;
  seatNumber: string; // "01", "02", etc.
  travelClass: TravelClass;
  status: 'disponivel' | 'ocupado' | 'bloqueado' | 'selecionado';
  lockedUntil?: string; // ISO string for 15-minute temporary reservation
  lockedByUserId?: string;
}

export interface Carriage {
  id: string;
  trainId: string;
  carriageNumber: number;
  travelClass: TravelClass;
  capacity: number;
  seatRows: number;
  seatsPerRow: number;
  amenities: string[];
  active: boolean;
}

export interface Train {
  id: string;
  name: string;
  code: string;
  model: string;
  active: boolean;
  totalCarriages: number;
  totalCapacity: number;
  carriages: Carriage[];
}

export interface Trip {
  id: string;
  trainId: string;
  trainName: string;
  trainCode: string;
  routeId: string;
  originStation: string;
  originProvince: string;
  destinationStation: string;
  destinationProvince: string;
  departureDate: string; // YYYY-MM-DD
  departureTime: string; // HH:mm
  arrivalDate: string;
  arrivalTime: string;
  estimatedDuration: string;
  status: 'programada' | 'em_viagem' | 'concluida' | 'cancelada';
  prices: {
    turistica: number;
    executiva: number;
    primeira: number;
  };
  stops: {
    stationName: string;
    province: string;
    arrivalTime: string;
    departureTime: string;
    touristSpot?: string;
  }[];
  totalSeats: number;
  availableSeats: number;
}

export interface Passenger {
  id: string;
  fullName: string;
  biNumber: string;
  phone: string;
  email: string;
  seatNumber: string;
  carriageNumber: number;
  travelClass: TravelClass;
  price: number;
}

export interface Booking {
  id: string;
  bookingCode: string; // e.g., "EK-2026-94812"
  userId: string;
  userFullName: string;
  userEmail: string;
  userPhone: string;
  tripId: string;
  tripName: string;
  originStation: string;
  destinationStation: string;
  travelDate: string;
  departureTime: string;
  arrivalTime: string;
  trainName: string;
  travelClass: TravelClass;
  passengers: Passenger[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentReference?: string;
  createdAt: string;
  expiresAt: string;
  cancellationReason?: string;
  cancelledAt?: string;
  refundStatus?: 'nao_solicitado' | 'em_analise' | 'aprovado' | 'rejeitado';
  refundAmount?: number;
}

export interface ReceiptAnalysis {
  transactionId?: string;
  bankName?: string;
  payerName?: string;
  amount?: number;
  date?: string;
  reference?: string;
  isLegible: boolean;
  confidenceScore: number;
  rawExtractedText?: string;
  verificationNotes: string;
  isAmountMatching: boolean;
}

export interface PaymentReceipt {
  id: string;
  bookingId: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  analysis?: ReceiptAnalysis;
  reviewedByAdminId?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  status: PaymentStatus;
}

export interface Ticket {
  id: string;
  bookingId: string;
  passengerId: string;
  numericCode: string; // Exactly 10 digits, e.g. "8492019384"
  qrToken: string;
  passengerName: string;
  passengerBi: string;
  tripId: string;
  trainName: string;
  originStation: string;
  destinationStation: string;
  travelDate: string;
  departureTime: string;
  arrivalTime: string;
  carriageNumber: number;
  seatNumber: string;
  travelClass: TravelClass;
  amountPaid: number;
  status: TicketStatus;
  issuedAt: string;
  usedAt?: string;
  validatedBy?: string;
}

export interface TouristDestination {
  id: string;
  name: string;
  province: string;
  category: 'natural' | 'historico' | 'cultural' | 'praia';
  shortDescription: string;
  fullDescription: string;
  mainAttractions: string[];
  localCulture: string;
  curiosities: string[];
  imageUrl: string;
  nearStationId: string;
  nearStationName: string;
}

export interface SystemNotification {
  id: string;
  userId?: string; // null means for admins
  title: string;
  message: string;
  type: 'info' | 'sucesso' | 'aviso' | 'urgente';
  targetRole?: UserRole;
  createdAt: string;
  read: boolean;
  actionUrl?: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetType: 'pagamento' | 'viagem' | 'comboio' | 'cliente' | 'bilhete' | 'reembolso';
  targetId: string;
  details: string;
  timestamp: string;
}

export interface AdminStats {
  totalClients: number;
  totalLogins: number;
  totalBookings: number;
  totalTripsScheduled: number;
  totalTripsCompleted: number;
  totalPassengers: number;
  totalTicketsIssued: number;
  totalPaymentsConfirmed: number;
  pendingPaymentsCount: number;
  receiptsInReviewCount: number;
  cancelledTripsCount: number;
  totalConfirmedRevenue: number;
  bookingsByMonth: { month: string; bookings: number; revenue: number }[];
  popularRoutes: { route: string; passengers: number }[];
  popularDestinations: { destination: string; count: number }[];
  paymentsByMethod: { method: string; count: number; total: number }[];
}
