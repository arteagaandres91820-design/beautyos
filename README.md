# 💅 BeautyOS — Plataforma SaaS para el Sector Belleza

> La plataforma digital que moderniza salones de belleza, nail studios y barberías en Latinoamérica.
> Su diferencial: **NailAI Studio** — las clientas prueban virtualmente cualquier diseño de uñas en sus propias manos antes de reservar.

---

## 🚀 Inicio rápido (un solo comando)

### Windows (PowerShell)
```powershell
.\start.ps1
```

### macOS / Linux
```bash
chmod +x start.sh && ./start.sh
```

### Manual paso a paso
```bash
# 1. Instalar dependencias
npm install

# 2. Levantar PostgreSQL (requiere Docker)
docker compose up postgres -d

# 3. Configurar base de datos
cd apps/api
npx prisma generate
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts
cd ../..

# 4. Lanzar en desarrollo
npm run dev
```

**URLs disponibles:**
| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| API REST | http://localhost:4000 |
| Health check | http://localhost:4000/health |
| Prisma Studio | `npm run db:studio` → http://localhost:5555 |

**Credenciales de prueba:**
```
Email:    admin@beautyos.co
Password: 123456
```

---

## 🏗️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Base de datos | PostgreSQL 15 + Prisma ORM |
| Auth | JWT + bcrypt |
| IA Try-On | Replicate API (img2img) |
| Imágenes | Cloudinary |
| Estructura | Monorepo (npm workspaces) |

---

## 📦 Módulos

### 1. 👥 Clientes (CRM)
- CRUD completo con búsqueda en tiempo real
- Ficha con foto, cumpleaños, historial de servicios
- Etiqueta automática **VIP** (clientes frecuentes)
- Notas y preferencias

### 2. 🗓️ Agenda
- Vista semanal y diaria
- Crear, editar, reprogramar y cancelar citas
- Detección de conflictos de horario
- Vista por profesional
- Cambio de estados (agendada → confirmada → en curso → completada)

### 3. ✂️ Servicios
- Catálogo por categorías: Cabello, Uñas, Rostro, Barbería, Spa
- Precio en COP, duración en minutos, imagen
- Alimenta la agenda al crear citas

### 4. 💰 Caja
- Registro de cobros vinculados a citas
- Métodos: Efectivo, Tarjeta, Nequi, Daviplata, Transferencia
- Resumen del día por método
- Totales del mes con tendencias

### 5. ✨ NailAI Studio ← módulo estrella
- **40+ diseños** organizados en 10 categorías: Francesas, Acrílicas, Gel, Minimalistas, Elegantes, Bodas, Navidad, Halloween, Corporativos, Tendencias 2026
- **Prueba virtual IA** en 4 pasos: elegir diseño → subir foto de tu mano → IA procesa → slider antes/después
- Guardar favoritos
- Comparar hasta 3 diseños lado a lado
- Panel de tendencias (más guardados)
- Fallback gracioso si Replicate no está configurado

---

## ⚙️ Variables de entorno

Copia `apps/api/.env.example` → `apps/api/.env` y completa:

```env
DATABASE_URL="postgresql://beautyos:beautyos123@localhost:5432/beautyos"
JWT_SECRET="tu_secreto_seguro"

# Cloudinary — subida de imágenes
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

# Replicate — IA prueba virtual de uñas (opcional)
REPLICATE_API_TOKEN=r8_xxx
```

> Sin `REPLICATE_API_TOKEN`, NailAI funciona en modo demo mostrando el diseño de referencia.

---

## 🎨 Diseño

- **Paleta:** Rosa intenso `#C2185B` · Blanco · Grises neutros
- **Tipografía:** Playfair Display (títulos) · Inter (cuerpo)
- **Filosofía:** Mobile first — el 80% del uso es desde celular
- Animaciones suaves, transiciones fluidas, cards con hover

---

## 📊 Datos de prueba (seed)

El seed carga automáticamente:
- **1 negocio:** Nail Studio Valentina — Medellín
- **2 usuarios:** admin + profesional
- **10 clientes** (4 VIP) con historial
- **20 servicios** con precios en COP
- **40 diseños NailAI** en todas las categorías
- **10 citas** con estados variados (incluyendo pagos)

---

## 🐳 Docker (producción)

```bash
# Levantar todo el stack
docker compose up --build

# Solo la base de datos (para desarrollo local)
docker compose up postgres -d
```

---

## 📁 Estructura del proyecto

```
BeautyOS/
├── apps/
│   ├── api/                    # Backend Express + TypeScript
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Esquema de BD
│   │   │   └── seed.ts         # Datos iniciales
│   │   └── src/
│   │       ├── routes/         # auth, clients, appointments, services, cash, nailDesigns
│   │       ├── middleware/     # auth JWT, error handler
│   │       └── lib/            # prisma client singleton
│   └── web/                    # Frontend React + Vite
│       └── src/
│           ├── pages/          # Dashboard, Clients, Agenda, Services, Cash, NailAI
│           ├── components/     # Layout, Sidebar, Modal, Toast
│           ├── contexts/       # AuthContext
│           ├── lib/            # api client, utils
│           └── types/          # TypeScript types
├── docker-compose.yml
├── start.ps1                   # Inicio rápido Windows
└── start.sh                    # Inicio rápido macOS/Linux
```

---

## 💡 Roadmap post-MVP

- [ ] Notificaciones WhatsApp/SMS de recordatorio de cita
- [ ] App móvil con Expo (React Native)
- [ ] Portal público de la clienta para reservar desde el link del negocio
- [ ] Reportes avanzados (servicios más vendidos, horas pico)
- [ ] Catálogo de diseños compartido entre negocios
- [ ] Integración con PSE / Wompi para pagos en línea

---

## 📣 Plan de Marketing y Monetización

### Modelo SaaS — Planes

| Plan | Precio/mes | Límites |
|------|-----------|---------|
| **Starter** | $39.900 COP | 1 profesional, 50 citas/mes, catálogo básico |
| **Pro** | $89.900 COP | 3 profesionales, citas ilimitadas, NailAI |
| **Salon** | $149.900 COP | 10 profesionales, multi-sucursal, soporte prioritario |

### Canales de adquisición

1. **Instagram/TikTok orgánico** — Videos del flujo NailAI en salones reales. El antes/después tiene viral potential.
2. **Grupos de Facebook** — "Emprendedoras de belleza Colombia/México/Perú" — 200k+ miembros.
3. **YouTube Shorts** — Tutorial: "Cómo mostrarle a tu clienta el diseño antes de hacerlo".
4. **Influencers nano** (5k–50k) — Manicuristas con audiencia propia. Modelo de afiliado 30%.
5. **Google Ads** — Keywords: "software salón de belleza", "agenda para nail studio".
6. **Prueba gratuita 14 días** — Sin tarjeta de crédito. Onboarding en menos de 10 minutos.

### KPIs objetivo (Mes 6)

- 500 negocios activos en Colombia + México
- CAC < $15 USD
- Churn mensual < 5%
- MRR objetivo: $15.000 USD
