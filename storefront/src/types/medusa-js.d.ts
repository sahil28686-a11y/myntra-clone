// Type declarations for @medusajs/medusa-js
declare module "@medusajs/medusa-js" {
  interface MedusaClient {
    products: {
      list(params?: any): Promise<{ products: any[]; count: number; offset: number; limit: number }>
      retrieve(id: string): Promise<{ product: any }>
    }
    collections: {
      list(): Promise<{ collections: any[] }>
      retrieve(handle: string): Promise<{ collection: any }>
    }
    productCategories: {
      list(): Promise<{ product_categories: any[] }>
    }
    carts: {
      create(data?: any): Promise<{ cart: any }>
      retrieve(id: string): Promise<{ cart: any }>
      update(id: string, data: any): Promise<{ cart: any }>
      complete(id: string): Promise<{ type: string; data: any }>
      createPaymentSessions(id: string): Promise<{ cart: any }>
      setPaymentSession(id: string, data: { provider_id: string }): Promise<{ cart: any }>
      addShippingMethod(id: string, data: { option_id: string }): Promise<{ cart: any }>
      lineItems: {
        create(cartId: string, data: { variant_id: string; quantity: number }): Promise<{ cart: any }>
        update(cartId: string, lineItemId: string, data: { quantity: number }): Promise<{ cart: any }>
        delete(cartId: string, lineItemId: string): Promise<{ cart: any }>
      }
    }
    shippingOptions: {
      listCartOptions(cartId: string): Promise<{ shipping_options: any[] }>
    }
    regions: {
      list(): Promise<{ regions: any[] }>
    }
    orders: {
      list(params?: any): Promise<{ orders: any[] }>
      retrieve(id: string): Promise<{ order: any }>
    }
    customers: {
      create(data: any): Promise<{ customer: any }>
      retrieve(): Promise<{ customer: any }>
      update(data: any): Promise<{ customer: any }>
      addresses: {
        addAddress(data: any): Promise<{ customer: any }>
        updateAddress(addressId: string, data: any): Promise<{ customer: any }>
        deleteAddress(addressId: string): Promise<{ customer: any }>
      }
    }
    auth: {
      create(data: { email: string; password: string }): Promise<{ customer: any }>
    }
  }

  interface MedusaConfig {
    baseUrl: string
    maxRetries?: number
  }

  export default class Medusa {
    constructor(config: MedusaConfig)
    products: MedusaClient["products"]
    collections: MedusaClient["collections"]
    productCategories: MedusaClient["productCategories"]
    carts: MedusaClient["carts"]
    shippingOptions: MedusaClient["shippingOptions"]
    regions: MedusaClient["regions"]
    orders: MedusaClient["orders"]
    customers: MedusaClient["customers"]
    auth: MedusaClient["auth"]
  }
}
