import React from "react"

const navigation = [
  { name: "Dashboard", path: "/dashboard", icon: "📊" },
  { name: "Products", path: "/products", icon: "📦" },
  { name: "Orders", path: "/orders", icon: "🛒" },
  { name: "Customers", path: "/customers", icon: "👥" },
  { name: "Discounts", path: "/discounts", icon: "🏷️" },
  { name: "Bulk Upload", path: "/bulk-upload", icon: "📤" },
  { name: "Settings", path: "/settings", icon: "⚙️" },
]

export default function AdminLayout({ children, currentPath }: { children: React.ReactNode; currentPath: string }) {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Bar */}
      <header className="bg-white border-b shadow-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-indigo-600">Myntra Clone Admin</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">v1.0.0</span>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r min-h-[calc(100vh-57px)]">
          <nav className="p-4 space-y-1">
            {navigation.map((item) => (
              <a
                key={item.path}
                href={item.path}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  currentPath === item.path
                    ? "bg-indigo-50 text-indigo-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </a>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
