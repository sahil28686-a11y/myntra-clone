import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * GET /admin/analytics/dashboard
 *
 * Admin-authenticated (v2 admin routes are auth-protected by default).
 * Returns aggregate analytics for the admin dashboard widget:
 *   - total_orders: count of all orders
 *   - total_revenue: sum of order totals (paise)
 *   - total_products: count of all products
 *   - recent_orders: last 5 orders (id, display_id, status, total, created_at)
 *
 * Resolves the order module ("order") and product module ("product") from
 * the container. Handles empty-state (0 orders/products) without throwing.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const orderService = req.scope.resolve("order") as any
  const productService = req.scope.resolve("product") as any

  // Total orders + recent 5
  const [orders, totalOrders] = await orderService.listAndCountOrders(
    {},
    { order: { created_at: "DESC" }, take: 5 }
  )

  // Total revenue — sum all order totals (paise)
  let totalRevenue = 0
  if (totalOrders > 0) {
    // Fetch all orders with only the total field to compute the sum.
    // listAndCountOrders with take:null or a high limit would work, but for
    // large datasets we use a separate aggregation. For a small/medium store
    // this is acceptable; a production deployment should use a DB aggregate.
    const allOrders = await orderService.listOrders(
      {},
      { select: ["total"] }
    )
    totalRevenue = allOrders.reduce(
      (sum: number, o: any) => sum + (o.total || 0),
      0
    )
  }

  // Total products
  const [, totalProducts] = await productService.listAndCountProducts({})

  // Map recent orders to a safe subset of fields
  const recentOrders = orders.map((o: any) => ({
    id: o.id,
    display_id: o.display_id,
    status: o.status,
    total: o.total,
    created_at: o.created_at,
  }))

  res.json({
    total_orders: totalOrders,
    total_revenue: totalRevenue,
    total_products: totalProducts,
    recent_orders: recentOrders,
  })
}
