import AccountGuard from "@/components/auth/AccountGuard"

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return <AccountGuard>{children}</AccountGuard>
}