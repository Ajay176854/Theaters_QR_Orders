# Database Setup & Seeding

This directory contains the schema reference and database seed script for the Theater QR Order system.

## Prerequisites
- A running MongoDB instance (local or MongoDB Atlas connection string)
- Node.js 18+

## Seeding the Database
To populate your MongoDB database with demo data (cinema auditorium, admin user, staff user, and 16 realistic concession menu items):

```bash
# From project root or database directory
cd database
node seed.js
```

Or from `backend/`:
```bash
node ../database/seed.js
```

## Seeded Accounts

| Role | Email | Password |
|------|-------|----------|
| **Theater Admin** | `admin@theaterbites.in` | `admin123` |
| **Counter Staff** | `staff@theaterbites.in` | `staff123` |

## Seeded Theater Details
- **Name**: PVR Cinemas - Forum Mall
- **Auditoriums**: 3 Screens
- **Seating**: 6 Rows (A to F) × 12 Seats = 72 seats per screen
- **Default Printer IP**: `192.168.1.100:9100`
- **Auto-Print**: Enabled

