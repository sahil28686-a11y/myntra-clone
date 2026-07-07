/**
 * Ambient declaration for `@medusajs/admin-sdk`.
 *
 * The real `@medusajs/admin-sdk` package (which exports `defineWidgetConfig`
 * and `defineRouteConfig`) is provided at build time by `@medusajs/admin-bundler`;
 * it is not installed as a standalone dependency in this backend. This minimal,
 * permissive ambient stub lets the v2 admin extensions under `src/admin/**`
 * type-check. The admin-bundler resolves the real implementation when
 * `medusa build` runs.
 *
 * v2 admin extension patterns:
 *   Widget  — `src/admin/widgets/<name>.tsx`:
 *     const Widget = () => <div>...</div>
 *     export const config = defineWidgetConfig({ zone: "order.list.before" })
 *     export default Widget
 *   Route   — `src/admin/routes/<path>.tsx`:
 *     const Page = () => <div>...</div>
 *     export const config = defineRouteConfig({ label: "My Page", icon: MyIcon })
 *     export default Page
 *
 * Valid widget zones are defined in @medusajs/admin-shared INJECTION_ZONES
 * (e.g. "order.list.before", "product.details.side", "customer.list.after",
 * "promotion.list.before", "store.details.before", "topbar", ...).
 */
declare module "@medusajs/admin-sdk" {
  import type { ComponentType } from "react"

  export interface WidgetConfig {
    zone: string
    [key: string]: unknown
  }

  export interface RouteConfig {
    label: string
    icon?: ComponentType<any>
    path?: string
    [key: string]: unknown
  }

  export function defineWidgetConfig(config: WidgetConfig): WidgetConfig
  export function defineRouteConfig(config: RouteConfig): RouteConfig
}