import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { prisma } from './lib/prisma';
import { generateSlug } from './routes/auth';

import path from 'path';
import { uploadsDir } from './lib/upload';
import authRoutes from './routes/auth';
import clientRoutes from './routes/clients';
import appointmentRoutes from './routes/appointments';
import serviceRoutes from './routes/services';
import cashRoutes from './routes/cash';
import nailDesignRoutes from './routes/nailDesigns';
import dashboardRoutes from './routes/dashboard';
import publicRoutes from './routes/public';
import staffRoutes from './routes/staff';
import reportsRoutes from './routes/reports';
import expenseRoutes from './routes/expenses';
import inventoryRoutes from './routes/inventory';
import timeBlockRoutes from './routes/timeBlocks';
import packageRoutes from './routes/packages';
import giftCardRoutes from './routes/giftCards';
import waitlistRoutes from './routes/waitlist';
import promoCodeRoutes from './routes/promoCodes';
import commissionRoutes from './routes/commissions';
import clientNoteRoutes from './routes/clientNotes';
import clientPackageRoutes from './routes/clientPackages';
import { errorHandler, notFound } from './middleware/error';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet({ crossOriginResourcePolicy: false }));
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true, legacyHeaders: false });
app.use('/api', limiter);

app.use('/uploads', express.static(uploadsDir));
app.get('/health', (_req, res) => res.json({ status: 'ok', version: '1.0.0', service: 'BeautyOS API', designs: 'expanded' }));

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/cash', cashRoutes);
app.use('/api/nail-designs', nailDesignRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/time-blocks', timeBlockRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/gift-cards', giftCardRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/promo-codes', promoCodeRoutes);
app.use('/api/commissions', commissionRoutes);
app.use('/api/clients', clientNoteRoutes);
app.use('/api/clients', clientPackageRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, async () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║    💅 BeautyOS API v1.0.0           ║
  ║    Running on port ${PORT}              ║
  ╚══════════════════════════════════════╝
  `);

  // Backfill slugs for existing businesses that have none
  const noSlug = await prisma.business.findMany({ where: { slug: '' } });
  for (const biz of noSlug) {
    const base = generateSlug(biz.name) || biz.id.slice(-8);
    const taken = await prisma.business.findFirst({ where: { slug: base, NOT: { id: biz.id } } });
    const slug = taken ? `${base}-${biz.id.slice(-4)}` : base;
    await prisma.business.update({ where: { id: biz.id }, data: { slug } });
    console.log(`  [slug] Backfilled "${biz.name}" → "${slug}"`);
  }
});

export default app;
