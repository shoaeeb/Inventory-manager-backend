import { z } from "zod";

export const inventorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z
    .string()
    .min(1, "Price is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Price must be a positive number",
    }),
  quantity: z.coerce
    .number()
    .int()
    .min(1, "Quantity must be atleast 1")
    .default(1),
  category: z.string().default("Uncategorized"),
});
