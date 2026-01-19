# BPI Production Deployment Guide

## Pre-Deployment Checklist ✅

All preparation tasks completed:
- ✅ All logos replaced with official `/img/logo.png`
- ✅ Favicon configured
- ✅ Site title and support email retrievable from admin settings
- ✅ User dashboard menu redesigned
- ✅ Email/SMTP configuration added to admin settings
- ✅ Production build successful (no TypeScript/ESLint errors)
- ✅ Non-essential files cleaned up
- ✅ Final pre-production tests passed

## VPS Deployment Steps

### 1. Server Requirements

**Minimum Specifications:**
- Ubuntu 20.04 LTS or newer
- 2+ CPU cores
- 4GB+ RAM
- 40GB+ storage
- Node.js 18.x or 20.x
- PostgreSQL 14+
- PM2 for process management
- Nginx for reverse proxy

### 2. Initial Server Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version

# Install PM2 globally
sudo npm install -g pm2

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install Git
sudo apt install -y git
```

### 3. PostgreSQL Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE bpi_production;
CREATE USER bpi_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE bpi_production TO bpi_user;
\q

# Enable remote connections (if needed)
sudo nano /etc/postgresql/14/main/postgresql.conf
# Uncomment and set: listen_addresses = '*'

sudo nano /etc/postgresql/14/main/pg_hba.conf
# Add: host    all             all             0.0.0.0/0               md5

sudo systemctl restart postgresql
```

### 4. Application Deployment

```bash
# Create application directory
sudo mkdir -p /var/www/bpi
sudo chown -R $USER:$USER /var/www/bpi
cd /var/www/bpi

# Clone the repository
git clone <your-repo-url> .

# Install dependencies
npm install --production

# Create .env.local file
nano .env.local
```

**Required Environment Variables (`.env.local`):**

```env
# Database
DATABASE_URL="postgresql://bpi_user:your_secure_password_here@localhost:5432/bpi_production"

# NextAuth
AUTH_SECRET="<generate-with-openssl-rand-base64-32>"
NEXTAUTH_URL="https://yourdomain.com"

# Admin Credentials
ADMIN_EMAIL="admin@yourdomain.com"
ADMIN_PASSWORD="your_admin_password"

# Payment Gateways
FLUTTERWAVE_PUBLIC_KEY="your_flutterwave_public_key"
FLUTTERWAVE_SECRET_KEY="your_flutterwave_secret_key"

# OAuth Providers (optional)
GITHUB_CLIENT_ID="your_github_client_id"
GITHUB_CLIENT_SECRET="your_github_client_secret"
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# YouTube API (if using)
YOUTUBE_API_KEY="your_youtube_api_key"

# SMTP Email (configure via Admin Settings UI or set here)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="noreply@yourdomain.com"
SMTP_PASSWORD="your_smtp_password"
SMTP_FROM_EMAIL="noreply@yourdomain.com"
SMTP_FROM_NAME="BPI Support"
```

```bash
# Run database migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Seed essential data (optional)
npx tsx scripts/seedCurrencies.ts
npx tsx scripts/seedLeadershipPoolSettings.ts

# Create super admin user
npx tsx scripts/makeSuperAdmin.ts

# Build the application
npm run build
```

### 5. PM2 Process Manager Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'bpi-production',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/bpi',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

```bash
# Create logs directory
mkdir -p /var/www/bpi/logs

# Start application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Run the command it outputs (usually sudo env PATH=...)

# Monitor application
pm2 status
pm2 logs bpi-production
pm2 monit
```

### 6. Nginx Configuration

Create `/etc/nginx/sites-available/bpi`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (will be configured by Certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Proxy settings
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Static files caching
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, immutable";
    }

    # File upload size limit
    client_max_body_size 10M;
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/bpi /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 7. SSL Certificate with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Verify auto-renewal
sudo certbot renew --dry-run

# Certificate will auto-renew via cron
```

### 8. Firewall Configuration

```bash
# Install UFW if not present
sudo apt install -y ufw

# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow PostgreSQL only from localhost (more secure)
# Or if remote access needed:
# sudo ufw allow from <your-ip> to any port 5432

