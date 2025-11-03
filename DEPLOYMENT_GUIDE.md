# 🚀 Production Deployment Guide

## SmartLab Blood Cell Quality Testing System

### Overview

This guide walks you through deploying the complete system to production with:

- **Frontend**: Vercel (Next.js)
- **Backend**: Railway / Render / Fly.io (Node.js API routes)

---

## 📋 Prerequisites

1. **Accounts Required**:

   - [Vercel Account](https://vercel.com) (free tier available)
   - [Railway Account](https://railway.app) OR [Render Account](https://render.com) (free tier available)
   - GitHub account (recommended for CI/CD)

2. **Local Setup**:
   ```bash
   # Ensure project works locally first
   cd app
   npm install
   npm run build
   npm run dev
   ```

---

## 🔧 Step 1: Prepare Your Data

### Option A: Use Existing Workspace Data

The system will automatically load:

- `BloodData - Test01.csv`
- `Combined_Test_Data.csv`
- `Blood Test Mockup CSVs Sept 28 2025/*.csv`

### Option B: Prepare Custom Data

1. Format your CSV files according to one of the supported formats:

   - **BloodData-Test01**: `Lab Code,A_RBC,A_WBC,...,B_RBC,B_WBC,...,Brand code,Model code`
   - **Combined**: Full format with Thai headers and detailed metadata
   - **Mockup-AV**: Simplified format with Brand_N, B_M_No columns

2. Place files in appropriate directories in your deployment

---

## 🌐 Step 2: Deploy Frontend to Vercel

### Method 1: GitHub Integration (Recommended)

1. **Push to GitHub**:

   ```bash
   cd /path/to/BloodCellQualityTesting
   git add .
   git commit -m "Prepare for production deployment"
   git push origin main
   ```

2. **Connect to Vercel**:

   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Select the `app` directory as the root
   - Framework Preset: **Next.js**
   - Click **Deploy**

3. **Configure Environment Variables** in Vercel Dashboard:
   ```
   NEXT_PUBLIC_API_URL = https://your-backend-url.railway.app
   NODE_ENV = production
   ```

### Method 2: Vercel CLI

```bash
cd app
npm install -g vercel
vercel login
vercel --prod
```

### Verify Frontend Deployment

- Visit your Vercel URL: `https://your-app.vercel.app`
- Test the login page
- Note: Backend features won't work until Step 3 is complete

---

## 🖥️ Step 3: Deploy Backend

### Option A: Railway (Recommended)

1. **Install Railway CLI**:

   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Initialize Project**:

   ```bash
   cd /path/to/BloodCellQualityTesting
   railway init
   ```

3. **Configure Service**:

   - Railway will auto-detect Next.js
   - Set root directory to `app`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

4. **Set Environment Variables**:

   ```bash
   railway variables set NODE_ENV=production
   railway variables set PORT=3000
   railway variables set CORS_ORIGIN=https://your-app.vercel.app
   ```

5. **Deploy**:

   ```bash
   railway up
   ```

6. **Get Your Backend URL**:
   ```bash
   railway domain
   # Example output: smartlab-backend.railway.app
   ```

### Option B: Render.com

1. **Create New Web Service**:

   - Go to [render.com/dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**:

   - Name: `smartlab-blood-cell-api`
   - Environment: `Node`
   - Region: `Singapore` (or closest to your users)
   - Branch: `main`
   - Root Directory: `app`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

3. **Set Environment Variables**:

   ```
   NODE_ENV = production
   PORT = 3000
   CORS_ORIGIN = https://your-app.vercel.app
   ```

4. **Deploy** and note your service URL

### Option C: Fly.io

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch app
cd app
fly launch

# Deploy
fly deploy
```

---

## 🔄 Step 4: Connect Frontend to Backend

1. **Update Vercel Environment Variable**:

   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Update `NEXT_PUBLIC_API_URL` to your backend URL:
     ```
     NEXT_PUBLIC_API_URL = https://smartlab-backend.railway.app
     ```

2. **Redeploy Frontend**:

   - Vercel will automatically redeploy when you save the environment variable
   - Or manually trigger: `vercel --prod` from CLI

3. **Update Backend CORS**:
   - In Railway/Render dashboard, update `CORS_ORIGIN`:
     ```
     CORS_ORIGIN = https://your-app.vercel.app
     ```

---

## ✅ Step 5: Verify Production Deployment

### Health Checks

1. **Frontend Health Check**:

   ```bash
   curl https://your-app.vercel.app
   # Should return HTML
   ```

2. **Backend Health Check**:

   ```bash
   curl https://your-backend.railway.app/api/pt-eqa/load
   # Should return JSON with data
   ```

3. **Integration Test**:
   - Visit `https://your-app.vercel.app`
   - Login with demo credentials
   - Go to PT:EQA Wizard
   - Click "Load Real Data"
   - Verify data loads successfully

### Common Issues & Solutions

#### Issue: Frontend shows "Failed to load data"

**Solution**:

- Check `NEXT_PUBLIC_API_URL` is correct in Vercel
- Verify backend is running
- Check CORS settings in backend

#### Issue: Backend fails to start

**Solution**:

- Check build logs in Railway/Render
- Verify `package.json` scripts are correct
- Ensure all dependencies are in `dependencies` (not `devDependencies`)

#### Issue: Data files not found

**Solution**:

- For Railway: Use Railway Volumes to persist data
- For Render: Use Render Disks
- Alternative: Store CSVs in cloud storage (S3, Google Cloud Storage)

---

## 📊 Step 6: Monitor Production

### Vercel Monitoring

- Real-time logs: Vercel Dashboard → Your Project → Logs
- Analytics: Enable Vercel Analytics in project settings

### Railway Monitoring

```bash
railway logs
railway status
```

### Render Monitoring

- Dashboard → Your Service → Logs
- Set up log drains for external monitoring

### Set Up Alerts

1. **Uptime Monitoring**: Use UptimeRobot or similar

   - Monitor: `https://your-app.vercel.app`
   - Monitor: `https://your-backend.railway.app/api/pt-eqa/load`

2. **Error Tracking**: Consider Sentry
   ```bash
   npm install @sentry/nextjs
   # Follow Sentry Next.js setup guide
   ```

---

## 🔐 Security Checklist

- [ ] Update all default credentials
- [ ] Enable HTTPS (automatic with Vercel/Railway)
- [ ] Set proper CORS origins (not `*` in production)
- [ ] Add rate limiting to API routes
- [ ] Enable authentication for sensitive endpoints
- [ ] Regular security updates: `npm audit fix`
- [ ] Set up automated backups for data files

---

## 🔄 Continuous Deployment

### Automatic Deployment on Git Push

1. **Vercel**: Automatically deploys on push to `main` branch

2. **Railway**:

   ```bash
   railway link
   # Automatic deployment on push
   ```

3. **GitHub Actions** (optional):
   Create `.github/workflows/deploy.yml`:
   ```yaml
   name: Deploy to Production
   on:
     push:
       branches: [main]
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - uses: actions/setup-node@v2
         - run: cd app && npm ci
         - run: cd app && npm run build
         - run: cd app && npm test
   ```

---

## 📈 Scaling Considerations

### When Your User Base Grows

1. **Frontend**:

   - Vercel Pro: $20/month for better performance
   - Enable Edge Caching
   - Use Next.js Image Optimization

2. **Backend**:

   - Railway: Upgrade to higher-tier plan
   - Enable horizontal scaling
   - Consider adding Redis for caching

3. **Database** (future):
   - PostgreSQL on Railway/Render
   - or managed service like Supabase

---

## 🆘 Support

### For Deployment Issues

1. Check deployment logs
2. Verify environment variables
3. Test locally first: `npm run build && npm start`

### For Application Issues

1. Check Activity Log in the app
2. Review browser console
3. Contact system administrator

---

## 🎯 Next Steps

After successful deployment:

1. **Share Access**:

   - Send Vercel URL to your team
   - Set up user accounts
   - Provide training on PT:EQA workflow

2. **Data Management**:

   - Set up regular CSV data uploads
   - Configure automated data backups
   - Document data format requirements

3. **Maintenance**:
   - Schedule weekly `npm update` checks
   - Monitor error logs
   - Review user feedback

---

## 📝 Deployment Checklist

**Pre-Deployment**:

- [ ] Test locally
- [ ] Run `npm run build` successfully
- [ ] Verify all data files are accessible
- [ ] Update environment variables

**Deployment**:

- [ ] Deploy frontend to Vercel
- [ ] Deploy backend to Railway/Render
- [ ] Connect frontend to backend
- [ ] Configure CORS properly

**Post-Deployment**:

- [ ] Run health checks
- [ ] Test PT:EQA workflow end-to-end
- [ ] Set up monitoring
- [ ] Document production URLs
- [ ] Train team members

---

## 🌟 Production URLs Template

Fill this in after deployment:

```
Frontend (Vercel): https://your-app.vercel.app
Backend (Railway): https://your-backend.railway.app
Admin Dashboard: https://your-app.vercel.app/dashboard
PT:EQA Wizard: https://your-app.vercel.app/pt-eqa

Credentials:
- Administrator: admin / [your-secure-password]
- Supervisor: supervisor / [your-secure-password]
- Analyst: analyst / [your-secure-password]
```

---

**Congratulations!** 🎉 Your system is now live and ready for production use!
