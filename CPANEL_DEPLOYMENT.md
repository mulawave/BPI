# BPI Deployment to cPanel (beepagro.com)

## Server Details
- **IP:** 66.29.149.90
- **Domain:** beepagro.com
- **Repository:** https://github.com/mulawave/BPI.git
- **cPanel Account:** beepagro

## Important Notes for cPanel Deployment

⚠️ **cPanel Limitations:**
- cPanel's Node.js support is limited compared to traditional VPS
- You'll need Node.js 18.x or 20.x support in cPanel
- PM2 might not be available in cPanel's Node.js apps
- You may need to use cPanel's built-in Node.js application manager

## Recommended Approach for cPanel

Since this is a cPanel server with multiple accounts, you have **two options**:

### Option 1: Use cPanel's Node.js Application Manager (Simpler)

**Steps:**

1. **Access cPanel**
   - Go to https://66.29.149.90:2083 or https://beepagro.com:2083
   - Login with beepagro account credentials

2. **Setup Node.js Application**
   - Find "Setup Node.js App" in cPanel
   - Click "Create Application"
   - Configure:
     - **Node.js version:** 20.x (or latest available)
     - **Application mode:** Production
     - **Application root:** bpi-app
     - **Application URL:** beepagro.com
     - **Application startup file:** server.js

3. **SSH Access Setup**
   - Enable SSH access for the beepagro account in WHM/cPanel
   - Connect via SSH: `ssh beepagro@66.29.149.90`

4. **Deploy Application**
   ```bash
   # Navigate to home directory
   cd ~
   
   # Clone repository
   git clone https://github.com/mulawave/BPI.git bpi-app
   cd bpi-app
   
   # Install dependencies
   npm install --production
   
   # Create .env.local
   nano .env.local
   ```

5. **Environment Variables (.env.local)**
   ```env
   # Database (cPanel usually provides PostgreSQL)
   DATABASE_URL="postgresql://beepagro_user:your_db_password@localhost:5432/beepagro_bpi"
   
   # NextAuth
   AUTH_SECRET="generate_with: openssl rand -base64 32"
   NEXTAUTH_URL="https://beepagro.com"
   
   # Admin
   ADMIN_EMAIL="admin@beepagro.com"
   ADMIN_PASSWORD="your_secure_admin_password"
   
   # Flutterwave
   FLUTTERWAVE_PUBLIC_KEY="your_public_key"
   FLUTTERWAVE_SECRET_KEY="your_secret_key"
   
   # Node Environment
   NODE_ENV="production"
   PORT="3000"
   ```

6. **Setup PostgreSQL Database in cPanel**
   - Go to cPanel → PostgreSQL Databases
   - Create database: `beepagro_bpi`
   - Create user: `beepagro_user` with strong password
   - Add user to database with ALL PRIVILEGES
   - Note the credentials for .env.local

7. **Run Database Migrations**
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

8. **Build Application**
   ```bash
   npm run build
   ```

