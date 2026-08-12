import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import xss from 'xss-clean';
import mongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';
import cors from 'cors';
import passport from 'passport';
import httpStatus from 'http-status';
import config from './config/config.js';
import * as morgan from './config/morgan.js';
import { jwtStrategy } from './config/passport.js';
import { authLimiter } from './middlewares/rateLimiter.js';
import routes from './routes/v1/index.js';
import { errorConverter, errorHandler } from './middlewares/error.js';
import ApiError from './utils/ApiError.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// One reverse-proxy hop (nginx/ALB) so rate-limit keys use the real client IP
if (config.env === 'production') {
  app.set('trust proxy', 1);
}

if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// set security HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'", // Required for Zoom SDK
        "blob:", // Required for Zoom SDK Web Workers
        "https://source.zoom.us",
        "https://zoom.us", // Main Zoom domain
        "https://*.zoom.us" // All Zoom subdomains
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://source.zoom.us",
        "https://*.zoom.us",
        "https://us05st1.zoom.us",
        "https://st1.zoom.us",
        "https://fonts.googleapis.com"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "blob:"
      ],
      connectSrc: [
        "'self'",
        "https://api.zoom.us",
        "https://*.zoom.us",
        "wss://*.zoom.us",
        "https://source.zoom.us",
        "https://*.cloudfront.net" // For Zoom SDK sourcemaps and resources
      ],
      fontSrc: [
        "'self'",
        "https://source.zoom.us",
        "https://fonts.gstatic.com",
        "data:"
      ],
      frameSrc: [
        "'self'",
        "https://*.zoom.us"
      ],
      mediaSrc: [
        "'self'",
        "blob:",
        "https://*.zoom.us"
      ],
      workerSrc: [
        "'self'",
        "blob:",
        "https://source.zoom.us",
        "https://*.zoom.us"
      ]
    }
  },
  // Note: COEP/COOP set per-route for join-meeting to avoid breaking other routes
  crossOriginEmbedderPolicy: false // Set per-route for join-meeting only
}));

// parse json request body
// `verify` stashes the raw bytes so webhook HMAC signatures (WhatsApp/Meta)
// can be checked against exactly what was sent.
app.use(
  express.json({
    limit: '1mb',
    verify: (req, res, buf) => {
      if (req.originalUrl && req.originalUrl.startsWith('/v1/whatsapp/webhook')) {
        req.rawBody = buf;
      }
    },
  })
);

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize request data
app.use(xss());
app.use(mongoSanitize());

// gzip compression
app.use(compression());

// enable cors — explicit allowlist rather than reflecting any origin.
// Native apps ignore CORS entirely, so this only constrains browser clients.
const allowedOrigins = [
  config.frontend.url,
  config.frontend.consumerUrl,
  config.wellnessFeedback.crmPublicOrigin,
  ...(config.env !== 'production' ? ['http://localhost:3000', 'http://localhost:5173'] : []),
].filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // No Origin header = native app, curl, or server-to-server — always allow.
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// jwt authentication
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

// limit repeated requests to auth endpoints (all environments)
app.use('/v1/auth', authLimiter);

// public static assets (feedback form HTML, join-meeting page, etc.)
app.use('/public', express.static(path.join(__dirname, '../public')));

// v1 api routes
app.use('/v1', routes);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

export default app;
