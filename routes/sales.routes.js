import express from "express";
import {
  getAllSales,
  createSale,
  deleteSale,
  getSalesStats,
} from "../controller/sales.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(authenticate);

router.get("/stats", getSalesStats);
router.get("/", getAllSales);
router.post("/", createSale);
router.delete("/:id", deleteSale);

export default router;
