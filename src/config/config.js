import dotenv from 'dotenv';
import path from 'path';
import Joi from 'joi';

dotenv.config();

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(3000),
    MONGODB_URL: Joi.string().required().description('MongoDB URL'),
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(172800).description('minutes after which access tokens expire'),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number().default(172800).description('days after which refresh tokens expire'),
    JWT_RESET_PASSWORD_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which reset password token expires'),
    JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which verify email token expires'),
    SMTP_HOST: Joi.string().description('server that will send the emails'),
    SMTP_PORT: Joi.number().description('port to connect to the email server'),
    SMTP_USERNAME: Joi.string().description('username for email server'),
    SMTP_PASSWORD: Joi.string().description('password for email server'),
    EMAIL_FROM: Joi.string().description('the from field in the emails sent by the app'),
    // AWS SES SMTP Configuration
    SES_SMTP_IAM_USER: Joi.string().description('AWS SES SMTP IAM user'),
    SES_SMTP_USERNAME: Joi.string().description('AWS SES SMTP username'),
    SES_SMTP_PASSWORD: Joi.string().description('AWS SES SMTP password'),
    SES_SMTP_ENDPOINT: Joi.string().description('AWS SES SMTP endpoint'),
    SES_SMTP_PORT: Joi.alternatives().try(Joi.number(), Joi.string().pattern(/^\d+/)).description('AWS SES SMTP port'),
    SMTP_TIMEOUT: Joi.number().default(7).description('SMTP connection timeout in seconds'),
    DIET_MODEL_URL: Joi.string().description('URL for the AI diet model API'),
    RAZORPAY_KEY_ID: Joi.string().description('Razorpay Key ID'),
    RAZORPAY_SECRET: Joi.string().description('Razorpay Secret Key'),
    OPEN_AI_KEY: Joi.string().description('OpenAI API Key'),
    ASSISTANTS_ID: Joi.string().description('OpenAI Assistant ID'),
    WHATSAPP_PHONE_NUMBER_ID: Joi.string().description('WhatsApp Phone Number ID'),
    WHATSAPP_ACCESS_TOKEN: Joi.string().description('WhatsApp Access Token'),
    WHATSAPP_VERIFY_TOKEN: Joi.string().description('WhatsApp Webhook Verify Token'),
    WHATSAPP_API_VERSION: Joi.string().default('v22.0').description('WhatsApp API Version'),
    WHATSAPP_BUSINESS_ACCOUNT_ID: Joi.string().description('WhatsApp Business Account ID'),
    // Redis Configuration
    REDIS_HOST: Joi.string().default('localhost').description('Redis host'),
    REDIS_PORT: Joi.number().default(6379).description('Redis port'),
    REDIS_PASSWORD: Joi.string().allow('').description('Redis password'),
    REDIS_DB: Joi.number().default(0).description('Redis database number'),
    APPLE_SHARED_SECRET: Joi.string().description('Apple In-App Purchase Shared Secret'),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  mongoose: {
    url: envVars.MONGODB_URL + (envVars.NODE_ENV === 'test' ? '-test' : ''),
    options: {
      useCreateIndex: true, // Optional: Remove this if using Mongoose v6+
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
    resetPasswordExpirationMinutes: envVars.JWT_RESET_PASSWORD_EXPIRATION_MINUTES,
    verifyEmailExpirationMinutes: envVars.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES,
  },
  email: {
    // Primary SMTP (AWS SES)
    smtp: {
      host: envVars.SES_SMTP_ENDPOINT || envVars.SMTP_HOST,
      port: parseInt(envVars.SES_SMTP_PORT) || envVars.SMTP_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: envVars.SES_SMTP_USERNAME || envVars.SMTP_USERNAME,
        pass: envVars.SES_SMTP_PASSWORD || envVars.SMTP_PASSWORD,
      },
      connectionTimeout: (envVars.SMTP_TIMEOUT || 7) * 1000, // Convert to milliseconds
      greetingTimeout: (envVars.SMTP_TIMEOUT || 7) * 1000,
      socketTimeout: (envVars.SMTP_TIMEOUT || 7) * 1000,
    },
    // Fallback SMTP (legacy SMTP) - only if different from primary
    fallbackSmtp: (envVars.SES_SMTP_ENDPOINT && envVars.SMTP_HOST &&
      envVars.SES_SMTP_ENDPOINT !== envVars.SMTP_HOST) ? {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      secure: false,
      auth: {
        user: envVars.SMTP_USERNAME,
        pass: envVars.SMTP_PASSWORD,
      },
      connectionTimeout: (envVars.SMTP_TIMEOUT || 7) * 1000,
      greetingTimeout: (envVars.SMTP_TIMEOUT || 7) * 1000,
      socketTimeout: (envVars.SMTP_TIMEOUT || 7) * 1000,
    } : null,
    from: envVars.EMAIL_FROM,
  },
  dietModelUrl: envVars.DIET_MODEL_URL,
  razorpay: {
    keyId: envVars.RAZORPAY_KEY_ID,
    secretKey: envVars.RAZORPAY_SECRET,
  },
  openai: {
    apiKey: envVars.OPEN_AI_KEY,
    assistantId: envVars.ASSISTANTS_ID,
  },
  whatsapp: {
    phoneNumberId: envVars.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: envVars.WHATSAPP_ACCESS_TOKEN,
    verifyToken: envVars.WHATSAPP_VERIFY_TOKEN,
    apiVersion: envVars.WHATSAPP_API_VERSION,
    businessAccountId: envVars.WHATSAPP_BUSINESS_ACCOUNT_ID,
  },
  redis: {
    host: envVars.REDIS_HOST,
    port: envVars.REDIS_PORT,
    password: envVars.REDIS_PASSWORD || undefined,
    db: envVars.REDIS_DB,
  },
  apple: {
    sharedSecret: envVars.APPLE_SHARED_SECRET,
  },
};

export default config;
