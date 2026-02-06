# airless-rubyshop

## Local MongoDB (Docker)
1. Start MongoDB:
```bash
docker compose up -d
```

2. Set the backend connection string:
```env
MONGO_URI=mongodb://admin:adminpass@127.0.0.1:27017/airless-db?authSource=admin
```

Notes:
- Edit `backend/.env` (see `backend/.env.example` for a template).
- The backend reads `MONGO_URI` from `backend/.env`.

## Backend Migrations (Only If Using Existing Data)
If you are pointing the backend at an existing database created before the multi-language update, run these one-time migrations. For a fresh database, you can skip this section.

1. Pages → multi-language:
```bash
cd backend
node scripts/migrate-pages-to-multilang.js
```

2. Menu → multi-language:
```bash
cd backend
MONGODB_URI="$MONGO_URI" node scripts/migrate-menu-to-multilang.js
```

Notes:
- The menu migration script reads `MONGODB_URI` (not `MONGO_URI`), so the line above maps it explicitly.
- These scripts update existing documents in place. Back up your database if needed.
