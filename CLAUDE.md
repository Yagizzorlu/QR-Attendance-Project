# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

QR tabanlı yoklama sistemi. Admin etkinlik oluşturur, QR kodu gösterir; katılımcılar mobil cihazla QR okutarak GPS doğrulamalı check-in yapar. Full-stack Next.js, Prisma + Neon Postgres, Vercel deploy.

---

## Commands

```bash
# Geliştirme
npm run dev

# Build (production — prisma generate + migrate deploy + next build)
npm run build

# Lint
npm run lint

# DB migration (dev)
npx prisma migrate dev --name <migration_name>

# DB migration (prod)
npx prisma migrate deploy

# Admin seed (yalnızca ilk kurulumda)
npx prisma db seed
```

**Ortam değişkenleri** (`.env.local`):
```
DATABASE_URL       # Neon pooled connection string
DIRECT_URL         # Neon direct connection (migrate için)
SESSION_SECRET     # 32+ karakter, cookie imzalama
QR_SECRET          # 32+ karakter, QR HMAC imzalama
ADMIN_SEED_EMAIL
ADMIN_SEED_PASSWORD
```

---

## Architecture

### Katman Yapısı

Her katman yalnızca bir alt veya üst katmanla konuşur; atlama yasak.

| Katman | Klasör | Sorumluluk |
|---|---|---|
| Presentation | `src/app/` | Sayfalar, route handler'lar |
| API | `src/app/api/` | Request parse, auth guard, Zod validate, service çağır |
| Service | `src/server/services/` | İş kuralları, repository orchestration |
| Repository | `src/server/repositories/` | Sadece Prisma sorguları |
| Lib | `src/lib/` | Teknik hesaplamalar (QR, geo, csv, excel, auth) |

### Klasör Yapısı

```
src/
├── app/
│   ├── (public)/check-in/     # Katılımcı check-in akışı (auth dışı)
│   ├── (auth)/login/          # Admin girişi
│   ├── (admin)/admin/         # Admin paneli (session zorunlu)
│   └── api/                   # Route handlers
│
├── components/
│   ├── ui/
│   ├── forms/
│   ├── qr/
│   └── attendance/
│
├── features/                  # Feature-based organization
│   ├── auth/
│   ├── events/
│   ├── participants/
│   ├── attendance/
│   └── checkin/
│
├── lib/
│   ├── auth/        # session, password, guards
│   ├── db/          # prisma client (singleton)
│   ├── qr/          # slot hesaplama, signer, generator, validator
│   ├── geo/         # haversine, validate-distance
│   ├── csv/         # parse-participants
│   ├── excel/       # export-attendance
│   └── http/        # api-response helper, error sınıfları
│
├── server/
│   ├── repositories/
│   ├── services/
│   ├── policies/
│   └── dto/
│
└── prisma/
    ├── schema.prisma
    └── seed.ts
```

---

## API Endpoints

### Auth
```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
```

### Events (protected)
```
GET    /api/events
POST   /api/events
GET    /api/events/:eventId
PATCH  /api/events/:eventId
```

### QR (protected)
```
GET    /api/events/:eventId/live-qr
→ { eventId, slot, expiresAt, checkInUrl, qrDataUrl }
```

### Participants (protected)
```
GET    /api/events/:eventId/participants
POST   /api/events/:eventId/participants
POST   /api/events/:eventId/participants/import          (CSV)
PATCH  /api/events/:eventId/participants/:id/attendance-mark
```

### Check-in (public — katılımcılar oturum açmaz)
```
POST   /api/check-in/validate             (QR + GPS kontrolü)
POST   /api/check-in/resolve-participant  (e-posta/telefon eşleştirme)
POST   /api/check-in/complete             (Attendance yaz)
```

### Attendance (protected)
```
GET    /api/events/:eventId/attendance
GET    /api/events/:eventId/attendance/export   (Excel)
```

### Standart response formatı
```json
{ "success": true, "data": { ... } }
{ "success": false, "code": "QR_EXPIRED", "message": "..." }
```

---

## Key Technical Decisions

### Auth
- NextAuth kullanılmıyor. `jose` veya `jsonwebtoken` ile custom stateless session.
- Cookie: `httpOnly; Secure; SameSite=Strict`
- `src/middleware.ts` tüm `/admin/*` ve `/api/events/*` rotalarını korur.
- `/api/check-in/*` bilinçli olarak public tutulmuştur.

### QR Sistemi
QR payload: `{ eventId, slot, sig }` — HMAC_SHA256(`eventId|slot|QR_SECRET`)

Doğrulama sırası:
1. Event mevcut mu?
2. Slot zaman penceresi içinde mi? (`qrRotationSeconds` event'e özel)
3. Signature doğru mu?
4. Event zaman aralığında mı?
5. GPS doğrulaması

### GPS Doğrulama
- Browser `navigator.geolocation` → koordinat backend'e gönderilir
- Backend Haversine formülü ile `distanceMeters` hesaplar
- `distanceMeters <= allowedRadiusMeters` → geçerli

### Check-in Akışı (2 aşama)
1. QR + GPS doğrulanır
2. E-posta veya telefon istenir → EventParticipant aranır → bulunursa Attendance oluştur; bulunamazsa form göster, yeni Participant oluştur

### Veri Modeli Kritik Notlar
- `EventParticipant` ≠ `Attendance`. EventParticipant ön kayıt, Attendance gerçek check-in.
- Sadece başarılı check-in'ler `Attendance` tablosuna yazılır. Reddedilen denemeler persist edilmez.
- `Attendance(eventId, participantId)` unique constraint — tekrar yoklama DB'de de engellenir.
- Admin tek kişi, `seed.ts` ile oluşturulur. Kayıt akışı yoktur.

---

## Hata Kodları

| Kod | Durum |
|---|---|
| `INVALID_QR` | Geçersiz QR |
| `QR_EXPIRED` | Süresi dolmuş QR |
| `EVENT_NOT_FOUND` | Etkinlik bulunamadı |
| `LOCATION_UNAVAILABLE` | Konum alınamadı |
| `OUT_OF_RANGE` | Mesafe dışı |
| `DUPLICATE_ATTENDANCE` | Tekrar yoklama |
| `UNAUTHORIZED` | Yetkisiz erişim |
| `CSV_PARSE_ERROR` | CSV bozuk |

---

## UI Tasarım Kuralları

### Admin Paneli
- Dark mode default: arka plan `#0f172a`, aksan `#3b82f6`
- Font: Geist veya IBM Plex Mono (Inter/Roboto değil)
- Kart değil tablo/list view; border-based, flat UI
- Sidebar layout (masaüstü); mobilde drawer

### Check-in Arayüzü
- Mobile-first, tek sütun, dikey akış
- Butonlar minimum `48px` yükseklik
- Modal yok — her adım kendi sayfasında
- Açık arka plan `#f8fafc`; başarı `#16a34a`, hata `#dc2626`
- Her hata tam ekran sayfası olarak gösterilir

### Kaçınılacaklar
- Mor-mavi gradient, glassmorphism, `rounded-2xl` + `shadow-xl` her yerde
- `animate-bounce` / `animate-pulse` ile doldurulan boşluklar
- Gereksiz skeleton loader

---

## Prisma + Neon Notu

`schema.prisma`'da iki URL zorunludur:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // pooled — runtime
  directUrl = env("DIRECT_URL")     // direct — migrate
}
```

`package.json` build script'i:
```json
"build": "prisma generate && prisma migrate deploy && next build"
```
