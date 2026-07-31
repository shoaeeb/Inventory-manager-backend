import sql from "../db.js";

//GEt /api/sales
export const getAllSales = async (req, res) => {
  const { search = "", from, to, page = 1 } = req.query;
  const limit = 10;
  const offset = (parseInt(page) - 1) * limit;

  const fromDate = from ? new Date(from) : new Date("2000-01-01");
  const toDate = to ? new Date(to) : new Date();

  try {
    const sales = await sql`
    SELECT * FROM sales
    WHERE user_id=${req.user.userId}
    AND item_name ILIKE ${"%" + search + "%"}
    AND sold_at >= ${fromDate}
    AND sold_at <=${toDate}
    ORDER BY sold_at DESC
    LIMIT ${limit} OFFSET ${offset}
    `;
    const [{ count }] = await sql`
    SELECT COUNT(*) FROM sales
    where user_id=${req.user.userId}
    AND item_name ILIKE ${"%" + search + "%"}
    AND sold_at >= ${fromDate}
    AND sold_at <=${toDate}
    `;

    res.json({
      sales,
      total: parseInt(count),
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
};

//POST /api/sales

export const createSale = async (req, res) => {
  const { inventory_id, quantity_sold, sale_price, note } = req.body;
  if (!inventory_id || !quantity_sold || !sale_price) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    //check item exxists and belongs to user

    const [item] = await sql`SELECT *FROM inventory
        WHERE id = ${inventory_id} AND user_id = ${req.user.userId}
        `;

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }
    if (item.quantity < quantity_sold) {
      return res.status(400).json({
        error: `Not enough stock. Current Stock ${item.quantity}`,
      });
    }

    const [sale] = await sql`
        INSERT INTO sales (user_id,inventory_id,item_name,item_image,quantity_sold,sale_price,note)
        VALUES (
        ${req.user.userId},
        ${inventory_id},
        ${item.name},
        ${item.image_url},
        ${parseInt(quantity_sold)},
        ${parseFloat(sale_price)},
        ${note || null} 
        ) RETURNING *
        `;

    //decrease inventory quantity
    await sql`UPDATE inventory
        SET quantity = quantity - ${parseInt(quantity_sold)}
        WHERE id=${inventory_id}
        `;

    res.status(201).json(sale);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
};

//DElETE /api/sales/:id

export const deleteSale = async (req, res) => {
  const { id } = req.params;

  try {
    const [sale] = await sql`
        SELECT * FROM sales
        WHERE id = ${id} AND user_id=${req.user.userId}
        `;

    if (!sale) {
      return res.status(404).json({ error: "Sale Not Found" });
    }
    if (sale.inventory_id) {
      await sql`
            UPDATE inventory
            SET quantity = quantity + ${sale.quantity_sold}
            WHERE id = ${sale.inventory_id}
            `;
    }
    await sql`DELETE FROM sales where id = ${id}`;
    res.json({ message: "Sale deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "SERVER ERROR" });
  }
};

export const getSalesStats = async (req, res) => {
  try {
    const [totals] = await sql`
        SELECT
          COALESCE(SUM(sale_price * quantity_sold), 0) as total_revenue,
          COALESCE(SUM(quantity_sold), 0) as total_sold
        FROM sales
        WHERE user_id = ${req.user.userId}
      `;

    const [monthlyRevenue] = await sql`
        SELECT COALESCE(SUM(sale_price * quantity_sold), 0) as revenue
        FROM sales
        WHERE user_id = ${req.user.userId}
        AND sold_at >= date_trunc('month', now())
      `;

    const [bestSeller] = await sql`
        SELECT item_name, item_image, SUM(quantity_sold) as total_sold
        FROM sales
        WHERE user_id = ${req.user.userId}
        GROUP BY item_name, item_image
        ORDER BY total_sold DESC
        LIMIT 1
      `;

    const recentSales = await sql`
        SELECT * FROM sales
        WHERE user_id = ${req.user.userId}
        ORDER BY sold_at DESC
        LIMIT 3
      `;

    res.json({
      totalRevenue: parseFloat(totals.total_revenue).toFixed(2),
      totalSold: parseInt(totals.total_sold),
      monthlyRevenue: parseFloat(monthlyRevenue.revenue).toFixed(2),
      bestSeller: bestSeller || null,
      recentSales,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
};
