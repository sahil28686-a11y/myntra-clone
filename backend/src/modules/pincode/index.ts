import { Module } from "@medusajs/framework/utils"
import PincodeModuleService from "./service"

/**
 * Pincode custom module definition.
 *
 * `Module()` is exported from @medusajs/utils (re-exported via
 * @medusajs/framework/utils). The first argument is the module's
 * registration key — i.e. the container registration name used to resolve
 * the service (`container.resolve("pincode")`). The same pattern is used by
 * every core module (e.g. @medusajs/user dist/index.js).
 */
export default Module("pincode", {
  service: PincodeModuleService,
})