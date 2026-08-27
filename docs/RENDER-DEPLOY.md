# Render Deployment Guide — Nyumba Nearby

## Quick Deploy (One-Click)

1. Push your code to GitHub (already done)
2. Go to [render.com/dashboard](https://render.com/dashboard)
3. Click **New** → **Web Service**
4. Connect your GitHub repository
5. Render will auto-detect `render.yaml` and configure everything

## Step-by-Step Setup

### 1. Create Web Service

```
Name: nyumba-nearby
Runtime: Node
Plan: Starter ($7/month)
```

### 2. Build Settings

```
Build Command: bash scripts/render-build.sh
Start Command: npx prisma migrate deploy && npm run start
```

### 3. Environment Variables (Required)

Set these in Render Dashboard → Environment tab:

#### Database
| Variable | Value | Source |
|----------|-------|--------|
| `DATABASE_URL` | `postgresql://...` | Your Supabase connection string |
| `NEXTAUTH_SECRET` | (auto-generated) | Render generates this |
| `NEXTAUTH_URL` | `https://nyumba-nearby.onrender.com` | Your Render URL |
| `NEXT_PUBLIC_APP_URL` | `https://nyumba-nearby.onrender.com` | Your Render URL |

#### Supabase Storage (for image uploads)
| Variable | Value | Source |
|----------|-------|--------|
| `supabase_project_url` | `https://xxx.supabase.co` | Supabase Dashboard → Settings → API |
| `supabase_service_role_secret` | `eyJ...` | Supabase Dashboard → Settings → API |
| `supabase_anon_public` | `eyJ...` | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Same as supabase_project_url |

#### AI (Optional — enables AI search & listing extraction)
| Variable | Value | Source |
|----------|-------|--------|
| `AWS_ACCESS_KEY_ID` | `AKIA...` | AWS Console → IAM |
| `AWS_SECRET_ACCESS_KEY` | `...` | AWS Console → IAM |
| `AWS_BEDROCK_REGION` | `us-east-1` | AWS Bedrock region |
| `AWS_BEDROCK_MODEL_ID` | `deepseek.v3.2` | Bedrock model ID |

**Alternative AI Providers (if not using Bedrock):**
| Variable | Value |
|----------|-------|
| `OPENAI_API_KEY` | OpenAI API key |
| `OPENROUTER_API_KEY` | OpenRouter API key |

#### Payments (Optional — enables subscription billing)
| Variable | Value | Source |
|----------|-------|--------|
| `STRIPE_SECRET_KEY` | `sk_live_...` | Stripe Dashboard → API Keys |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Stripe Dashboard → Webhooks |

#### Email (Optional — enables transactional emails)
| Variable | Value | Source |
|----------|-------|--------|
| `RESEND_API_KEY` | `re_...` | Resend Dashboard → API Keys |
| `EMAIL_FROM` | `noreply@nyumbanearby.com` | Your verified domain |

#### Push Notifications (Optional)
| Variable | Value | Source |
|----------|-------|--------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `...` | `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | `...` | Same command |
| `VAPID_EMAIL` | `mailto:you@email.com` | Your email |

### 4. Deploy

Click **Create Web Service** → Render will:
1. Clone your repo
2. Run `bash scripts/render-build.sh`
3. Start with `npx prisma migrate deploy && npm run start`
4. Assign a URL like `https://nyumba-nearby.onrender.com`

## Post-Deployment Checklist

- [ ] Set all required environment variables
- [ ] Verify database connection works
- [ ] Test login/signup flow
- [ ] Test image upload (needs Supabase Storage vars)
- [ ] Test AI search (needs Bedrock/OpenAI vars)
- [ ] Set `NEXT_PUBLIC_APP_URL` to your Render URL
- [ ] Set `NEXTAUTH_URL` to your Render URL
- [ ] Update Supabase redirect URLs to include Render domain

## Custom Domain (Optional)

1. Go to Render Dashboard → Settings → Custom Domains
2. Add your domain (e.g., `nyumbanearby.com`)
3. Update DNS records as shown by Render
4. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to your custom domain

## Troubleshooting

### Build fails with Prisma error
- Ensure `DATABASE_URL` is set in Render environment
- Check that Supabase allows connections from Render IPs

### Images not loading
- Verify `supabase_project_url` and `supabase_service_role_secret` are set
- Check Supabase Storage bucket permissions

### AI search returns errors
- Verify AWS credentials are correct
- Check Bedrock model access in AWS console

### App crashes on startup
- Check Render logs for missing environment variables
- Ensure `NEXTAUTH_SECRET` is set (Render auto-generates this)
- Verify `DATABASE_URL` points to a valid PostgreSQL database

## Cost Estimate

| Component | Cost |
|-----------|------|
| Render Starter Plan | $7/month |
| Supabase Free Tier | $0/month |
| AWS Bedrock (AI) | Pay-per-use |
| Stripe | Pay-per-transaction |
| Resend (Email) | Free tier: 100/day |

**Total: ~$7/month base + usage**
