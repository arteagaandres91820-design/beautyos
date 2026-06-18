import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function dateOffset(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d;
}
function iso(d: Date) { return d.toISOString().slice(0, 10); }

async function main() {
  console.log('🌱  Seeding BeautyOS...');

  // ── Business ──────────────────────────────────────────────────────────
  const biz = await prisma.business.upsert({
    where: { email: 'admin@beautyos.co' },
    update: {},
    create: {
      name: 'Nail Studio Valentina',
      city: 'Medellín',
      email: 'admin@beautyos.co',
      phone: '+57 300 123 4567',
      whatsapp: '+573001234567',
      address: 'El Poblado, Cra 43A #7-50',
    },
  });

  // ── Users ─────────────────────────────────────────────────────────────
  const pw = await bcrypt.hash('123456', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@beautyos.co' },
    update: {},
    create: { email: 'admin@beautyos.co', password: pw, name: 'Valentina Ríos', role: 'ADMIN', businessId: biz.id },
  });
  const pro = await prisma.user.upsert({
    where: { email: 'pro@beautyos.co' },
    update: {},
    create: { email: 'pro@beautyos.co', password: pw, name: 'Camila Torres', role: 'PROFESSIONAL', businessId: biz.id },
  });
  console.log('✅  Users: admin@beautyos.co / pro@beautyos.co (password: 123456)');

  // ── Services ──────────────────────────────────────────────────────────
  const svcDefs = [
    { name: 'Manicure clásica',      category: 'NAILS', price: 25000,  duration: 45  },
    { name: 'Manicure en gel',        category: 'NAILS', price: 55000,  duration: 60  },
    { name: 'Uñas acrílicas',         category: 'NAILS', price: 90000,  duration: 90  },
    { name: 'Nail art (diseño)',       category: 'NAILS', price: 15000,  duration: 30  },
    { name: 'Pedicure spa',           category: 'NAILS', price: 45000,  duration: 60  },
    { name: 'Retoque de gel',         category: 'NAILS', price: 35000,  duration: 45  },
    { name: 'Corte de cabello',       category: 'HAIR',  price: 30000,  duration: 45  },
    { name: 'Tinte + mechas',         category: 'HAIR',  price: 120000, duration: 150 },
    { name: 'Limpieza facial básica', category: 'FACE',  price: 50000,  duration: 60  },
  ];
  const svcMap: Record<string, string> = {};
  for (const s of svcDefs) {
    const existing = await prisma.service.findFirst({ where: { name: s.name, businessId: biz.id } });
    const svc = existing ?? await prisma.service.create({ data: { ...s, businessId: biz.id } as any });
    svcMap[s.name] = svc.id;
  }
  console.log(`✅  ${svcDefs.length} services`);

  // ── Clients ───────────────────────────────────────────────────────────
  const clientDefs = [
    { name: 'Sofía Hernández',  phone: '3001234567', email: 'sofia@demo.co',   isVip: true,  visitCount: 12, notes: 'Diseños florales y pasteles' },
    { name: 'María García',     phone: '3109876543', email: 'maria@demo.co',   isVip: true,  visitCount: 8,  notes: 'Alérgica al acrílico, solo gel' },
    { name: 'Daniela López',    phone: '3204567890', email: 'daniela@demo.co', isVip: false, visitCount: 5,  notes: 'Prefiere citas los sábados' },
    { name: 'Juliana Martínez', phone: '3156789012', email: 'juliana@demo.co', isVip: false, visitCount: 3,  notes: '' },
    { name: 'Andrea Rodríguez', phone: '3182345678', email: 'andrea@demo.co',  isVip: false, visitCount: 1,  notes: 'Nueva clienta' },
    { name: 'Valentina Castro', phone: '3013456789', email: 'vcastle@demo.co', isVip: true,  visitCount: 15, notes: 'Paga anticipado' },
    { name: 'Isabella Torres',  phone: '3012345678', email: undefined,         isVip: false, visitCount: 2,  notes: '' },
    { name: 'Camila Vargas',    phone: '3123456789', email: 'camila@demo.co',  isVip: false, visitCount: 4,  notes: 'Le gustan los chrome nails' },
  ];
  const clientMap: Record<string, string> = {};
  for (const c of clientDefs) {
    const existing = await prisma.client.findFirst({ where: { phone: c.phone, businessId: biz.id } });
    const cl = existing ?? await prisma.client.create({ data: { ...c, businessId: biz.id } as any });
    clientMap[c.name] = cl.id;
  }
  console.log(`✅  ${clientDefs.length} clients`);

  // ── Appointments ──────────────────────────────────────────────────────
  const apptDefs = [
    { client: 'Sofía Hernández',  date: dateOffset(0),  start: '09:00', end: '10:00', status: 'CONFIRMED',  svc: 'Manicure en gel',   prof: admin.id },
    { client: 'María García',     date: dateOffset(0),  start: '10:30', end: '12:00', status: 'SCHEDULED',  svc: 'Uñas acrílicas',    prof: pro.id   },
    { client: 'Daniela López',    date: dateOffset(0),  start: '14:00', end: '14:45', status: 'COMPLETED',  svc: 'Manicure clásica',  prof: admin.id },
    { client: 'Juliana Martínez', date: dateOffset(1),  start: '09:30', end: '10:30', status: 'SCHEDULED',  svc: 'Pedicure spa',      prof: admin.id },
    { client: 'Andrea Rodríguez', date: dateOffset(1),  start: '11:00', end: '12:00', status: 'CONFIRMED',  svc: 'Manicure en gel',   prof: pro.id   },
    { client: 'Valentina Castro', date: dateOffset(2),  start: '09:00', end: '10:30', status: 'SCHEDULED',  svc: 'Uñas acrílicas',    prof: admin.id },
    { client: 'Isabella Torres',  date: dateOffset(3),  start: '15:00', end: '15:45', status: 'SCHEDULED',  svc: 'Retoque de gel',    prof: pro.id   },
    { client: 'Camila Vargas',    date: dateOffset(-1), start: '10:00', end: '10:30', status: 'COMPLETED',  svc: 'Nail art (diseño)', prof: admin.id },
    { client: 'Sofía Hernández',  date: dateOffset(-3), start: '09:00', end: '09:45', status: 'COMPLETED',  svc: 'Manicure clásica',  prof: admin.id },
    { client: 'María García',     date: dateOffset(-5), start: '14:00', end: '15:30', status: 'COMPLETED',  svc: 'Uñas acrílicas',    prof: pro.id   },
    { client: 'Valentina Castro', date: dateOffset(-7), start: '10:00', end: '11:00', status: 'COMPLETED',  svc: 'Manicure en gel',   prof: admin.id },
    { client: 'Daniela López',    date: dateOffset(-2), start: '15:00', end: '15:30', status: 'NO_SHOW',    svc: 'Nail art (diseño)', prof: admin.id },
  ];

  const methods = ['CASH', 'NEQUI', 'CARD', 'CASH', 'CASH'];
  for (const a of apptDefs) {
    const svcId = svcMap[a.svc];
    const clientId = clientMap[a.client];
    if (!svcId || !clientId) continue;
    const existing = await prisma.appointment.findFirst({
      where: { clientId, date: a.date, startTime: a.start, businessId: biz.id },
    });
    if (existing) continue;

    const svc = await prisma.service.findUnique({ where: { id: svcId } });
    const appt = await prisma.appointment.create({
      data: {
        clientId, professionalId: a.prof, businessId: biz.id,
        date: a.date, startTime: a.start, endTime: a.end,
        status: a.status, totalPrice: svc!.price,
        services: { create: [{ serviceId: svcId, price: svc!.price }] },
      },
    });

    if (a.status === 'COMPLETED') {
      await prisma.payment.create({
        data: {
          appointmentId: appt.id, businessId: biz.id,
          amount: svc!.price,
          method: methods[Math.floor(Math.random() * methods.length)],
        },
      }).catch(() => {});
    }
  }
  console.log(`✅  ${apptDefs.length} appointments`);

  // ── Nail Designs ──────────────────────────────────────────────────────
  const PLACEHOLDER = 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80';
  const nailDefs = [
    { name: 'French Clásico',         category: 'FRENCH',      price: 55000, duration: 60, saveCount: 142, tags: ['french','clásico','blanco'],            description: 'El clásico que nunca pasa de moda' },
    { name: 'Rosé Gold Chrome',       category: 'CHROME',      price: 65000, duration: 75, saveCount: 98,  tags: ['chrome','rosado','espejo'],             description: 'Acabado espejo en tono rosado dorado' },
    { name: 'Floral Primavera',       category: 'FLORAL',      price: 70000, duration: 90, saveCount: 87,  tags: ['flores','primavera','3D'],              description: 'Diseño floral en relieve con gel' },
    { name: 'Ombre Sunset',           category: 'GRADIENT',    price: 60000, duration: 75, saveCount: 76,  tags: ['ombre','degradado','naranja','rosa'],   description: 'Degradado en tonos sunset' },
    { name: 'Nude Minimalista',       category: 'MINIMALIST',  price: 50000, duration: 60, saveCount: 134, tags: ['nude','minimal','elegante'],            description: 'Elegancia en su versión más simple' },
    { name: 'Glitter Holográfico',    category: 'GLITTER',     price: 60000, duration: 70, saveCount: 65,  tags: ['glitter','holográfico','brillante'],    description: 'Glitter holográfico multicolor' },
    { name: 'Novia Perlas',           category: 'WEDDING',     price: 85000, duration: 90, saveCount: 112, tags: ['novia','perlas','blanco','elegante'],   description: 'Perfecto para el día más especial' },
    { name: 'Pastel Baby Blue',       category: 'PASTEL',      price: 55000, duration: 65, saveCount: 89,  tags: ['pastel','azul','baby','suave'],         description: 'Tono baby blue con acabado satinado' },
    { name: 'Aurora 2026',            category: 'TRENDS_2026', price: 75000, duration: 80, saveCount: 203, tags: ['2026','aurora','iridiscente','tendencia'], description: 'La tendencia del año: efecto aurora boreal' },
    { name: 'Geométrico Moderno',     category: 'GEOMETRIC',   price: 65000, duration: 75, saveCount: 58,  tags: ['geométrico','líneas','moderno'],        description: 'Líneas y formas con precisión milimétrica' },
    { name: 'Acuarela Artística',     category: 'ARTISTIC',    price: 80000, duration: 90, saveCount: 72,  tags: ['acuarela','arte','colorido'],           description: 'Inspirado en pintura de acuarela' },
    { name: 'Summer Vibes',           category: 'SUMMER',      price: 60000, duration: 70, saveCount: 81,  tags: ['verano','tropical','colores'],          description: 'Colores vibrantes de verano' },
    { name: 'Valentín Hearts',        category: 'VALENTINES',  price: 65000, duration: 75, saveCount: 45,  tags: ['corazones','rojo','amor'],              description: 'Corazones y detalles en rojo y rosa' },
    { name: 'French de Colores',      category: 'FRENCH',      price: 60000, duration: 70, saveCount: 93,  tags: ['french','moderno','colores'],           description: 'French con punta de colores pastel' },
    { name: 'Elegant Black Gold',     category: 'ELEGANT',     price: 60000, duration: 70, saveCount: 119, tags: ['negro','dorado','elegante'],            description: 'Negro mate con detalles dorados' },
    { name: 'Birthday Confetti',      category: 'BIRTHDAY',    price: 65000, duration: 75, saveCount: 54,  tags: ['cumpleaños','confetti','colores'],       description: 'Celebra con diseños de confetti' },
    { name: 'Navidad Rojo y Verde',   category: 'CHRISTMAS',   price: 65000, duration: 75, saveCount: 38,  tags: ['navidad','rojo','verde','festivo'],     description: 'Espíritu navideño en tus manos' },
    { name: 'Spider Web Halloween',   category: 'HALLOWEEN',   price: 65000, duration: 80, saveCount: 29,  tags: ['halloween','araña','negro','naranja'],  description: 'Diseño terrorífico para Halloween' },
    { name: 'Corporativo Nude',       category: 'CORPORATE',   price: 50000, duration: 60, saveCount: 67,  tags: ['corporativo','nude','formal'],          description: 'Discreta elegancia para el trabajo' },
    { name: 'Gel Transparente',       category: 'GEL',         price: 55000, duration: 65, saveCount: 88,  tags: ['gel','transparente','natural'],         description: 'Gel neutro de larga duración' },
    { name: 'Acrílico Rosa Milky',    category: 'ACRYLIC',     price: 90000, duration: 90, saveCount: 76,  tags: ['acrílico','rosa','milky','largo'],       description: 'Uñas largas acrílicas en rosa milky' },
  ];

  let added = 0;
  for (const n of nailDefs) {
    const existing = await prisma.nailDesign.findFirst({ where: { name: n.name, businessId: biz.id } });
    if (!existing) {
      await prisma.nailDesign.create({
        data: { ...n, tags: JSON.stringify(n.tags), imageUrl: PLACEHOLDER, businessId: biz.id } as any,
      });
      added++;
    }
  }
  console.log(`✅  ${added} nail designs added (${nailDefs.length - added} already existed)`);

  // ── Booking requests ──────────────────────────────────────────────────
  const reqDefs = [
    { clientName: 'Laura Pérez',   clientPhone: '3001112233', date: iso(dateOffset(2)), timeSlot: '10:00', notes: 'Primera vez, quiero manicure en gel' },
    { clientName: 'Ana Mendoza',   clientPhone: '3109998877', date: iso(dateOffset(3)), timeSlot: '14:30', notes: 'Me recomendaron las uñas acrílicas' },
    { clientName: 'Paola Jiménez', clientPhone: '3206665544', date: iso(dateOffset(4)), timeSlot: '09:00', notes: '' },
  ];
  for (const r of reqDefs) {
    const existing = await prisma.bookingRequest.findFirst({ where: { clientPhone: r.clientPhone, businessId: biz.id } });
    if (!existing) await prisma.bookingRequest.create({ data: { ...r, businessId: biz.id, status: 'PENDING' } });
  }
  console.log(`✅  ${reqDefs.length} booking requests`);

  console.log('\n🎉  Done!');
  console.log('─────────────────────────────────────────');
  console.log('  Admin:   admin@beautyos.co / 123456');
  console.log('  Pro:     pro@beautyos.co   / 123456');
  console.log('─────────────────────────────────────────');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
