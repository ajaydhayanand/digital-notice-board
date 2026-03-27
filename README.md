# Digital Notice Board

Digital Notice Board is a premium full-stack notice management platform built for campuses, hackathons, and placement-ready demos. It includes JWT authentication, admin/user role separation, scheduled publishing, bookmarks, read tracking, a modern animated React UI, and a MongoDB-backed Express API.

## Tech Stack

- Frontend: React, Tailwind CSS, Framer Motion
- Backend: Node.js, Express
- Database: MongoDB Atlas or local MongoDB with Mongoose
- Auth: JWT
- File uploads: Multer
- Scheduling: node-cron
- Deployment targets: Vercel (frontend), Render/Railway (backend), MongoDB Atlas (database)

## Demo Credentials

- Admin
  - `username`: `admin`
  - `password`: `admin123`
- User
  - `username`: `student`
  - `password`: `student123`

These users are auto-seeded on backend startup.

## Folder Structure

- `client/` React application
- `server/` Express + MongoDB API

## Local Setup

1. Install dependencies from the project root:

```bash
npm install
```

2. Create environment files:

- Copy `server/.env.example` to `server/.env`
- Copy `client/.env.example` to `client/.env`

3. Update the values:

- `server/.env`
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `CLIENT_ORIGIN`
- `client/.env`
  - `REACT_APP_API_URL`
  - `REACT_APP_BACKEND_ORIGIN`

4. Run the full stack from the root:

```bash
npm run dev
```

5. Open:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

## Production Deployment

### Backend on Render or Railway

Use the `server/` directory as the service root.

- Build command: `npm install`
- Start command: `npm start`
- Required environment variables:
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `CLIENT_ORIGIN`
  - `PORT`

### Frontend on Vercel

Use the `client/` directory as the project root.

- Build command: `npm run build`
- Output directory: `build`
- Required environment variables:
  - `REACT_APP_API_URL=https://your-backend-domain/api`
  - `REACT_APP_BACKEND_ORIGIN=https://your-backend-domain`

### MongoDB Atlas

- Create a cluster
- Add your backend host IP to network access
- Create a database user
- Paste the Atlas connection string into `MONGODB_URI`

## Features

- JWT login with Admin and User roles
- Admin notice CRUD
- Scheduled publishing with automatic activation
- Important notices with glow animation
- Attachment uploads for PDFs and images
- Read and unread tracking
- Bookmark or favorite notices
- Search, filters, and pagination
- New notice badge
- Toast notifications
- Loading skeletons
- Responsive sidebar layout
- Dark and light theme toggle

## GitHub Workflow

After local verification, run:

```bash
git add .
git commit -m "Build production-ready digital notice board"
git remote add origin <your-github-repo-url>
git push -u origin main
```

## Notes

- Live deployment URLs depend on your Vercel, Render/Railway, and GitHub accounts, so they must be created with your credentials.
- The backend seeds the required users automatically if they do not already exist.
