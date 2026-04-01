#!/bin/bash
# BPI Production Deploy Script
# Usage: bash scripts/deploy.sh
set -e

APP_DIR="/var/www/apps/bpi_main"
cd "$APP_DIR"

echo "=== BPI Deploy ==="

echo "1. Loading environment variables..."
if [ -f .env ]; then
  set -a
  . .env
  set +a
  echo "   Loaded .env"
elif [ -f .env.production ]; then
  set -a
  . .env.production
  set +a
  echo "   Loaded .env.production"
else
  echo "   WARNING: No .env file found — ensure env vars are set"
fi

echo "2. Pulling latest code..."
git pull origin main

echo "3. Installing dependencies..."
npm install --production=false

echo "4. Building..."
npm run build

echo "5. Copying static assets to standalone..."
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static

echo "6. Stopping existing PM2 processes..."
pm2 delete beepagro-v3 2>/dev/null || true
# Kill anything still on port 3000
sudo fuser -k 3000/tcp 2>/dev/null || true
sleep 1

echo "7. Starting server..."
pm2 start .next/standalone/server.js --name beepagro-v3 --cwd "$APP_DIR"
pm2 save

echo "8. Verifying..."
sleep 3
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$HTTP_CODE" = "200" ]; then
  echo "✓ Server is responding with HTTP $HTTP_CODE"
else
  echo "✗ Server returned HTTP $HTTP_CODE — check pm2 logs beepagro-v3"
  pm2 logs beepagro-v3 --lines 10 --nostream
  exit 1
fi

echo "=== Deploy complete ==="
