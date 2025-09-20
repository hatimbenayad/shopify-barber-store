# Shopify Barber App

A comprehensive barber shop management application built for the Shopify ecosystem. This app allows barber shops to manage their services, staff, and appointments directly from their Shopify admin, while providing customers with an integrated booking experience on the storefront.

## Features

### 📊 **Admin Dashboard**
- Complete overview of shop statistics
- Recent appointments and pending inquiries
- Quick access to all management features

### 💇‍♂️ **Barber Management**
- Add and manage barber profiles
- Set specialties and bio information
- Active/inactive status management
- Photo uploads for staff profiles

### ✂️ **Service Management**
- Create and edit service offerings
- Set pricing and duration information
- Detailed service descriptions
- Enable/disable services

### 📅 **Appointment System**
- Customer booking management
- Status tracking (scheduled, confirmed, completed, cancelled)
- Service and barber assignment
- Customer information management

### 📞 **Inquiry Management**
- Handle customer questions and requests
- Track inquiry status and responses
- Customer contact information

### 🛍️ **Storefront Integration**
- Seamless booking widget for themes
- Service display components
- App proxy for secure data handling
- Mobile-responsive design

## Technology Stack

- **Framework**: Remix (React-based, full-stack)
- **UI Library**: Shopify Polaris
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Shopify OAuth
- **Integration**: Shopify App Bridge
- **Deployment**: Railway, Heroku, or Fly.io compatible

## Quick Start

### Prerequisites

1. [Shopify Partners Account](https://partners.shopify.com/)
2. Node.js 18+ installed
3. [Shopify CLI](https://shopify.dev/docs/api/shopify-cli) installed

### Installation

1. **Clone and setup**
   ```bash
   git clone <repository-url>
   cd shopify-barber-app
   npm install
   ```

2. **Environment configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your Shopify app credentials
   ```

3. **Database setup**
   ```bash
   npx prisma migrate dev
   ```

4. **Development server**
   ```bash
   npm run dev
   # OR use Shopify CLI for automatic tunneling
   shopify app dev
   ```

### Environment Variables

```env
SHOPIFY_API_KEY=your_api_key_here
SHOPIFY_API_SECRET=your_api_secret_here
SCOPES=read_products,write_products,read_customers,write_customers,read_orders,write_orders
SHOPIFY_APP_URL=https://your-app-domain.com
DATABASE_URL=postgresql://username:password@localhost:5432/shopify_barber_app
SESSION_SECRET=your_session_secret_here
```

## Deployment

### Vercel (Recommended for Shopify Apps)
```bash
npm install -g vercel
vercel login
vercel --prod
```
See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for detailed instructions.

### Railway
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### Heroku
```bash
heroku create your-barber-app
heroku addons:create heroku-postgresql:mini
git push heroku main
```

### Fly.io
```bash
fly launch
```

## Shopify Configuration

### App Setup
1. Create app in Shopify Partners Dashboard
2. Configure app URLs:
   - **App URL**: `https://your-domain.com/`
   - **Allowed redirection URLs**: `https://your-domain.com/auth/callback`

### App Proxy (for storefront features)
- **Subpath prefix**: `apps`
- **Subpath**: `barber`
- **URL**: `https://your-domain.com/app_proxy`

## Usage

### Store Owner Setup

1. **Install the app** from Shopify Admin → Apps
2. **Configure barbers** in the Barber Management section
3. **Add services** with pricing and duration information
4. **Add booking widget** to storefront pages using:
   ```liquid
   {% include 'barber-booking-widget' %}
   ```

### Customer Booking Flow

1. Customer visits store's booking page
2. Selects service and preferred barber
3. Chooses appointment date/time
4. Submits booking request
5. Store owner confirms appointment

### Storefront Integration

Add the booking widget to any theme template:

```liquid
<!-- In a page template or section -->
<div class="barber-booking-section">
  {% include 'barber-booking-widget' %}
</div>

<!-- Display services -->
<div class="services-section">
  {% include 'barber-services-display' %}
</div>
```

## API Endpoints

### Admin Routes (Embedded App)
- `GET /app` - Dashboard
- `GET /app/barbers` - Barber management
- `GET /app/services` - Service management  
- `GET /app/appointments` - Appointment management
- `GET /app/inquiries` - Inquiry management

### Customer Routes (App Proxy)
- `GET /app_proxy` - Get services and barbers data
- `POST /app_proxy` - Submit appointment booking

## Database Schema

### Core Tables
- **shops** - Multi-tenant shop data
- **barbers** - Staff member information
- **services** - Service offerings
- **appointments** - Customer bookings
- **inquiries** - Customer questions
- **sessions** - Shopify OAuth sessions

## Development

### Project Structure
```
shopify-barber-app/
├── app/
│   ├── routes/          # Remix routes
│   ├── shopify.server.ts # Shopify configuration
│   └── db.server.ts     # Database connection
├── prisma/              # Database schema
├── snippets/            # Liquid templates
└── shopify.app.toml     # App configuration
```

### Adding New Features

1. **New admin page**: Create route in `app/routes/app.newfeature.tsx`
2. **Database changes**: Update `prisma/schema.prisma` and migrate
3. **Storefront feature**: Add new snippet in `snippets/` directory
4. **API endpoint**: Create route for data handling

### Testing

```bash
# Run type checking
npm run typecheck

# Build for production
npm run build

# Test in development store
shopify app dev
```

## Troubleshooting

### Common Issues

**App not loading in Shopify admin**
- Check `SHOPIFY_APP_URL` matches your public URL
- Verify SSL certificate is valid
- Confirm API credentials in Partners Dashboard

**Database connection errors**
- Verify `DATABASE_URL` format
- Ensure database is accessible from hosting environment
- Check Prisma client generation

**Storefront booking not working**
- Verify app proxy configuration
- Check browser console for JavaScript errors
- Confirm app proxy URL is accessible

### Getting Help

1. [Shopify Developer Documentation](https://shopify.dev/docs)
2. [Remix Documentation](https://remix.run/docs)
3. [Shopify Community Forums](https://community.shopify.com/c/developers/bd-p/developers)
4. [GitHub Issues](link-to-your-repo/issues)

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Create Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@yourcompany.com or create an issue in the GitHub repository.

---

**Built with ❤️ for the Shopify ecosystem**