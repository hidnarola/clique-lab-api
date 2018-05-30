var log4js = require( "log4js" );
log4js.configure({
  appenders: { development: { type: 'file', filename: 'log_file.log' } },
  categories: { default: { appenders: ['development'], level: 'trace' } }
});
var dotenv = require('dotenv').config();

module.exports = {
    // App config
    "node_port": process.env.NODE_PORT,
    "logger": log4js.getLogger( "development" ),

    // Database config
    "database": process.env.DATABASE,

    // Stripe
    "STRIPE_KEY":process.env.STRIPE_KEY,
    "STRIPE_SECRET_KEY":process.env.STRIPE_SECRET_KEY,

    // JWT
    "ACCESS_TOKEN_SECRET_KEY": process.env.ACCESS_TOKEN_SECRET_KEY,
    "REFRESH_TOKEN_SECRET_KEY": process.env.REFRESH_TOKEN_SECRET_KEY,
    "ACCESS_TOKEN_EXPIRE_TIME" : 60 * 60 * 24 * 7, // 7 days

    // some other constant
    "REFERRAL_REWARD":50, // In dollars

    // HTTP Status
    "OK_STATUS": 200,
    "BAD_REQUEST": 400,
    "UNAUTHORIZED": 401,
    "NOT_FOUND": 404,
    "MEDIA_ERROR_STATUS": 415,
    "VALIDATION_FAILURE_STATUS": 417,
    "DATABASE_ERROR_STATUS": 422,
    "INTERNAL_SERVER_ERROR": 500,

    // Other configuration
    "website_url" : process.env.WEBSITE_URL,
    "base_url": process.env.BASE+':'+process.env.NODE_PORT,
    "IS_HTTPS":process.env.IS_HTTPS,
    // "base_url": "http://13.55.64.183:3200"

    "SMTP_MAIL": process.env.SMTP_MAIL,
    "SMTP_PASSWORD":process.env.SMTP_PASSWORD,

    "TWITTER_APP_ID": process.env.TWITTER_APP_ID,
    "TWITTER_APP_SECRET":process.env.TWITTER_APP_SECRET,
    "LINKEDIN_APP_ID": process.env.LINKEDIN_APP_ID,
    "LINKEDIN_APP_SECRET":process.env.LINKEDIN_APP_SECRET
};