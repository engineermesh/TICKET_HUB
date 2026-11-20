# TicketHub – Sports Ticket Platform Starter

A beginner-friendly Node.js, Express and PostgreSQL starter for a Kenyan sports ticketing platform.

## Requirements
- Node.js LTS
- PostgreSQL
- VS Code

## Setup
1. Create a PostgreSQL database named `tickethub_db`.
2. Open the database in pgAdmin Query Tool or `psql`.
3. Run the contents of `database/schema.sql`.
4. Copy `.env.example` to `.env`.
5. Put your local PostgreSQL password in `DATABASE_URL`.
6. Set a long random `JWT_SECRET`.
7. In the project terminal run:
   ```bash
   npm install
   npm run dev
   ```
8. Open http://localhost:3000
9. Test the API/database connection at http://localhost:3000/api/health
10. Register a customer at http://localhost:3000/register.html

## Important limitations
- This is a development starter, not a production-ready ticket marketplace.
- The M-Pesa Daraja STK Push and callback are intentionally not implemented. The API returns a clear not-configured response rather than pretending a payment succeeded.
- Do not manually mark payments as paid. Complete and test official Daraja sandbox integration and callback verification before issuing live tickets.
- Event creation is available through the protected API to admin/organizer accounts. Create the first administrator securely using a controlled database procedure; do not make public admin registration available.
- Ticket inventory reservation needs an expiry/release worker before public launch.
- Add CSRF strategy if switching authentication to cookies, audit logging, account recovery, email/phone verification, privacy notices, backups, monitoring, and production security review before launch.

## First admin account
Register a normal account through the website. Then, using pgAdmin as the database owner, promote that specific account:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your-admin-email@example.com';
```
Use an email address you control and remove this example instruction from public documentation after setup.

## M-Pesa
Use Safaricom's official Daraja developer portal to obtain authorized sandbox credentials. Store secrets only in `.env`, never in frontend JavaScript or GitHub. Verify callbacks and reconcile transactions before issuing tickets.
