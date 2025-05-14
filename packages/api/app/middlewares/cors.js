import cors from "cors";

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [];

const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const allowed = validateOrigins(origin);
    if (allowed) {
      return callback(null, true);
    } else {
      const msg = "The CORS policy does not allow access from " + origin;
      return callback(new Error(msg), false);
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
});

export default corsMiddleware;

const validateOrigins = (curr) => {
  const isProd = process.env.NODE_ENV === "production";

  // allow tunnel origins in dev
  if (!isProd) {
    if (curr.endsWith("ngrok-free.app")) {
      return true;
    }
  }

  // always allow scouttoon.info origins in prod
  if (curr.endsWith("scouttoon.info")) {
    return true;
  }

  // check against env list
  return allowedOrigins.includes(curr);
};
