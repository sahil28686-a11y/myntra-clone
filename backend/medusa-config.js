const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

module.exports = {
  projectConfig: {
    redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
    databaseUrl: process.env.DATABASE_URL || "postgres://myntra:myntra_pass@localhost:5432/myntra_store",
    databaseType: "postgres",
    jwtSecret: process.env.JWT_SECRET || "myntra-jwt-secret",
    cookieSecret: process.env.COOKIE_SECRET || "myntra-cookie-secret",
    storeCors: process.env.STORE_CORS || "http://localhost:3000",
    adminCors: process.env.ADMIN_CORS || "http://localhost:9000",
  },
  plugins: [
    {
      resolve: "medusa-file-system",
      options: {
        upload_dir: "uploads",
      },
    },
    {
      resolve: "medusa-payment-manual",
      options: {
        enabled: true,
      },
    },
    {
      resolve: "medusa-fulfillment-manual",
      options: {
        enabled: true,
      },
    },
    {
      resolve: "medusa-payment-razorpay",
      options: {
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      },
    },
    {
      resolve: "@medusajs/medusa-plugin-sendgrid",
      options: {
        api_key: process.env.SENDGRID_API_KEY,
        from: process.env.SENDGRID_FROM_EMAIL || "noreply@myntra-clone.com",
      },
    },
  ],
  modules: {
    pincode: {
      resolve: "./src/models/pincode",
    },
    review: {
      resolve: "./src/models/review",
    },
    wishlist: {
      resolve: "./src/models/wishlist",
    },
    returnRequest: {
      resolve: "./src/models/return-request",
    },
  },
};
