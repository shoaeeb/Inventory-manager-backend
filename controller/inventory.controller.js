import sql from "../db.js";
import { upload, cloudinary } from "../config/cloudinary.js";
import { inventorySchema } from "../middleware/inventory.validation.js";

export const getAllInventoryList = async (req, res, next) => {
  const {
    search = "",
    minPrice,
    maxPrice,
    category = "",
    page = 1,
  } = req.query;
  const limit = 5;
  const offset = (parseInt(page) - 1) * limit;
  const min = minPrice ? parseFloat(minFloat) : 0;
  const max = maxPrice ? parseFloat(maxPrice) : 9999999;

  try {
    const items = await sql`
        SELECT * from inventory
        WHERE user_id = ${req.user.userId}
        AND name ILIKE ${"%" + search + "%"}
        AND price >=${min}
        AND price <=${max}
        AND (${category} = '' OR category = ${category})
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
        `;
    const [{ count }] = await sql`
        SELECT COUNT(*) FROM inventory
        WHERE user_id = ${req.user.userId}
        AND name ILIKE ${"%" + search + "%"}
        AND price >= ${min}
        And price <= ${max}
        AND (${category} = '' OR category = ${category})
        `;
    res.json({
      items,
      total: parseInt(count),
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
};

export const createInventory = async (req, res) => {
  const result = inventorySchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  }
  if (!req.file) {
    return res.status(400).json({
      errors: {
        picture: ["Image is required"],
      },
    });
  }

  const { name, price, quantity, category } = result.data;

  try {
    const [item] = await sql`
    INSERT INTO inventory (user_id,name,price,quantity,category,image_url,image_public_id)
    VALUES (${req.user.userId},${name},${parseFloat(
      price
    )},${quantity},${category},${req.file.path} ,${
      req.file.filename
    }) RETURNING * `;

    res.status(201).json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Server Error",
    });
  }
};

export const getInventoryItemById = async (req, res) => {
  const { id } = req.params;

  try {
    const item = await sql`SELECT  * from inventory where id=${id}`;
    if (item.length < 0) {
      return res.status(404).json({ error: "Item not Found" });
    } else {
      return res.status(200).json({ item: item[0] });
    }
  } catch (error) {
    console.error("updateInventory error", error);
    res.status(500).json({ error: "Server Error" });
  }
};

export const updateInventory = async (req, res) => {
  const { id } = req.params;
  const updateSchema = inventorySchema.partial();
  const result = updateSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      errors: result.error.flatten().fieldErrors,
    });
  }
  try {
    const [existing] = await sql`
    SELECT * FROM inventory
    WHERE id=${id} AND user_id=${req.user.userId}`;

    if (!existing) {
      return res.status(404).json({ error: "Item not found" });
    }
    let image_url = existing.image_url;
    let image_public_id = existing.image_public_id;

    if (req.file) {
      await cloudinary.uploader.destroy(existing.image_public_id);
      image_url = req.file.path;
      image_public_id = req.file.filename;
    }

    const { name, price, quantity, category } = result.data;

    const [updated] = await sql`
    UPDATE inventory
    SET
      name = ${name || existing.name},
      price = ${price ? parseFloat(price) : existing.price},
      quantity= ${quantity || existing.quantity},
      category = ${category || existing.category},
      image_url = ${image_url},
      image_public_id = ${image_public_id}
    WHERE id = ${id} AND user_id = ${req.user.userId}
    RETURNING *
  `;
    res.json(updated);
  } catch (error) {
    console.error("updateInventory error", error);
    res.status(500).json({ error: "Server Error" });
  }
};

export const deleteInventory = async (req, res) => {
  const { id } = req.params;
  try {
    const [item] = await sql`
    SELECT * FROM inventory
    WHERE id=${id} AND user_id=${req.user.userId}
    `;
    if (!item) {
      return res.status(404).json({ error: "Item Not Found" });
    }

    await cloudinary.uploader.destroy(item.image_public_id);
    await sql`DELETE FROM inventory where id=${id}`;

    res.json({ message: "Delete Successfully" });
  } catch (error) {
    console.error("deleteInventory error", error);
    res.status(500).json({ error: "Server Error" });
  }
};
