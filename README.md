# Secure Alert Backend

This folder contains the backend API service for the Secure Alert system.

## Run locally

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` to your PostgreSQL database.
3. Set `JWT_SECRET` to a secure secret.
4. Run `npm install`.
5. Run `npm run dev`.

## Notes

- The backend serves the API routes under `/api/...`.
- The frontend should point to this backend using `NEXT_PUBLIC_API_BASE_URL`.
