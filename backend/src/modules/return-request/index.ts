import { Module } from "@medusajs/framework/utils"
import ReturnRequestModuleService from "./service"

/**
 * Return-request custom module definition.
 *
 * Registration key: "return_request" →
 * `container.resolve("return_request")`.
 */
export default Module("return_request", {
  service: ReturnRequestModuleService,
})