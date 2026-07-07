import React from "react"
import AdminLayout from "./components/Layout"

export default function AdminIndex() {
  return (
    <AdminLayout currentPath="/dashboard">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Welcome to Myntra Clone Admin</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <QuickLinkCard
            title="Manage Products"
            description="Add, edit, and organize your product catalog"
            link="/products"
            icon="📦"
          />
          <QuickLinkCard
            title="View Orders"
            description="Process and manage customer orders"
            link="/orders"
            icon="🛒"
          />
          <QuickLinkCard
            title="Bulk Upload"
            description="Import products via CSV"
            link="/bulk-upload"
            icon="📤"
          />
          <QuickLinkCard
            title="Store Settings"
            description="Configure your store preferences"
            link="/settings"
            icon="⚙️"
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Getting Started</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p>1. <strong>Add products</strong> — Use the Products page to create products manually, or use Bulk Upload for CSV import.</p>
            <p>2. <strong>Configure payments</strong> — Set your Razorpay keys in the .env file for live payments.</p>
            <p>3. <strong>Customize your store</strong> — Update your brand name, logo, and theme in Settings.</p>
            <p>4. <strong>Process orders</strong> — View and manage orders from the Orders page.</p>
            <p>5. <strong>Create discounts</strong> — Set up promotional codes and offers.</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

function QuickLinkCard({ title, description, link, icon }: { title: string; description: string; link: string; icon: string }) {
  return (
    <a
      href={link}
      className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow border border-gray-100"
    >
      <div className="text-2xl mb-2">{icon}</div>
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </a>
  )
}
