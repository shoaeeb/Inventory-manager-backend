import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.route.js";
import inventoryRoutes from "./routes/inventory.route.js";
import dashboardRoutes from "./routes/dashboard.route.js";
import salesRoutes from "./routes/sales.routes.js";
dotenv.config();

const app = express();

app.use(
  cors({
    origin: [process.env.FRONTEND_URL, process.env.FRONTEND_SALES_URL],
  })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/sales", salesRoutes);
app.get("/health", (req, res) => {
  res.json({ health: "OK" });
});
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
