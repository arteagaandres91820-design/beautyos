export type Role = 'ADMIN' | 'PROFESSIONAL';
export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type PaymentMethod = 'CASH' | 'CARD' | 'NEQUI' | 'DAVIPLATA' | 'TRANSFER' | 'GIFT_CARD';
export type ServiceCategory = 'HAIR' | 'NAILS' | 'FACE' | 'BARBERSHOP' | 'SPA' | 'OTHER';
export type NailDesignCategory =
  | 'FRENCH' | 'ACRYLIC' | 'GEL' | 'MINIMALIST' | 'ELEGANT'
  | 'WEDDING' | 'CHRISTMAS' | 'HALLOWEEN' | 'CORPORATE' | 'TRENDS_2026'
  | 'GRADIENT' | 'FLORAL' | 'GEOMETRIC' | 'GLITTER' | 'PASTEL'
  | 'SUMMER' | 'VALENTINES' | 'BIRTHDAY' | 'CHROME' | 'ARTISTIC';

export interface MessageTemplate { id: string; name: string; body: string; }
export interface Business { id: string; name: string; slug: string; city: string; whatsapp?: string; openTime?: string; closeTime?: string; slotDuration?: number; closedDays?: string; messageTemplates?: string; monthlyRevenueGoal?: number; expenseBudgets?: string; loyaltyCopPerPoint?: number; loyaltyPointValue?: number; }
export interface User { id: string; email: string; name: string; role: Role; avatar?: string; business: Business; }

export interface Client {
  id: string; name: string; email?: string; phone: string;
  birthday?: string; photo?: string; notes?: string; tags: string[];
  isVip: boolean; visitCount: number; points: number; noShowCount?: number; createdAt: string;
  referredById?: string | null;
  referredBy?: { id: string; name: string } | null;
  referrals?: { id: string; name: string; createdAt: string }[];
}

export interface Service {
  id: string; name: string; category: ServiceCategory;
  price: number; duration: number; description?: string;
  image?: string; isActive: boolean; checklist?: string;
}

export interface Appointment {
  id: string; date: string; startTime: string; endTime: string;
  status: AppointmentStatus; notes?: string; totalPrice: number;
  proposedDesigns?: string;  // JSON string of design IDs
  approvedDesignId?: string;
  shareToken?: string;
  rating?: number | null;
  reviewNote?: string | null;
  recurrenceRule?: string | null;
  recurrenceGroupId?: string | null;
  client: Pick<Client, 'id' | 'name' | 'phone' | 'photo' | 'isVip' | 'visitCount'>;
  professional: { id: string; name: string; avatar?: string };
  services: Array<{ service: Pick<Service, 'id' | 'name' | 'price' | 'duration' | 'checklist'>; price: number }>;
  payment?: Payment;
  photos?: AppointmentPhoto[];
}

export interface BookingRequest {
  id: string; clientName: string; clientPhone: string; clientEmail?: string;
  date: string; timeSlot: string; notes?: string; status: string;
  createdAt: string; serviceId?: string;
}

export interface Payment {
  id: string; amount: number; tipAmount?: number; method: PaymentMethod;
  notes?: string; createdAt: string; appointmentId: string;
}

export interface NailDesign {
  id: string; name: string; category: NailDesignCategory;
  price: number; duration: number; imageUrl: string;
  description?: string; tags: string[]; saveCount: number;
}

export interface AppointmentPhoto {
  id: string; url: string; type: 'BEFORE' | 'AFTER' | 'OTHER';
  caption?: string | null; createdAt: string;
}

export interface PromoCode {
  id: string; code: string; description?: string | null;
  type: 'PERCENT' | 'FIXED'; value: number;
  maxUses?: number | null; usedCount: number;
  expiresAt?: string | null; isActive: boolean; createdAt: string;
}

export type ClientNoteType = 'NOTE' | 'CALL' | 'MESSAGE' | 'FOLLOWUP' | 'ALERT';

export interface ClientNote {
  id: string; body: string; type: ClientNoteType; createdAt: string;
  author?: { id: string; name: string; avatar?: string | null } | null;
}

export interface ServicePackage {
  id: string; name: string; description?: string | null;
  price: number; duration: number; image?: string | null; isActive: boolean;
  services: Array<{ service: { name: string } }>;
}

export interface ClientPackage {
  id: string;
  sessionsTotal: number;
  sessionsUsed: number;
  purchasedAt: string;
  expiresAt?: string | null;
  notes?: string | null;
  package: ServicePackage;
}

export interface WaitlistEntry {
  id: string; clientName: string; clientPhone: string;
  date: string; timeSlot?: string | null; notes?: string | null;
  status: 'WAITING' | 'NOTIFIED' | 'BOOKED' | 'CANCELLED';
  createdAt: string;
}

export interface TimeBlock {
  id: string; date: string; startTime: string; endTime: string;
  reason?: string; isFullDay: boolean; createdAt: string;
  user: { id: string; name: string; avatar?: string | null };
}

export interface DashboardStats {
  todayAppointments: number; todayRevenue: number;
  totalClients: number; vipClients: number;
  monthRevenue: number; prevMonthRevenue: number; revenueGrowth: number | null;
  activeClientsMonth: number;
  upcomingAppointments: Appointment[];
  pendingBookingRequests: number;
  pendingProposals: number;
  lowStockCount: number;
  birthdayClients: { id: string; name: string; phone: string; isVip: boolean; birthday: string }[];
  projectedRevenue: number;
  overdueCount: number;
  atRiskClients: { id: string; name: string; phone: string; isVip: boolean; daysSince: number }[];
  expiringPackages: {
    id: string; clientId: string; clientName: string; clientPhone: string;
    packageName: string; sessionsLeft: number; expiresAt: string | null;
  }[];
}
