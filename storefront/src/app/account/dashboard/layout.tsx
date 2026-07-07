import AccountGuard from "@/components/auth/AccountGuard"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AccountGuard>{children}</AccountGuard>
}