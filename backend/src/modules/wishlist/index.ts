import { Module } from "@medusajs/framework/utils"
import WishlistModuleService from "./service"

/**
 * Wishlist custom module definition.
 *
 * Registration key: "wishlist" → `container.resolve("wishlist")`.
 */
export default Module("wishlist", {
  service: WishlistModuleService,
})