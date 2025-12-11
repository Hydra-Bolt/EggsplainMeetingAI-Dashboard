# Vexa Dashboard

Open source web interface for [Vexa](https://github.com/Vexa-ai/vexa) - the self-hosted meeting transcription API.

A simple and intuitive dashboard that allows you to:
- **Join meetings** - Send transcription bots to Google Meet, Microsoft Teams, and Zoom
- **View transcripts** - Browse and search through meeting transcriptions
- **Real-time transcription** - Watch live transcriptions via WebSocket
- **Export** - Download transcripts in TXT, JSON, SRT, or VTT formats
- **User management** - Admin dashboard for managing users and API tokens

## Features

- **Flexible Authentication** - Magic Link (via email) or Direct Login mode
- **Admin Dashboard** - Manage users and API tokens
- **Real-time Streaming** - Live transcription via WebSocket
- **Speaker Identification** - Color-coded speakers with avatars
- **Multi-format Export** - TXT, JSON, SRT, VTT formats
- **Registration Control** - Restrict signups by email domain
- **Dark Mode** - System-aware theme switching
- **Mobile Responsive** - Works on all devices
- **Docker Ready** - Easy deployment with Docker/Docker Compose

## Screenshots

*Coming soon*

## Quick Start

### Prerequisites

- Node.js 20+
- A running [Vexa](https://github.com/Vexa-ai/vexa) instance
- Vexa Admin API key
- (Optional) SMTP server for Magic Link authentication (e.g., [Resend](https://resend.com), SendGrid, Mailgun)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Vexa-ai/vexa-dashboard.git
cd vexa-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
# Vexa API
VEXA_API_URL=http://localhost:18056
NEXT_PUBLIC_VEXA_WS_URL=ws://localhost:18056/ws

# Admin API (required for auth)
VEXA_ADMIN_API_KEY=your_admin_api_key

# Optional: SMTP for magic link emails (if not set, uses Direct Login mode)
# SMTP_HOST=smtp.resend.com
# SMTP_PORT=587
# SMTP_USER=resend
# SMTP_PASS=your_smtp_api_key
# SMTP_FROM=noreply@yourdomain.com
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Docker Deployment

### Using Docker

```bash
docker build -t vexa-dashboard .

# Minimal setup (Direct Login mode - no email verification)
docker run -p 3000:3000 \
  -e VEXA_API_URL=http://your-vexa-instance:18056 \
  -e NEXT_PUBLIC_VEXA_WS_URL=ws://your-vexa-instance:18056/ws \
  -e VEXA_ADMIN_API_KEY=your_admin_api_key \
  vexa-dashboard

# With SMTP (Magic Link mode - email verification)
docker run -p 3000:3000 \
  -e VEXA_API_URL=http://your-vexa-instance:18056 \
  -e NEXT_PUBLIC_VEXA_WS_URL=ws://your-vexa-instance:18056/ws \
  -e VEXA_ADMIN_API_KEY=your_admin_api_key \
  -e SMTP_HOST=smtp.example.com \
  -e SMTP_PORT=587 \
  -e SMTP_USER=your_user \
  -e SMTP_PASS=your_password \
  -e SMTP_FROM=noreply@example.com \
  vexa-dashboard
```

### Using Docker Compose

```bash
cp .env.example .env
# Edit .env with your values
docker-compose up -d
```

## Configuration

### Required Variables

| Variable | Description |
|----------|-------------|
| `VEXA_API_URL` | Vexa API base URL |
| `NEXT_PUBLIC_VEXA_WS_URL` | WebSocket URL for real-time updates |
| `VEXA_ADMIN_API_KEY` | Admin API key (server-side only) |

### SMTP Variables (Optional)

If SMTP is configured, Magic Link authentication is enabled. Without SMTP, Direct Login mode is used.

| Variable | Description |
|----------|-------------|
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP server port (default: 587) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `SMTP_FROM` | Email sender address |
| `SMTP_SECURE` | Use TLS for SMTP (default: false) |

### Other Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VEXA_ADMIN_API_URL` | Separate admin API URL | `VEXA_API_URL` |
| `JWT_SECRET` | Secret for magic link tokens | `VEXA_ADMIN_API_KEY` |
| `NEXT_PUBLIC_APP_URL` | Public URL (for magic links) | Auto-detected |
| `ALLOW_REGISTRATIONS` | Allow new signups | `true` |
| `ALLOWED_EMAIL_DOMAINS` | Restrict signup domains | All domains |

### Registration Control

Control who can sign up:

```env
# Allow all registrations (default)
ALLOW_REGISTRATIONS=true

# Disable registrations (invite-only)
ALLOW_REGISTRATIONS=false

# Restrict to specific domains
ALLOW_REGISTRATIONS=true
ALLOWED_EMAIL_DOMAINS=company.com,example.org
```

## Authentication Flow

Vexa Dashboard supports two authentication modes:

### Magic Link Mode (with SMTP)

When SMTP is configured, passwordless **Magic Link** authentication is used:

1. User enters their email on the login page
2. Server sends an email with a secure sign-in link (valid for 15 minutes)
3. User clicks the link to authenticate
4. A session token is stored securely (HTTP-only cookie + localStorage)

### Direct Login Mode (without SMTP)

When SMTP is not configured, **Direct Login** mode is used:

1. User enters their email on the login page
2. Server authenticates immediately (no email verification)
3. A session token is stored securely (HTTP-only cookie + localStorage)

> **Note**: Direct Login mode is convenient for development and trusted environments, but Magic Link mode is recommended for production as it provides email verification.

The Admin API key is never exposed to clients - it's used server-side only to manage users and generate tokens.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/
│   │   ├── auth/          # Auth endpoints (magic link, verify, logout)
│   │   ├── admin/         # Admin API proxy
│   │   └── vexa/          # Vexa API proxy
│   ├── admin/users/       # User management pages
│   ├── auth/verify/       # Magic link verification
│   ├── login/             # Login page
│   ├── meetings/          # Meetings list and detail
│   ├── join/              # Join meeting page
│   └── settings/          # Settings page
├── components/
│   ├── auth/              # Auth provider
│   ├── layout/            # Header, Sidebar, AppLayout
│   ├── meetings/          # Meeting cards and lists
│   ├── transcript/        # Transcript viewer
│   ├── join/              # Join form and live session
│   └── ui/                # shadcn/ui components
├── stores/                # Zustand state stores
├── lib/                   # Utilities (API client, email, registration)
└── types/                 # TypeScript definitions
```

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: shadcn/ui + Tailwind CSS
- **State**: Zustand
- **Language**: TypeScript
- **Icons**: Lucide React
- **Email**: Nodemailer
- **Auth**: JWT (jsonwebtoken)

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Type check
npm run lint

# Build for production
npm run build
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Related Projects

- [Vexa](https://github.com/Vexa-ai/vexa) - Self-hosted meeting transcription API

## Support

- [GitHub Issues](https://github.com/Vexa-ai/vexa-dashboard/issues)
- [Vexa Documentation](https://github.com/Vexa-ai/vexa)
