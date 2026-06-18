import axios from 'axios';

const api = axios.create({ baseURL: '/api', timeout: 30000 });
const publicAxios = axios.create({ baseURL: '/api/public', timeout: 30000 });

// Attach business slug to all public requests so multi-tenant routing works
publicAxios.interceptors.request.use((config) => {
  const slug = localStorage.getItem('beautyos_biz_slug');
  if (slug) {
    config.params = { ...config.params, slug };
  }
  return config;
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('beautyos_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('beautyos_token');
      localStorage.removeItem('beautyos_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

export const authApi = {
  register: (data: { businessName: string; city?: string; name: string; email: string; password: string }) => api.post('/auth/register', data),
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  updateMe: (data: { name: string }) => api.put('/auth/me', data),
  updateBusiness: (data: { name?: string; slug?: string; city?: string; whatsapp?: string; openTime?: string; closeTime?: string; slotDuration?: number; closedDays?: string; weeklySchedule?: string; messageTemplates?: string; monthlyRevenueGoal?: number; expenseBudgets?: string; loyaltyCopPerPoint?: number; loyaltyPointValue?: number }) => api.put('/auth/business', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) => api.put('/auth/password', data),
  uploadAvatar: (formData: FormData) => api.post('/auth/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const clientsApi = {
  list: (search?: string) => api.get('/clients', { params: { search } }),
  atRisk: (days?: number) => api.get('/clients/at-risk', { params: { days } }),
  get: (id: string) => api.get(`/clients/${id}`),
  create: (data: object) => api.post('/clients', data),
  update: (id: string, data: object) => api.put(`/clients/${id}`, data),
  delete: (id: string) => api.delete(`/clients/${id}`),
  uploadPhoto: (id: string, file: File) => {
    const fd = new FormData();
    fd.append('photo', file);
    return api.post(`/clients/${id}/photo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  adjustPoints: (id: string, delta: number) => api.post(`/clients/${id}/points`, { delta }),
  birthdays: (days?: number) => api.get('/clients/birthdays', { params: { days } }),
  importClients: (rows: { name: string; phone: string; email?: string; birthday?: string; notes?: string; tags?: string }[]) =>
    api.post('/clients/import', { rows }),
  notes: (clientId: string) => api.get(`/clients/${clientId}/notes`),
  addNote: (clientId: string, body: string, type?: string) => api.post(`/clients/${clientId}/notes`, { body, type }),
  deleteNote: (clientId: string, noteId: string) => api.delete(`/clients/${clientId}/notes/${noteId}`),
  exportData: () => api.get('/clients/export'),
  bulkEmail: (data: { clientIds: string[]; subject: string; body: string }) => api.post('/clients/bulk-email', data),
};

export const appointmentsApi = {
  list: (params?: object) => api.get('/appointments', { params }),
  sendReminders: (date: string) => api.post('/appointments/send-reminders', { date }),
  get: (id: string) => api.get(`/appointments/${id}`),
  create: (data: object) => api.post('/appointments', data),
  update: (id: string, data: object) => api.put(`/appointments/${id}`, data),
  delete: (id: string) => api.delete(`/appointments/${id}`),
  propose: (id: string, designIds: string[]) => api.post(`/appointments/${id}/propose`, { designIds }),
  bookingRequests: () => api.get('/appointments/booking-requests'),
  updateBookingRequest: (id: string, status: string) => api.put(`/appointments/booking-requests/${id}`, { status }),
  convertBookingRequest: (id: string) => api.post(`/appointments/booking-requests/${id}/convert`),
  photos: (id: string) => api.get(`/appointments/${id}/photos`),
  uploadPhoto: (id: string, file: File, type: 'BEFORE' | 'AFTER' | 'OTHER', caption?: string) => {
    const fd = new FormData();
    fd.append('photo', file);
    fd.append('type', type);
    if (caption) fd.append('caption', caption);
    return api.post(`/appointments/${id}/photos`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  deletePhoto: (id: string, photoId: string) => api.delete(`/appointments/${id}/photos/${photoId}`),
  setRating: (id: string, rating: number, reviewNote?: string) => api.patch(`/appointments/${id}/rating`, { rating, reviewNote }),
  cancelSeries: (id: string) => api.delete(`/appointments/${id}/series`),
};

export const servicesApi = {
  list: (category?: string, showInactive?: boolean) => api.get('/services', { params: { category, showInactive: showInactive ? '1' : undefined } }),
  stats: () => api.get('/services/stats'),
  create: (data: object) => api.post('/services', data),
  update: (id: string, data: object) => api.put(`/services/${id}`, data),
  delete: (id: string) => api.delete(`/services/${id}`),
  getProducts: (id: string) => api.get(`/services/${id}/products`),
  setProducts: (id: string, products: { productId: string; quantity: number }[]) => api.put(`/services/${id}/products`, { products }),
  setChecklist: (id: string, steps: string[]) => api.put(`/services/${id}/checklist`, { steps }),
  uploadImage: (id: string, file: File) => {
    const fd = new FormData();
    fd.append('image', file);
    return api.post(`/services/${id}/image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

export const cashApi = {
  summary: (date?: string) => api.get('/cash/summary', { params: { date } }),
  monthly: (year?: number, month?: number) => api.get('/cash/monthly', { params: { year, month } }),
  register: (data: { appointmentId: string; amount: number; method: string; notes?: string; pointsRedeemed?: number; tipAmount?: number }) => api.post('/cash', data),
};

export const nailApi = {
  list: (params?: object) => api.get('/nail-designs', { params }),
  listPublic: (params?: object) => api.get('/nail-designs/public', { params }),
  trending: () => api.get('/nail-designs/trending'),
  stats: () => api.get('/nail-designs/stats'),
  create: (data: object) => api.post('/nail-designs', data),
  upload: (formData: FormData) => api.post('/nail-designs/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: object) => api.put(`/nail-designs/${id}`, data),
  delete: (id: string) => api.delete(`/nail-designs/${id}`),
  toggleFavorite: (clientId: string, designId: string) => api.post('/nail-designs/favorites', { clientId, designId }),
  tryOn: (designId: string, handImageBase64: string) => api.post('/nail-designs/try-on', { designId, handImageBase64 }),
  getBusinessInfo: (businessId: string) => api.get(`/nail-designs/public/business/${businessId}`),
};

export const staffApi = {
  list: () => api.get('/staff'),
  commissions: (from?: string, to?: string) => api.get('/staff/commissions', { params: { from, to } }),
  create: (data: object) => api.post('/staff', data),
  update: (id: string, data: object) => api.put(`/staff/${id}`, data),
  delete: (id: string) => api.delete(`/staff/${id}`),
};

export const expensesApi = {
  list: (params?: { date?: string; month?: number; year?: number }) => api.get('/expenses', { params }),
  create: (data: { amount: number; category: string; description: string; date?: string }) => api.post('/expenses', data),
  update: (id: string, data: object) => api.put(`/expenses/${id}`, data),
  delete: (id: string) => api.delete(`/expenses/${id}`),
};

export const dashboardApi = {
  stats: () => api.get('/dashboard/stats'),
};

export const reportsApi = {
  overview: (days: number) => api.get('/reports/overview', { params: { days } }),
  reviews: (limit?: number) => api.get('/reports/reviews', { params: { limit } }),
};

export const inventoryApi = {
  list: (params?: { category?: string; lowStock?: boolean }) =>
    api.get('/inventory', { params: { ...params, lowStock: params?.lowStock ? '1' : undefined } }),
  create: (data: object) => api.post('/inventory', data),
  update: (id: string, data: object) => api.put(`/inventory/${id}`, data),
  delete: (id: string) => api.delete(`/inventory/${id}`),
  movement: (id: string, data: { type: 'IN' | 'OUT' | 'ADJUST'; quantity: number; notes?: string }) =>
    api.post(`/inventory/${id}/movement`, data),
};

export const packagesApi = {
  list: (showInactive?: boolean) => api.get('/packages', { params: { showInactive: showInactive ? '1' : undefined } }),
  create: (data: object) => api.post('/packages', data),
  update: (id: string, data: object) => api.put(`/packages/${id}`, data),
  delete: (id: string) => api.delete(`/packages/${id}`),
};

export const giftCardsApi = {
  list: (showInactive?: boolean) => api.get('/gift-cards', { params: { showInactive: showInactive ? '1' : undefined } }),
  lookup: (code: string) => api.get('/gift-cards/lookup', { params: { code } }),
  create: (data: { amount: number; recipientName?: string; notes?: string }) => api.post('/gift-cards', data),
  update: (id: string, data: object) => api.put(`/gift-cards/${id}`, data),
  redeem: (id: string, amount: number) => api.post(`/gift-cards/${id}/redeem`, { amount }),
  deactivate: (id: string) => api.delete(`/gift-cards/${id}`),
};

export const timeBlocksApi = {
  list: (params?: { date?: string; week?: string; staffId?: string }) => api.get('/time-blocks', { params }),
  create: (data: { staffId: string; date: string; startTime?: string; endTime?: string; reason?: string; isFullDay?: boolean }) => api.post('/time-blocks', data),
  update: (id: string, data: object) => api.put(`/time-blocks/${id}`, data),
  delete: (id: string) => api.delete(`/time-blocks/${id}`),
};

export const promoCodesApi = {
  list: () => api.get('/promo-codes'),
  lookup: (code: string, total: number) => api.post('/promo-codes/lookup', { code, total }),
  apply: (id: string) => api.post('/promo-codes/apply', { id }),
  create: (data: { code: string; description?: string; type: string; value: number; maxUses?: number | null; expiresAt?: string | null }) => api.post('/promo-codes', data),
  update: (id: string, data: object) => api.put(`/promo-codes/${id}`, data),
  delete: (id: string) => api.delete(`/promo-codes/${id}`),
};

export const commissionsApi = {
  summary: (from?: string, to?: string) => api.get('/commissions/summary', { params: { from, to } }),
  payments: (userId?: string) => api.get('/commissions/payments', { params: { userId } }),
  recordPayment: (data: { userId: string; amount: number; notes?: string; periodFrom: string; periodTo: string }) =>
    api.post('/commissions/payments', data),
  deletePayment: (id: string) => api.delete(`/commissions/payments/${id}`),
};

export const clientPackagesApi = {
  list: (clientId: string) => api.get(`/clients/${clientId}/packages`),
  sell: (clientId: string, data: { packageId: string; sessionsTotal: number; notes?: string; expiresAt?: string }) =>
    api.post(`/clients/${clientId}/packages`, data),
  useSession: (clientId: string, pkgId: string) => api.patch(`/clients/${clientId}/packages/${pkgId}/use`, {}),
  undoSession: (clientId: string, pkgId: string) => api.patch(`/clients/${clientId}/packages/${pkgId}/undo`, {}),
  remove: (clientId: string, pkgId: string) => api.delete(`/clients/${clientId}/packages/${pkgId}`),
};

export const waitlistApi = {
  list: (params?: { date?: string; status?: string }) => api.get('/waitlist', { params }),
  counts: (from: string, to: string) => api.get('/waitlist/counts', { params: { from, to } }),
  patch: (id: string, status: string) => api.patch(`/waitlist/${id}`, { status }),
  delete: (id: string) => api.delete(`/waitlist/${id}`),
};

export const publicApi = {
  business: () => publicAxios.get('/business'),
  availability: (date: string, professionalId?: string | null) => publicAxios.get('/availability', { params: { date, ...(professionalId ? { professionalId } : {}) } }),
  services: () => publicAxios.get('/services'),
  packages: () => publicAxios.get('/packages'),
  getProposal: (token: string) => publicAxios.get(`/proposal/${token}`),
  approveDesign: (token: string, designId: string) => publicAxios.put(`/proposal/${token}/approve`, { designId }),
  book: (data: object) => publicAxios.post('/book', data),
  professionals: () => publicAxios.get('/professionals'),
  history: (token: string) => publicAxios.get('/history', { params: { token } }),
  identify: (phone: string) => publicAxios.post('/identify', { phone }),
  cancelBookingRequest: (id: string) => publicAxios.put(`/booking-requests/${id}/cancel`),
  cancelAppointment: (token: string) => publicAxios.put(`/appointments/${token}/cancel`),
  rateAppointment: (id: string, token: string, rating: number, reviewNote?: string) =>
    publicAxios.post(`/appointments/${id}/rate`, { token, rating, reviewNote }),
  joinWaitlist: (data: { clientName: string; clientPhone: string; date: string; timeSlot?: string; notes?: string }) => {
    const slug = localStorage.getItem('beautyos_biz_slug');
    return axios.create({ baseURL: '/api', timeout: 30000 }).post(`/waitlist/public/slug/${slug}`, data);
  },
};
