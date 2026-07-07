import { Module } from "@medusajs/framework/utils"
import ReviewModuleService from "./service"

/**
 * Review custom module definition.
 *
 * Registration key: "review" → `container.resolve("review")`.
 */
export default Module("review", {
  service: ReviewModuleService,
})