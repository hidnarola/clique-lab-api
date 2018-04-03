var log4js = require( "log4js" );
log4js.configure({
  appenders: { development: { type: 'file', filename: 'log_file.log' } },
  categories: { default: { appenders: ['development'], level: 'trace' } }
});

module.exports = {

    // App config
    "node_port": 3200,
    "logger": log4js.getLogger( "development" ),

    // Database config
    // "database": "mongodb://127.0.0.1:27017/clique_lab",
    "database": "mongodb://clique:WkEV9rTcS7@13.55.64.183/clique",

    // JWT
    "ACCESS_TOKEN_SECRET_KEY": "clique_lab_jwt_token",
    "REFRESH_TOKEN_SECRET_KEY": "clique_lab_jwt_refresh_token",
    "ACCESS_TOKEN_EXPIRE_TIME" : 60 * 60 * 24 * 7, // 7 days

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
    "website_url" : "http://localhost:8080"
};