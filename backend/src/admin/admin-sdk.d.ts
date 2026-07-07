/**
 * Ambient declaration for `@medusajs/admin-sdk`.
 *
 * The real `@medusajs/admin-sdk` package (which exports `defineWidgetConfig`)
 * is provided at build time by `@medusajs/admin-bundler`; it is not installed
 * as a standalone dependency in this backend. This minimal, permissive ambient
 * stub lets the v2 admin widget stubs under `src/admin/**` type-check without
 * building out full admin features (M1 scope: compile-only). The admin-bundler
 * resolves the real implementation when `medusa build` runs.
 */
declare module "@medusajs/admin-sdk" {
  export function defineWidgetConfig(config: Record<string, unknown>): any
}