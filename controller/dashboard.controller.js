import sql from "../db.js";

export const getDashboardStats = async (req, res) => {
  try {
    const [stats] = await sql`
     SELECT
         COALESCE(SUM(quantity)) as total_items,
        COALESCE(SUM(price * quantity ),0) as total_value,
        MAX(price) as highest_price
        FROM inventory
        where user_id = ${req.user.userId}
    `;
    const [mostExpensive] = await sql`
    SELECT name,price,image_url,quantity,category from inventory
    WHERE user_id = ${req.user.userId}
    ORDER BY price DESC
    LIMIT 1
    `;

    const recentItems = await sql`
    SELECT name,price,image_url,quantity,category FROM inventory
    WHERE user_id = ${req.user.userId}
    ORDER BY created_at DESC
    LIMIT 3
    `;
    res.json({
      totalItems: parseInt(stats.total_items),
      totalValue: parseFloat(stats.total_value).toFixed(2),
      highestPrice: parseFloat(stats.highest_price || 0).toFixed(2),
      mostExpensive: mostExpensive || null,
      recentItems,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server Error" });
  }
};
