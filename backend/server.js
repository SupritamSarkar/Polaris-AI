import 'dotenv/config'; 
import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import llmRoutes from "./routes/llm_routes.js"; 

const app = express();

// -----------------------------
// ⚙️ CORS Configuration
// -----------------------------
const allowedOrigins = [
  "http://localhost:8080",
  "http://localhost:3000", 
  "http://localhost:5173", 
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("❌ Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions)); 

// -----------------------------
// ✅ Middleware (CRITICAL FIXES HERE)
// -----------------------------

// 1. THIS WAS MISSING: Allows server to read JSON body
app.use(express.json()); 

// 2. Session setup (Required for passport session)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev_secret_key", 
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// -----------------------------
// 🧩 Routes
// -----------------------------
app.use("/api/llm", llmRoutes); 

// -----------------------------
// ⚡ Health check
// -----------------------------
app.get("/", (req, res) => {
  res.status(200).send("Backend is live ✅");
});

// -----------------------------
// 🚀 Start server
// -----------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));