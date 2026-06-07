import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  createInventory,
  deleteInventory,
  getAllInventoryList,
  getInventoryItemById,
  updateInventory,
} from "../controller/inventory.controller.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

router.get("/", authenticate, getAllInventoryList);
router.post("/", authenticate, upload.single("picture"), createInventory);
router.put("/:id", authenticate, upload.single("picture"), updateInventory);
router.get("/item/:id", authenticate, getInventoryItemById);
router.delete("/:id", authenticate, deleteInventory);

export default router;