9. **Create Custom Server (server.js)**
   Since Next.js standalone doesn't work well with cPanel, create:
   ```bash
   nano server.js
   ```
   
   Add:
   ```javascript
   const { createServer } = require('http');
   const { parse } = require('url');
   const next = require('next');
   
   const dev = process.env.NODE_ENV !== 'production';
   const hostname = 'localhost';
   const port = process.env.PORT || 3000;
   
   const app = next({ dev, hostname, port });
   const handle = app.getRequestHandler();
   
   app.prepare().then(() => {
     createServer(async (req, res) => {
       try {
         const parsedUrl = parse(req.url, true);
         await handle(req, res, parsedUrl);
       } catch (err) {
         console.error('Error occurred handling', req.url, err);
         res.statusCode = 500;
         res.end('internal server error');
       }
     }).listen(port, (err) => {
       if (err) throw err;
       console.log(`> Ready on http://${hostname}:${port}`);
     });
   });
   ```

10. **Register Application in cPanel**
    - Go back to cPanel → Setup Node.js App
    - Click on your application
    - Click "Run NPM Install"
    - Click "Restart"

11. **Setup Reverse Proxy (if needed)**
    - cPanel should auto-configure this
    - If not, you may need to contact your hosting provider

### Option 2: Use Subdomain with Node.js App (Recommended for Better Control)

If cPanel's Node.js manager is limited, deploy as a subdomain:

1. **Create Subdomain**
   - cPanel → Domains → Create a Subdomain
   - Subdomain: `app.beepagro.com`
   - Document root: `/home/beepagro/bpi-app/public`

2. **Deploy via SSH**
   ```bash
   ssh beepagro@66.29.149.90
   cd ~
   git clone https://github.com/mulawave/BPI.git bpi-app
   cd bpi-app
   npm install --production
   ```

3. **Setup Environment and Database** (same as Option 1 steps 5-7)

4. **Build Application**
   ```bash
   npm run build
   ```

5. **Setup PM2 (if available)**
   ```bash
   npm install -g pm2
   pm2 start npm --name "bpi-app" -- start
   pm2 save
   pm2 startup
   ```

6. **Configure .htaccess for Reverse Proxy**
   ```bash
   nano public_html/.htaccess
   ```
   
   Add:
   ```apache
   RewriteEngine On
   RewriteCond %{HTTPS} off
   RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
   
   RewriteCond %{HTTP_HOST} ^beepagro\.com$ [OR]
   RewriteCond %{HTTP_HOST} ^www\.beepagro\.com$
   RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
   ```

### Option 3: Contact Hosting Provider (Easiest)

Since cPanel hosting can have restrictions, the easiest approach:

1. **Contact your hosting provider** and ask them to:
   - Enable Node.js support (version 20.x)
   - Allow long-running Node.js processes
   - Setup PostgreSQL database
   - Configure reverse proxy from beepagro.com to Node.js app

2. **Provide them with:**
   - GitHub repository: https://github.com/mulawave/BPI.git
   - Required Node.js version: 20.x
   - Database: PostgreSQL 14+
   - Port: 3000
   - Startup command: `npm start`

## Alternative: Deploy to VPS Instead of cPanel

Given that Next.js applications work better on standard VPS, consider:

1. **Create a subdomain** (e.g., bpi.beepagro.com) that points to a separate VPS
2. **Use a cheap VPS** ($5-10/month) like DigitalOcean, Vultr, or Linode
3. **Follow the main DEPLOYMENT_GUIDE.md** for proper setup

This gives you:
- Full control over Node.js version
- PM2 for process management
- Nginx for reverse proxy
- Better performance and reliability

## Quick Start Commands (SSH Access)

```bash
# Connect to server
ssh beepagro@66.29.149.90
# Password: gc7KgnFK3cX3R76E4m

# Navigate to home directory
cd ~

# Clone repository
git clone https://github.com/mulawave/BPI.git bpi-app

# Enter directory
cd bpi-app

# Install dependencies
npm install --production

# Create environment file
nano .env.local
# (Paste the environment variables from above)

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Build application
npm run build

# Test run (development mode to verify)
npm run dev
# Access: http://66.29.149.90:3000

# If working, set up production with cPanel Node.js manager
```

## Troubleshooting

### Node.js Version Issues
```bash
# Check available Node.js versions in cPanel
# Or use NVM if SSH allows
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000
# Kill it if needed
kill -9 <PID>
```

### Database Connection Issues
```bash
# Test PostgreSQL connection
psql -U beepagro_user -d beepagro_bpi -h localhost
```

### Permission Issues
```bash
# Fix file permissions
chmod -R 755 ~/bpi-app
chown -R beepagro:beepagro ~/bpi-app
```

## Post-Deployment

1. **Configure SMTP Settings**
   - Login to admin panel: https://beepagro.com/admin/login
   - Navigate to Settings → Integrations
   - Configure SMTP email settings

2. **Create Super Admin**
   ```bash
   cd ~/bpi-app
   npx tsx scripts/makeSuperAdmin.ts
   ```

3. **Seed Initial Data**
   ```bash
   npx tsx scripts/seedCurrencies.ts
   npx tsx scripts/seedLeadershipPoolSettings.ts
   ```

4. **Test Application**
   - Visit https://beepagro.com
   - Register a test user
   - Test membership activation
   - Test payment flows

## Monitoring

- **cPanel Access Logs:** /home/beepagro/logs/
- **Application Logs:** Check cPanel Node.js App logs
- **Error Logs:** /home/beepagro/bpi-app/logs/

## Updates

```bash
cd ~/bpi-app
git pull origin main
npm install --production
npx prisma generate
npx prisma migrate deploy
npm run build
# Restart via cPanel Node.js Manager
```

---

**Recommendation:** Given cPanel's limitations with Next.js applications, I strongly recommend Option 3 (contact hosting provider) or deploying to a separate VPS for the best experience.
