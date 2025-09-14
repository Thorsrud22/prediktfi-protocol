# Password Authentication Setup

This document explains how to set up password authentication for the PrediktFi site.

## Environment Variables

Add the following environment variable to your Vercel deployment:

### Required Environment Variable

```bash
SITE_PASSWORD=admin145
```

## How to Set Environment Variables in Vercel

1. Go to your Vercel dashboard: https://vercel.com/prediktfun-2865s-projects/prediktfi-site
2. Navigate to **Settings** → **Environment Variables**
3. Add a new environment variable:
   - **Name**: `SITE_PASSWORD`
   - **Value**: `admin145` (or your preferred password)
   - **Environment**: Production (and Preview if desired)
4. Click **Save**
5. Redeploy your application

## How It Works

1. **Authentication Page**: Users visiting the site are redirected to `/auth`
2. **Password Check**: Users must enter the correct password to access the site
3. **Session Management**: Upon successful authentication, a secure HTTP-only cookie is set
4. **Protection**: All pages are protected by the `AuthGuard` component
5. **Session Duration**: Authentication lasts for 24 hours

## Default Password

The default password is: `admin145`

## Security Features

- HTTP-only cookies prevent XSS attacks
- Secure flag enabled in production
- SameSite strict policy
- 24-hour session expiration
- Rate limiting on auth endpoints

## Testing

1. Visit https://www.prediktfi.xyz
2. You should be redirected to the login page
3. Enter the password: `admin145`
4. You should be redirected to the main site
5. The session will persist for 24 hours

## Changing the Password

To change the password:
1. Update the `SITE_PASSWORD` environment variable in Vercel
2. Redeploy the application
3. All users will need to re-authenticate with the new password
