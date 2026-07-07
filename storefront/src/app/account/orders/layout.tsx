import AccountGuard from "@/components/auth/AccountGuard"

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return <AccountGuard>{children}</AccountGuard>
}