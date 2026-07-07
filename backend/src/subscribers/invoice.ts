import { MedusaContainer } from "@medusajs/medusa"

type OrderPlacedEvent = {
  id: string
}

export default function invoiceSubscriber(container: MedusaContainer) {
  const eventBusService = container.resolve("eventBusService")

  eventBusService.subscribe("order.placed", async (event: OrderPlacedEvent) => {
    const { id: orderId } = event

    try {
      const orderService = container.resolve("orderService")
      const order = await orderService.retrieve(orderId, {
        select: [
          "id",
          "display_id",
          "email",
          "total",
          "subtotal",
          "tax_total",
          "shipping_total",
          "discount_total",
          "created_at",
        ],
        relations: [
          "items",
          "items.variant",
          "items.variant.product",
          "shipping_address",
          "billing_address",
          "payments",
        ],
      })

      // Generate invoice data
      const invoiceData = {
        invoice_number: `INV-${order.display_id}`,
        order_id: order.id,
        date: order.created_at,
        customer_email: order.email,
        shipping_address: order.shipping_address,
        items: order.items.map((item: any) => ({
          sku: item.variant?.sku || item.variant?.title || "N/A",
          title: item.title,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
        })),
        subtotal: order.subtotal,
        shipping_total: order.shipping_total,
        discount_total: order.discount_total,
        tax_total: order.tax_total,
        total: order.total,
      }

      // TODO: Generate PDF and send email
      // This will be implemented with @react-pdf/renderer or pdfkit
      console.log(`Invoice generated for order ${order.display_id}:`, invoiceData)

      // Store invoice data for later retrieval
      // In production, save to database or file storage
    } catch (err: any) {
      console.error(`Failed to generate invoice for order ${orderId}:`, err.message)
    }
  })
}
