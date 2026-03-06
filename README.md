# Digital Notice Board

Full-stack web app for publishing and viewing institutional notices.

## Stack
- Frontend: React + TailwindCSS
- Backend: Node.js + Express
- Database: MySQL
- Auth: JWT (admin-protected write APIs)

## Project Structure
- `client/` React frontend
- `server/` Express API + MySQL queries
- `server/sql/schema.sql` database bootstrap script

## Setup
### 1) Database
Run the SQL script:

```sql
SOURCE server/sql/schema.sql;
```

This creates:
- `admins` table
- `notices` table
- indexes + default admin seed (`admin` / `admin123`)

### 2) Backend
```bash
cd server
npm install
```

Create `.env` from `.env.example` and update values:
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET`

Run backend:
```bash
npm run dev
```

API base URL: `http://localhost:5000/api`

### 3) Frontend
```bash
cd client
npm install
npm start
```

Frontend URL: `http://localhost:3000`

## Core Features
- Admin login (JWT)
- Notice CRUD (admin)
- Public notice listing/details
- Search + category filtering + pagination
- Responsive UI (mobile + desktop)
- Loaders and toast notifications

