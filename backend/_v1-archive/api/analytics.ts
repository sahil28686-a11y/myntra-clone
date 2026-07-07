import { Router } from "express"

const router = Router()

// GET /admin/analytics/dashboard — Dashboard analytics data
router.get("/admin/analytics/dashboard", async (req, res) => {
  const medusa = req.app.get("medusa")

  try {
    const [totalProducts, totalOrders, totalCustomers, totalRevenue] = await Promise.all([
      medusa.services.productService.count(),
      medusa.services.orderService.count(),
      medusa.services.customerService.count(),
      medusa.services.orderService
        .list({ status: "completed" }, { take: 10000 })
        .then((orders: any[]) =>
          orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0)
        ),
    ])

    // Recent orders
    const recentOrders = await medusa.services.orderService.list(
      {},
      { take: 10, order: { created_at: "DESC" } }
    )

    // Orders by status
    const allOrders = await medusa.services.orderService.list({}, { take: 10000 })
    const ordersByStatus = allOrders.reduce((acc: Record<string, number>, o: any) => {
      acc[o.status] = (acc[o.status] || 0) + 1
      return acc
    }, {})

    return res.json({
      total_products: totalProducts,
      total_orders: totalOrders,
      total_customers: totalCustomers,
      total_revenue: totalRevenue,
      recent_orders: recentOrders,
      orders_by_status: ordersByStatus,
    })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
})

export default router
