# FastMart

FastMart is a full-stack grocery and general shopping application built with
React and Express. Customers can browse products, manage a cart, place orders,
pay through Razorpay, update their profile, and submit product reviews.
Administrators have separate product, order, user, and analytics screens.

## Highlights

- Product catalogue with categories, stock, descriptions, pricing, and images.
- Product search/shop and individual product detail pages.
- Registration, login, JWT-based authentication, and user profiles.
- Redux Toolkit cart with checkout flow and order history.
- Razorpay order creation and payment verification.
- Product reviews and ratings.
- Admin dashboard with sales analytics.
- Admin CRUD for products, order-status updates, and user administration.
- Cloudinary integration for product image storage.
- Optional Gemini/Chroma-based AI route code for product assistance.

## Technology

### Frontend (`client`)

- React 19
- Vite
- React Router
- Redux Toolkit and React Redux
- React Icons
- ESLint

### Backend (`server`)

- Node.js and Express
- MongoDB with Mongoose
- JWT and bcryptjs
- Razorpay
- Cloudinary and Multer
- Nodemailer
- Google Generative AI and Chroma dependencies

## Project structure

```text
FastMart/
├── client/
│   ├── src/
│   │   ├── admin/           # Admin dashboard and management screens
│   │   ├── components/      # Navbar, footer, cards, reviews, assistant
│   │   ├── context/         # Authentication context
│   │   ├── pages/           # Customer-facing pages
│   │   ├── redux/           # Cart slice and store
│   │   └── styles/          # Feature-specific styles
│   └── package.json
├── server/
│   ├── config/              # MongoDB and Cloudinary configuration
│   ├── controllers/         # Auth, product, order, payment, analytics logic
│   ├── middleware/          # Authentication and admin authorization
│   ├── models/              # User, Product, Review, and Order schemas
│   ├── routes/              # REST API route definitions
│   ├── scripts/             # Admin creation and product seeding
│   └── package.json
└── README.md
```

## Requirements

- Node.js 18 or newer
- npm
- MongoDB database (local or hosted)
- Cloudinary account for image uploads
- Razorpay account for payment testing/production
- Gemini and Chroma configuration only if the AI functionality is enabled

## Installation

Install each application separately:

```powershell
cd server
npm install

cd ..\client
npm install
```

Create `server/.env` from `server/.env.example` and fill in the values. Never
commit real credentials. The backend reads these variables:

| Variable | Purpose |
| --- | --- |
| `PORT` | API port; defaults to `5000` |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign access tokens |
| `FRONTEND_URL` | Allowed deployed frontend origin |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `RAZORPAY_KEY_ID` | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay secret |
| `GEMINI_API_KEY` | Gemini key for AI features |
| `GMAIL_USER` / `GMAIL_PASS` | Optional email notifications |

For the client, create `client/.env`:

```env
VITE_API_URL=http://localhost:5000
```

## Running locally

Start the API in one terminal:

```powershell
cd server
npm run dev
```

Start the Vite client in another:

```powershell
cd client
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`. The API health
response is available at `http://localhost:5000/`.

Optional database helpers:

```powershell
cd server
npm run seed-products
npm run make-admin -- your-email@example.com
```

## Main API areas

All routes are served from the backend:

- `/api/auth` — registration, login, and admin user listing.
- `/api/products` — catalogue, product CRUD, and reviews.
- `/api/orders` — create orders, current-user orders, admin order listing,
  and status updates.
- `/api/payment` — Razorpay order creation and payment verification.
- `/api/analytics` — admin-only dashboard statistics.
- `/api/users` — authenticated profile updates.

The AI route is defined under `/api/ai/chat`, but it must be mounted and
configured before it can be used in a deployment.

## Production build

```powershell
cd client
npm run build
npm run preview
```

Deploy the client and server separately, set the production environment
variables, and add the deployed client origin to the backend CORS
configuration.

## Available scripts

### Client

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build |

### Server

| Command | Description |
| --- | --- |
| `npm run dev` | Start Express with Nodemon |
| `npm start` | Start Express normally |
| `npm run seed-products` | Insert the seed product catalogue |
| `npm run make-admin -- <email>` | Promote a registered user to admin |

## Notes

- Payment credentials must be configured with test keys for development.
- Product images are uploaded through Cloudinary rather than stored in MongoDB.
- Admin endpoints require a valid JWT and an admin role.
- The checked-in `details.txt` contains historical setup notes; use environment
  files and rotate any credentials that may previously have been exposed.
