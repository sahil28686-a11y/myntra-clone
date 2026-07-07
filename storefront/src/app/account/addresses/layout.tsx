import AccountGuard from "@/components/auth/AccountGuard"

export default function AddressesLayout({ children }: { children: React.ReactNode }) {
  return <AccountGuard>{children}</AccountGuard>
}