# Enable firewall
sudo ufw enable
sudo ufw status
```

### 9. Post-Deployment Tasks

#### Configure Admin Settings

1. Access admin panel: `https://yourdomain.com/admin/login`
2. Login with super admin credentials
3. Navigate to **Admin → Settings**
4. Configure:
   - **General:** Site title, support email
   - **Integrations → SMTP Email:** Configure email server settings
   - **Features:** Enable/disable EPC-EPP, Solar Assessment, Best Deals
   - **Firebase:** Configure push notifications (if using)

#### Seed Membership Packages

```bash
# Via API endpoint
curl -X POST https://yourdomain.com/api/admin/seed-packages \
  -H "Authorization: Bearer <your-admin-token>"

# Or manually via admin panel:
# Admin → Packages → Create Package
```

#### Database Backup Strategy

```bash
# Create backup script
nano /var/www/bpi/scripts/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/bpi"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="bpi_production"
DB_USER="bpi_user"

mkdir -p $BACKUP_DIR

# Create backup
PGPASSWORD="your_secure_password_here" pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > $BACKUP_DIR/bpi_backup_$DATE.sql.gz

# Keep only last 7 days of backups
find $BACKUP_DIR -name "bpi_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/bpi_backup_$DATE.sql.gz"
```

```bash
# Make executable
chmod +x /var/www/bpi/scripts/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /var/www/bpi/scripts/backup-db.sh
```

### 10. Monitoring & Maintenance

#### PM2 Monitoring

```bash
# View logs
pm2 logs bpi-production --lines 100

# Monitor resources
pm2 monit

# Restart application
pm2 restart bpi-production

# Reload without downtime
pm2 reload bpi-production
```

#### Application Updates

```bash
cd /var/www/bpi

# Pull latest code
git pull origin main

# Install new dependencies
npm install --production

# Run migrations
npx prisma migrate deploy
npx prisma generate

# Rebuild
npm run build

# Reload PM2 (zero-downtime)
pm2 reload bpi-production
```

#### Health Checks

```bash
# Check application status
curl https://yourdomain.com

# Check database connection
PGPASSWORD="your_password" psql -U bpi_user -h localhost -d bpi_production -c "SELECT COUNT(*) FROM \"User\";"

# Check Nginx status
sudo systemctl status nginx

# Check PM2 status
pm2 status
```

### 11. Security Best Practices

1. **Change default passwords** for all admin accounts
2. **Enable 2FA** for admin users (in user settings)
3. **Regular updates**: `sudo apt update && sudo apt upgrade`
4. **Monitor logs** for suspicious activity: `pm2 logs | grep -i error`
5. **Database backups** verified and tested monthly
6. **SSL certificate** auto-renewal configured
7. **Firewall rules** reviewed quarterly
8. **Security headers** verified with securityheaders.com
9. **Environment variables** never committed to Git
10. **API keys** rotated periodically

### 12. Troubleshooting

#### Application won't start

```bash
# Check PM2 logs
pm2 logs bpi-production --err

# Check environment variables
cat /var/www/bpi/.env.local

# Check database connection
PGPASSWORD="password" psql -U bpi_user -h localhost -d bpi_production -c "SELECT 1;"
```

#### Database connection errors

```bash
# Check PostgreSQL service
sudo systemctl status postgresql

# Check connection string in .env.local
# Ensure format: postgresql://user:password@host:port/database
```

#### High memory usage

```bash
# Adjust PM2 max memory restart
pm2 delete bpi-production
# Edit ecosystem.config.js: max_memory_restart: '2G'
pm2 start ecosystem.config.js
pm2 save
```

#### 502 Bad Gateway

```bash
# Check if app is running
pm2 status

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart services
pm2 restart bpi-production
sudo systemctl restart nginx
```

---

## Production Deployment Complete! 🎉

Your BPI application is now live and ready for production use.

**Next Steps:**
1. Test all critical user flows (registration, login, membership activation, payments)
2. Configure SMTP email settings in admin panel
3. Create membership packages
4. Invite beta users
5. Monitor application logs and performance
6. Set up automated backups
7. Configure monitoring alerts (optional: UptimeRobot, StatusCake)

**Support:**
- Technical issues: Check PM2 logs and Nginx error logs
- Database issues: PostgreSQL logs at `/var/log/postgresql/`
- Application errors: PM2 logs at `/var/www/bpi/logs/`
