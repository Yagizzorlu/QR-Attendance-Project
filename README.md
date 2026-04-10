# QR Attendance — QR Kod ile Yoklama Sistemi

Etkinlik, ders veya konferans ortamlarında katılımcı yoklamasını QR kod üzerinden hızlı ve güvenli şekilde almak için geliştirilmiş full-stack web uygulaması.

**Live demo:** https://qr-attendance-project-vercel.vercel.app

---

## Özellikler

- **Admin paneli** — event oluşturma, QR gösterimi, katılımcı yönetimi, attendance listeleme
- **Rotating QR** — HMAC-SHA256 imzalı, her 3 dakikada otomatik yenilenen QR kodlar
- **GPS doğrulama** — Haversine formülü ile etkinlik konumuna mesafe kontrolü
- **İki aşamalı check-in** — kayıtlı katılımcılar otomatik, kayıtsız katılımcılar form ile
- **CSV import** — toplu katılımcı aktarımı
- **Excel export** — attendance listesi `.xlsx` olarak indirilebilir
- **Tam hata senaryoları** — geçersiz/süresi dolmuş QR, event dışı, konum hatası, duplicate

---

## Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Frontend | Next.js 15 (App Router), React, Tailwind CSS |
| Backend | Next.js API Routes (Node.js runtime) |
| Veritabanı | Neon Postgres (Serverless) |
| ORM | Prisma 7 |
| Auth | Custom stateless JWT (`jsonwebtoken`), httpOnly cookie |
| QR İmzalama | HMAC-SHA256 (`crypto`) |
| GPS | `navigator.geolocation` + Haversine (sunucu tarafı) |
| Deploy | Vercel |

---

## Mimari

5 katmanlı yapı — her katman yalnızca bir altı/üstüyle konuşur:

```
Presentation (pages)
    ↕
API Routes (route handlers)
    ↕
Services (iş kuralları)
    ↕
Repositories (Prisma sorguları)
    ↕
Database (Neon Postgres)
```

Yardımcı hesaplamalar `src/lib/` altında katman atlamadan kullanılır:
`lib/qr/` — slot hesaplama, HMAC imzalama
`lib/geo/` — Haversine mesafe
`lib/auth/` — JWT sign/verify, bcrypt
`lib/excel/` — xlsx workbook oluşturma
`lib/csv/` — CSV ayrıştırma

---

## QR Yenileme Yaklaşımı

```
slot_start = floor(now / rotationSeconds) * rotationSeconds
slot_end   = slot_start + rotationSeconds
sig        = HMAC_SHA256(eventId + "|" + slot_start.toISOString(), QR_SECRET)
qrValue    = APP_URL/check-in?eventId=...&slot=...&sig=...
```

- Sunucu zamanını temel alır; istemci saatinden bağımsız
- Slot sınırında tüm katılımcılar aynı anda yeni QR okumak zorunda — replay saldırısı engellenir
- Admin sayfasında countdown timer ile QR otomatik yenilenir

---

## Konum Doğrulama

1. Katılımcı cihazından `navigator.geolocation` ile koordinat alınır
2. Koordinatlar sunucuya gönderilir
3. Sunucu Haversine formülüyle `distanceMeters` hesaplar
4. `distanceMeters <= event.allowedRadiusMeters` kontrolü yapılır
5. Gerçek mesafe `Attendance` kaydına yazılır (Excel export'ta görünür)

---

## Kurulum

### Gereksinimler

- Node.js 18+
- Neon Postgres hesabı

### Adımlar

```bash
# 1. Bağımlılıkları yükle
npm install

# 2. Ortam değişkenlerini ayarla
# .env dosyasını oluştur (aşağıya bakın)

# 3. Veritabanı migration
npx prisma migrate deploy

# 4. Admin kullanıcısı oluştur (ilk kurulumda bir kez)
npm run seed

# 5. Geliştirme sunucusu
npm run dev
```

### Ortam Değişkenleri

```env
DATABASE_URL=       # Neon pooled connection string
DIRECT_URL=         # Neon direct connection (migration için)
SESSION_SECRET=     # En az 32 karakter, JWT imzalama
QR_SECRET=          # En az 32 karakter, QR HMAC imzalama
ADMIN_EMAIL=        # Admin e-posta adresi
ADMIN_PASSWORD=     # Admin şifre
APP_URL=            # Deploy URL (ör. https://your-app.vercel.app)
```

---

## Vercel Deploy

1. GitHub reposunu Vercel'e bağla
2. Yukarıdaki 7 ortam değişkenini Vercel dashboard > Settings > Environment Variables'a ekle
3. Build command otomatik olarak çalışır: `prisma generate && prisma migrate deploy && next build`
4. İlk deploy sonrası admin seed için Neon SQL Editor veya local `npm run seed` (DIRECT_URL ile)

---

## API Özeti

```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/events                                       (auth)
POST   /api/events                                       (auth)
GET    /api/events/:id/live-qr                           (auth)
GET    /api/events/:id/participants                       (auth)
POST   /api/events/:id/participants                       (auth)
POST   /api/events/:id/participants/import               (auth)
PATCH  /api/events/:id/participants/:pid/attendance-mark  (auth)
GET    /api/events/:id/attendance                        (auth)
GET    /api/events/:id/attendance/export                 (auth)

POST   /api/check-in/validate                (public)
POST   /api/check-in/resolve-participant     (public)
POST   /api/check-in/complete               (public)
POST   /api/check-in/register               (public)
```

---

## CSV Formatı

```csv
firstName,lastName,email,phone
Ahmet,Yılmaz,ahmet@example.com,05551234567
Zeynep,Kaya,,05559876543
```

- `firstName` ve `lastName` zorunlu
- `email` veya `phone`'dan en az biri olmalı
- Başlık satırı zorunlu
- Zaten kayıtlı katılımcılar sessizce atlanır
