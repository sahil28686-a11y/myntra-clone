// Standalone admin panel server — serves the admin SPA without needing PostgreSQL/Redis
const express = require("express");
const path = require("path");
const app = express();
const PORT = 3456;

// Serve the admin panel HTML (same as backend/src/api/admin-server.ts)
app.get("/admin", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Myntra Clone — Admin Panel</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            myntra: {
              primary: '#FF3F6C',
              secondary: '#526CD0',
              text: '#282C3F',
              muted: '#94969F',
              border: '#E5E5E5',
            }
          }
        }
      }
    }
  </script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    a { text-decoration: none; color: inherit; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module">
    import React from 'https://esm.sh/react@18.2.0';
    import ReactDOM from 'https://esm.sh/react-dom@18.2.0/client';

    function App() {
      const [path, setPath] = React.useState(window.location.pathname);

      React.useEffect(() => {
        const handlePopState = () => setPath(window.location.pathname);
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
      }, []);

      const navigate = (to) => {
        window.history.pushState({}, '', to);
        setPath(to);
      };

      React.useEffect(() => {
        const handleClick = (e) => {
          const anchor = e.target.closest('a');
          if (anchor && anchor.href && anchor.href.startsWith(window.location.origin)) {
            const url = new URL(anchor.href);
            if (url.pathname.startsWith('/')) {
              e.preventDefault();
              navigate(url.pathname);
            }
          }
        };
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
      }, []);

      return React.createElement(AdminRouter, { path, navigate });
    }

    function AdminRouter({ path, navigate }) {
      if (path === '/' || path === '/dashboard') {
        return React.createElement(DashboardPage, { navigate });
      }
      if (path === '/products') {
        return React.createElement(ProductsPage, { navigate });
      }
      if (path === '/orders') {
        return React.createElement(OrdersPage, { navigate });
      }
      if (path === '/customers') {
        return React.createElement(CustomersPage, { navigate });
      }
      if (path === '/discounts') {
        return React.createElement(DiscountsPage, { navigate });
      }
      if (path === '/bulk-upload') {
        return React.createElement(BulkUploadPage, { navigate });
      }
      if (path === '/settings') {
        return React.createElement(SettingsPage, { navigate });
      }
      return React.createElement(NotFoundPage, { navigate });
    }

    function DashboardPage({ navigate }) {
      const [data, setData] = React.useState(null);
      const [loading, setLoading] = React.useState(true);

      React.useEffect(() => {
        fetch('/admin/analytics/dashboard')
          .then(r => r.json())
          .then(d => { setData(d); setLoading(false); })
          .catch(() => setLoading(false));
      }, []);

      return React.createElement(AdminLayout, {
        currentPath: '/dashboard',
        navigate,
        children: React.createElement('div', { className: 'p-6' },
          React.createElement('h1', { className: 'text-2xl font-bold mb-6' }, 'Dashboard Overview'),
          loading
            ? React.createElement('div', { className: 'text-center py-8 text-gray-500' }, 'Loading...')
            : data
            ? React.createElement(React.Fragment, null,
                React.createElement('div', { className: 'grid grid-cols-4 gap-4 mb-8' },
                  React.createElement(StatCard, { label: 'Total Products', value: data.total_products, color: 'blue' }),
                  React.createElement(StatCard, { label: 'Total Orders', value: data.total_orders, color: 'green' }),
                  React.createElement(StatCard, { label: 'Total Customers', value: data.total_customers, color: 'purple' }),
                  React.createElement(StatCard, { label: 'Total Revenue', value: '\u20B9' + (data.total_revenue || 0).toLocaleString(), color: 'orange' }),
                ),
                React.createElement('div', { className: 'grid grid-cols-2 gap-6' },
                  React.createElement('div', { className: 'bg-white rounded-lg shadow p-4' },
                    React.createElement('h2', { className: 'text-lg font-semibold mb-4' }, 'Orders by Status'),
                    React.createElement('div', { className: 'space-y-2' },
                      Object.entries(data.orders_by_status || {}).map(([status, count]) =>
                        React.createElement('div', { key: status, className: 'flex justify-between items-center' },
                          React.createElement('span', { className: 'capitalize' }, status),
                          React.createElement('span', { className: 'font-medium' }, count),
                        )
                      )
                    )
                  ),
                  React.createElement('div', { className: 'bg-white rounded-lg shadow p-4' },
                    React.createElement('h2', { className: 'text-lg font-semibold mb-4' }, 'Recent Orders'),
                    React.createElement('div', { className: 'space-y-3' },
                      (data.recent_orders || []).slice(0, 5).map((order) =>
                        React.createElement('div', { key: order.id, className: 'flex justify-between items-center text-sm' },
                          React.createElement('span', { className: 'text-gray-600 truncate max-w-[200px]' }, order.id.slice(0, 12) + '...'),
                          React.createElement('span', { className: 'font-medium' }, '\u20B9' + (order.total || 0).toLocaleString()),
                        )
                      )
                    )
                  )
                )
              )
            : React.createElement('div', { className: 'text-center py-8 text-red-500' }, 'Failed to load dashboard data')
        )
      });
    }

    function StatCard({ label, value, color }) {
      const colors = {
        blue: 'bg-blue-50 border-blue-200 text-blue-700',
        green: 'bg-green-50 border-green-200 text-green-700',
        purple: 'bg-purple-50 border-purple-200 text-purple-700',
        orange: 'bg-orange-50 border-orange-200 text-orange-700',
      };
      return React.createElement('div', { className: 'rounded-lg border p-4 ' + (colors[color] || colors.blue) },
        React.createElement('div', { className: 'text-sm opacity-75' }, label),
        React.createElement('div', { className: 'text-2xl font-bold mt-1' }, value),
      );
    }

    function ProductsPage({ navigate }) {
      const [products, setProducts] = React.useState([]);
      const [loading, setLoading] = React.useState(true);
      const [page, setPage] = React.useState(1);
      const [totalPages, setTotalPages] = React.useState(1);
      const [showForm, setShowForm] = React.useState(false);
      const [editProduct, setEditProduct] = React.useState(null);
      const [formData, setFormData] = React.useState({ title: '', handle: '', description: '' });

      React.useEffect(() => {
        setLoading(true);
        fetch('/admin/products?page=' + page + '&limit=20')
          .then(r => r.json())
          .then(d => { setProducts(d.products || []); setTotalPages(d.total_pages || 1); setLoading(false); })
          .catch(() => setLoading(false));
      }, [page]);

      const handleSubmit = async (e) => {
        e.preventDefault();
        const url = editProduct ? '/admin/products/' + editProduct.id : '/admin/products';
        const method = editProduct ? 'PUT' : 'POST';
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
        if (res.ok) { setShowForm(false); setEditProduct(null); setFormData({ title: '', handle: '', description: '' }); setPage(1); }
      };

      const handleDelete = async (id) => {
        if (!confirm('Delete this product?')) return;
        await fetch('/admin/products/' + id, { method: 'DELETE' });
        setPage(1);
      };

      return React.createElement(AdminLayout, { currentPath: '/products', navigate,
        children: React.createElement('div', { className: 'p-6' },
          React.createElement('div', { className: 'flex justify-between items-center mb-6' },
            React.createElement('h1', { className: 'text-2xl font-bold' }, 'Products'),
            React.createElement('button', {
              onClick: () => { setEditProduct(null); setFormData({ title: '', handle: '', description: '' }); setShowForm(true); },
              className: 'bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700'
            }, 'Add Product'),
          ),
          showForm && React.createElement(Modal, {
            title: editProduct ? 'Edit Product' : 'New Product',
            onClose: () => setShowForm(false),
            children: React.createElement('form', { onSubmit: handleSubmit, className: 'space-y-4' },
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Title *'),
                React.createElement('input', { type: 'text', value: formData.title, onChange: (e) => setFormData({...formData, title: e.target.value}), className: 'w-full border rounded px-3 py-2', required: true }),
              ),
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Handle'),
                React.createElement('input', { type: 'text', value: formData.handle, onChange: (e) => setFormData({...formData, handle: e.target.value}), className: 'w-full border rounded px-3 py-2' }),
              ),
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Description'),
                React.createElement('textarea', { value: formData.description, onChange: (e) => setFormData({...formData, description: e.target.value}), className: 'w-full border rounded px-3 py-2', rows: 3 }),
              ),
              React.createElement('div', { className: 'flex justify-end space-x-3' },
                React.createElement('button', { type: 'button', onClick: () => setShowForm(false), className: 'px-4 py-2 border rounded text-gray-700 hover:bg-gray-50' }, 'Cancel'),
                React.createElement('button', { type: 'submit', className: 'px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700' }, editProduct ? 'Update' : 'Create'),
              ),
            ),
          }),
          loading
            ? React.createElement('div', { className: 'text-center py-8 text-gray-500' }, 'Loading...')
            : React.createElement(React.Fragment, null,
                React.createElement('div', { className: 'bg-white rounded-lg shadow overflow-hidden' },
                  React.createElement('table', { className: 'w-full' },
                    React.createElement('thead', { className: 'bg-gray-50' },
                      React.createElement('tr', null,
                        React.createElement('th', { className: 'text-left px-4 py-3 text-sm font-medium text-gray-600' }, 'Title'),
                        React.createElement('th', { className: 'text-left px-4 py-3 text-sm font-medium text-gray-600' }, 'Handle'),
                        React.createElement('th', { className: 'text-left px-4 py-3 text-sm font-medium text-gray-600' }, 'Status'),
                        React.createElement('th', { className: 'text-right px-4 py-3 text-sm font-medium text-gray-600' }, 'Actions'),
                      ),
                    ),
                    React.createElement('tbody', { className: 'divide-y' },
                      products.map((product) =>
                        React.createElement('tr', { key: product.id, className: 'hover:bg-gray-50' },
                          React.createElement('td', { className: 'px-4 py-3' }, product.title),
                          React.createElement('td', { className: 'px-4 py-3 text-sm text-gray-500' }, product.handle),
                          React.createElement('td', { className: 'px-4 py-3' },
                            React.createElement('span', { className: 'px-2 py-1 rounded text-xs ' + (product.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600') }, product.status || 'draft'),
                          ),
                          React.createElement('td', { className: 'px-4 py-3 text-right' },
                            React.createElement('button', { onClick: () => { setEditProduct(product); setFormData({ title: product.title, handle: product.handle, description: product.description }); setShowForm(true); }, className: 'text-indigo-600 hover:text-indigo-800 mr-3 text-sm' }, 'Edit'),
                            React.createElement('button', { onClick: () => handleDelete(product.id), className: 'text-red-600 hover:text-red-800 text-sm' }, 'Delete'),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                React.createElement('div', { className: 'flex justify-center items-center space-x-4 mt-4' },
                  React.createElement('button', { onClick: () => setPage(Math.max(1, page - 1)), disabled: page === 1, className: 'px-3 py-1 border rounded disabled:opacity-50' }, 'Previous'),
                  React.createElement('span', { className: 'text-sm text-gray-600' }, 'Page ' + page + ' of ' + totalPages),
                  React.createElement('button', { onClick: () => setPage(Math.min(totalPages, page + 1)), disabled: page === totalPages, className: 'px-3 py-1 border rounded disabled:opacity-50' }, 'Next'),
                ),
              ),
        ),
      });
    }

    function OrdersPage({ navigate }) {
      const [orders, setOrders] = React.useState([]);
      const [loading, setLoading] = React.useState(true);
      const [page, setPage] = React.useState(1);
      const [totalPages, setTotalPages] = React.useState(1);
      const [statusFilter, setStatusFilter] = React.useState('all');
      const [selectedOrder, setSelectedOrder] = React.useState(null);

      React.useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams({ page: String(page), limit: '20' });
        if (statusFilter !== 'all') params.set('status', statusFilter);
        fetch('/admin/orders?' + params.toString())
          .then(r => r.json())
          .then(d => { setOrders(d.orders || []); setTotalPages(d.total_pages || 1); setLoading(false); })
          .catch(() => setLoading(false));
      }, [page, statusFilter]);

      const viewOrder = async (id) => {
        const res = await fetch('/admin/orders/' + id);
        const data = await res.json();
        setSelectedOrder(data.order);
      };

      const updateStatus = async (id, status) => {
        await fetch('/admin/orders/' + id + '/status', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
        setPage(1);
        if (selectedOrder?.id === id) viewOrder(id);
      };

      const statuses = ['all', 'pending', 'completed', 'processing', 'canceled', 'requires_action'];

      return React.createElement(AdminLayout, { currentPath: '/orders', navigate,
        children: React.createElement('div', { className: 'p-6' },
          React.createElement('h1', { className: 'text-2xl font-bold mb-6' }, 'Orders'),
          React.createElement('div', { className: 'flex space-x-2 mb-6' },
            statuses.map((s) =>
              React.createElement('button', {
                key: s,
                onClick: () => { setStatusFilter(s); setPage(1); },
                className: 'px-3 py-1 rounded text-sm ' + (statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'),
              }, s.charAt(0).toUpperCase() + s.slice(1)),
            ),
          ),
          loading
            ? React.createElement('div', { className: 'text-center py-8 text-gray-500' }, 'Loading...')
            : React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-3 gap-6' },
                React.createElement('div', { className: 'lg:col-span-2' },
                  React.createElement('div', { className: 'bg-white rounded-lg shadow overflow-hidden' },
                    React.createElement('table', { className: 'w-full' },
                      React.createElement('thead', { className: 'bg-gray-50' },
                        React.createElement('tr', null,
                          React.createElement('th', { className: 'text-left px-4 py-3 text-sm font-medium text-gray-600' }, 'Order ID'),
                          React.createElement('th', { className: 'text-left px-4 py-3 text-sm font-medium text-gray-600' }, 'Status'),
                          React.createElement('th', { className: 'text-right px-4 py-3 text-sm font-medium text-gray-600' }, 'Total'),
                          React.createElement('th', { className: 'text-right px-4 py-3 text-sm font-medium text-gray-600' }, 'Date'),
                          React.createElement('th', { className: 'text-right px-4 py-3 text-sm font-medium text-gray-600' }, 'Actions'),
                        ),
                      ),
                      React.createElement('tbody', { className: 'divide-y' },
                        orders.map((order) =>
                          React.createElement('tr', { key: order.id, className: 'hover:bg-gray-50' },
                            React.createElement('td', { className: 'px-4 py-3 text-sm font-mono' }, (order.display_id || order.id.slice(0, 12)) + '...'),
                            React.createElement('td', { className: 'px-4 py-3' },
                              React.createElement('span', { className: 'px-2 py-1 rounded text-xs ' + (
                                order.status === 'completed' ? 'bg-green-100 text-green-700' :
                                order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                                order.status === 'canceled' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              )}, order.status),
                            ),
                            React.createElement('td', { className: 'px-4 py-3 text-right font-medium' }, '\u20B9' + (order.total || 0).toLocaleString()),
                            React.createElement('td', { className: 'px-4 py-3 text-right text-sm text-gray-500' }, new Date(order.created_at).toLocaleDateString()),
                            React.createElement('td', { className: 'px-4 py-3 text-right' },
                              React.createElement('button', { onClick: () => viewOrder(order.id), className: 'text-indigo-600 hover:text-indigo-800 text-sm' }, 'View'),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  React.createElement('div', { className: 'flex justify-center items-center space-x-4 mt-4' },
                    React.createElement('button', { onClick: () => setPage(Math.max(1, page - 1)), disabled: page === 1, className: 'px-3 py-1 border rounded disabled:opacity-50' }, 'Previous'),
                    React.createElement('span', { className: 'text-sm text-gray-600' }, 'Page ' + page + ' of ' + totalPages),
                    React.createElement('button', { onClick: () => setPage(Math.min(totalPages, page + 1)), disabled: page === totalPages, className: 'px-3 py-1 border rounded disabled:opacity-50' }, 'Next'),
                  ),
                ),
                selectedOrder && React.createElement('div', { className: 'bg-white rounded-lg shadow p-4' },
                  React.createElement('h2', { className: 'text-lg font-semibold mb-4' }, 'Order Details'),
                  React.createElement('div', { className: 'space-y-3 text-sm' },
                    React.createElement('div', null, React.createElement('span', { className: 'text-gray-500' }, 'ID: '), React.createElement('span', { className: 'ml-2 font-mono' }, selectedOrder.id.slice(0, 16) + '...')),
                    React.createElement('div', null, React.createElement('span', { className: 'text-gray-500' }, 'Status: '), React.createElement('span', { className: 'ml-2 capitalize' }, selectedOrder.status)),
                    React.createElement('div', null, React.createElement('span', { className: 'text-gray-500' }, 'Total: '), React.createElement('span', { className: 'ml-2 font-medium' }, '\u20B9' + (selectedOrder.total || 0).toLocaleString())),
                    React.createElement('div', null, React.createElement('span', { className: 'text-gray-500' }, 'Items: '), React.createElement('span', { className: 'ml-2' }, selectedOrder.items?.length || 0)),
                    React.createElement('div', { className: 'pt-3 border-t' },
                      React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Update Status'),
                      React.createElement('select', { value: selectedOrder.status, onChange: (e) => updateStatus(selectedOrder.id, e.target.value), className: 'w-full border rounded px-2 py-1 text-sm' },
                        React.createElement('option', { value: 'pending' }, 'Pending'),
                        React.createElement('option', { value: 'processing' }, 'Processing'),
                        React.createElement('option', { value: 'completed' }, 'Completed'),
                        React.createElement('option', { value: 'canceled' }, 'Canceled'),
                      ),
                    ),
                  ),
                ),
              ),
        ),
      });
    }

    function CustomersPage({ navigate }) {
      const [customers, setCustomers] = React.useState([]);
      const [loading, setLoading] = React.useState(true);
      const [page, setPage] = React.useState(1);
      const [totalPages, setTotalPages] = React.useState(1);
      const [search, setSearch] = React.useState('');
      const [selectedCustomer, setSelectedCustomer] = React.useState(null);

      React.useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams({ page: String(page), limit: '20' });
        if (search) params.set('q', search);
        fetch('/admin/customers?' + params.toString())
          .then(r => r.json())
          .then(d => { setCustomers(d.customers || []); setTotalPages(d.total_pages || 1); setLoading(false); })
          .catch(() => setLoading(false));
      }, [page, search]);

      const viewCustomer = async (id) => {
        const res = await fetch('/admin/customers/' + id);
        const data = await res.json();
        setSelectedCustomer(data.customer);
      };

      return React.createElement(AdminLayout, { currentPath: '/customers', navigate,
        children: React.createElement('div', { className: 'p-6' },
          React.createElement('h1', { className: 'text-2xl font-bold mb-6' }, 'Customers'),
          React.createElement('div', { className: 'mb-6' },
            React.createElement('input', { type: 'text', placeholder: 'Search customers...', value: search, onChange: (e) => { setSearch(e.target.value); setPage(1); }, className: 'w-full max-w-md border rounded px-3 py-2' }),
          ),
          loading
            ? React.createElement('div', { className: 'text-center py-8 text-gray-500' }, 'Loading...')
            : React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-3 gap-6' },
                React.createElement('div', { className: 'lg:col-span-2' },
                  React.createElement('div', { className: 'bg-white rounded-lg shadow overflow-hidden' },
                    React.createElement('table', { className: 'w-full' },
                      React.createElement('thead', { className: 'bg-gray-50' },
                        React.createElement('tr', null,
                          React.createElement('th', { className: 'text-left px-4 py-3 text-sm font-medium text-gray-600' }, 'Name'),
                          React.createElement('th', { className: 'text-left px-4 py-3 text-sm font-medium text-gray-600' }, 'Email'),
                          React.createElement('th', { className: 'text-left px-4 py-3 text-sm font-medium text-gray-600' }, 'Phone'),
                          React.createElement('th', { className: 'text-right px-4 py-3 text-sm font-medium text-gray-600' }, 'Orders'),
                          React.createElement('th', { className: 'text-right px-4 py-3 text-sm font-medium text-gray-600' }, 'Actions'),
                        ),
                      ),
                      React.createElement('tbody', { className: 'divide-y' },
                        customers.map((customer) =>
                          React.createElement('tr', { key: customer.id, className: 'hover:bg-gray-50' },
                            React.createElement('td', { className: 'px-4 py-3' }, (customer.first_name || '') + ' ' + (customer.last_name || '')),
                            React.createElement('td', { className: 'px-4 py-3 text-sm text-gray-500' }, customer.email),
                            React.createElement('td', { className: 'px-4 py-3 text-sm text-gray-500' }, customer.phone || '-'),
                            React.createElement('td', { className: 'px-4 py-3 text-right' }, customer.orders?.length || 0),
                            React.createElement('td', { className: 'px-4 py-3 text-right' },
                              React.createElement('button', { onClick: () => viewCustomer(customer.id), className: 'text-indigo-600 hover:text-indigo-800 text-sm' }, 'View'),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  React.createElement('div', { className: 'flex justify-center items-center space-x-4 mt-4' },
                    React.createElement('button', { onClick: () => setPage(Math.max(1, page - 1)), disabled: page === 1, className: 'px-3 py-1 border rounded disabled:opacity-50' }, 'Previous'),
                    React.createElement('span', { className: 'text-sm text-gray-600' }, 'Page ' + page + ' of ' + totalPages),
                    React.createElement('button', { onClick: () => setPage(Math.min(totalPages, page + 1)), disabled: page === totalPages, className: 'px-3 py-1 border rounded disabled:opacity-50' }, 'Next'),
                  ),
                ),
                selectedCustomer && React.createElement('div', { className: 'bg-white rounded-lg shadow p-4' },
                  React.createElement('h2', { className: 'text-lg font-semibold mb-4' }, 'Customer Details'),
                  React.createElement('div', { className: 'space-y-3 text-sm' },
                    React.createElement('div', null, React.createElement('span', { className: 'text-gray-500' }, 'Name: '), React.createElement('span', { className: 'ml-2' }, (selectedCustomer.first_name || '') + ' ' + (selectedCustomer.last_name || ''))),
                    React.createElement('div', null, React.createElement('span', { className: 'text-gray-500' }, 'Email: '), React.createElement('span', { className: 'ml-2' }, selectedCustomer.email)),
                    React.createElement('div', null, React.createElement('span', { className: 'text-gray-500' }, 'Phone: '), React.createElement('span', { className: 'ml-2' }, selectedCustomer.phone || '-')),
                    React.createElement('div', null, React.createElement('span', { className: 'text-gray-500' }, 'Orders: '), React.createElement('span', { className: 'ml-2' }, selectedCustomer.orders?.length || 0)),
                    React.createElement('div', null, React.createElement('span', { className: 'text-gray-500' }, 'Joined: '), React.createElement('span', { className: 'ml-2' }, new Date(selectedCustomer.created_at).toLocaleDateString())),
                  ),
                ),
              ),
        ),
      });
    }

    function DiscountsPage({ navigate }) {
      const [discounts, setDiscounts] = React.useState([]);
      const [loading, setLoading] = React.useState(true);
      const [page, setPage] = React.useState(1);
      const [totalPages, setTotalPages] = React.useState(1);
      const [showForm, setShowForm] = React.useState(false);
      const [formData, setFormData] = React.useState({ code: '', type: 'percentage', value: 0, description: '' });

      React.useEffect(() => {
        setLoading(true);
        fetch('/admin/discounts?page=' + page + '&limit=20')
          .then(r => r.json())
          .then(d => { setDiscounts(d.discounts || []); setTotalPages(d.total_pages || 1); setLoading(false); })
          .catch(() => setLoading(false));
      }, [page]);

      const handleSubmit = async (e) => {
        e.preventDefault();
        await fetch('/admin/discounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: formData.code,
            rule: { type: formData.type, value: formData.value, description: formData.description },
          }),
        });
        setShowForm(false);
        setFormData({ code: '', type: 'percentage', value: 0, description: '' });
        setPage(1);
      };

      const handleDelete = async (id) => {
        if (!confirm('Delete this discount?')) return;
        await fetch('/admin/discounts/' + id, { method: 'DELETE' });
        setPage(1);
      };

      return React.createElement(AdminLayout, { currentPath: '/discounts', navigate,
        children: React.createElement('div', { className: 'p-6' },
          React.createElement('div', { className: 'flex justify-between items-center mb-6' },
            React.createElement('h1', { className: 'text-2xl font-bold' }, 'Discounts'),
            React.createElement('button', { onClick: () => setShowForm(true), className: 'bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700' }, 'Create Discount'),
          ),
          showForm && React.createElement(Modal, {
            title: 'New Discount',
            onClose: () => setShowForm(false),
            children: React.createElement('form', { onSubmit: handleSubmit, className: 'space-y-4' },
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Code *'),
                React.createElement('input', { type: 'text', value: formData.code, onChange: (e) => setFormData({...formData, code: e.target.value.toUpperCase()}), className: 'w-full border rounded px-3 py-2', required: true }),
              ),
              React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
                React.createElement('div', null,
                  React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Type'),
                  React.createElement('select', { value: formData.type, onChange: (e) => setFormData({...formData, type: e.target.value}), className: 'w-full border rounded px-3 py-2' },
                    React.createElement('option', { value: 'percentage' }, 'Percentage'),
                    React.createElement('option', { value: 'fixed' }, 'Fixed Amount'),
                    React.createElement('option', { value: 'free_shipping' }, 'Free Shipping'),
                  ),
                ),
                React.createElement('div', null,
                  React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Value'),
                  React.createElement('input', { type: 'number', value: formData.value, onChange: (e) => setFormData({...formData, value: Number(e.target.value)}), className: 'w-full border rounded px-3 py-2', min: 0 }),
                ),
              ),
              React.createElement('div', { className: 'flex justify-end space-x-3' },
                React.createElement('button', { type: 'button', onClick: () => setShowForm(false), className: 'px-4 py-2 border rounded text-gray-700 hover:bg-gray-50' }, 'Cancel'),
                React.createElement('button', { type: 'submit', className: 'px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700' }, 'Create'),
              ),
            ),
          }),
          loading
            ? React.createElement('div', { className: 'text-center py-8 text-gray-500' }, 'Loading...')
            : React.createElement(React.Fragment, null,
                React.createElement('div', { className: 'bg-white rounded-lg shadow overflow-hidden' },
                  React.createElement('table', { className: 'w-full' },
                    React.createElement('thead', { className: 'bg-gray-50' },
                      React.createElement('tr', null,
                        React.createElement('th', { className: 'text-left px-4 py-3 text-sm font-medium text-gray-600' }, 'Code'),
                        React.createElement('th', { className: 'text-left px-4 py-3 text-sm font-medium text-gray-600' }, 'Type'),
                        React.createElement('th', { className: 'text-left px-4 py-3 text-sm font-medium text-gray-600' }, 'Value'),
                        React.createElement('th', { className: 'text-left px-4 py-3 text-sm font-medium text-gray-600' }, 'Status'),
                        React.createElement('th', { className: 'text-right px-4 py-3 text-sm font-medium text-gray-600' }, 'Actions'),
                      ),
                    ),
                    React.createElement('tbody', { className: 'divide-y' },
                      discounts.map((discount) =>
                        React.createElement('tr', { key: discount.id, className: 'hover:bg-gray-50' },
                          React.createElement('td', { className: 'px-4 py-3 font-mono font-medium' }, discount.code),
                          React.createElement('td', { className: 'px-4 py-3 text-sm capitalize' }, discount.rule?.type || '-'),
                          React.createElement('td', { className: 'px-4 py-3' }, discount.rule?.type === 'percentage' ? discount.rule.value + '%' : '\u20B9' + (discount.rule?.value || 0)),
                          React.createElement('td', { className: 'px-4 py-3' },
                            React.createElement('span', { className: 'px-2 py-1 rounded text-xs ' + (discount.is_disabled ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700') }, discount.is_disabled ? 'Disabled' : 'Active'),
                          ),
                          React.createElement('td', { className: 'px-4 py-3 text-right' },
                            React.createElement('button', { onClick: () => handleDelete(discount.id), className: 'text-red-600 hover:text-red-800 text-sm' }, 'Delete'),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                React.createElement('div', { className: 'flex justify-center items-center space-x-4 mt-4' },
                  React.createElement('button', { onClick: () => setPage(Math.max(1, page - 1)), disabled: page === 1, className: 'px-3 py-1 border rounded disabled:opacity-50' }, 'Previous'),
                  React.createElement('span', { className: 'text-sm text-gray-600' }, 'Page ' + page + ' of ' + totalPages),
                  React.createElement('button', { onClick: () => setPage(Math.min(totalPages, page + 1)), disabled: page === totalPages, className: 'px-3 py-1 border rounded disabled:opacity-50' }, 'Next'),
                ),
              ),
        ),
      });
    }

    function BulkUploadPage({ navigate }) {
      const [file, setFile] = React.useState(null);
      const [uploading, setUploading] = React.useState(false);
      const [result, setResult] = React.useState(null);
      const [error, setError] = React.useState('');

      const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;
        setUploading(true);
        setError('');
        setResult(null);
        try {
          const formData = new FormData();
          formData.append('file', file);
          const res = await fetch('/admin/products/bulk-upload', { method: 'POST', body: formData });
          const data = await res.json();
          if (res.ok) setResult(data);
          else setError(data.error || 'Upload failed');
        } catch (err) { setError(err.message || 'Upload failed'); }
        setUploading(false);
      };

      return React.createElement(AdminLayout, { currentPath: '/bulk-upload', navigate,
        children: React.createElement('div', { className: 'p-6' },
          React.createElement('h1', { className: 'text-2xl font-bold mb-6' }, 'Bulk Product Upload'),
          React.createElement('div', { className: 'bg-white rounded-lg shadow p-6 max-w-2xl' },
            React.createElement('h2', { className: 'text-lg font-semibold mb-2' }, 'Upload Products via CSV'),
            React.createElement('p', { className: 'text-sm text-gray-600 mb-4' }, 'Upload a CSV file with product data. Required columns: title, handle.'),
            React.createElement('form', { onSubmit: handleUpload, className: 'space-y-4' },
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Select CSV File'),
                React.createElement('input', { type: 'file', accept: '.csv,.xlsx,.xls', onChange: (e) => setFile(e.target.files?.[0] || null), className: 'w-full border rounded px-3 py-2', required: true }),
              ),
              React.createElement('button', { type: 'submit', disabled: !file || uploading, className: 'bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 disabled:opacity-50' }, uploading ? 'Uploading...' : 'Upload & Import'),
            ),
            error && React.createElement('div', { className: 'mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm' }, error),
            result && React.createElement('div', { className: 'mt-4 p-3 bg-green-50 border border-green-200 rounded' },
              React.createElement('p', { className: 'text-green-700 font-medium' }, result.message),
              result.errors?.length > 0 && React.createElement('div', { className: 'mt-2' },
                React.createElement('p', { className: 'text-sm text-red-600 font-medium' }, 'Errors:'),
                React.createElement('ul', { className: 'list-disc list-inside text-sm text-red-600' },
                  result.errors.map((err, i) => React.createElement('li', { key: i }, err)),
                ),
              ),
            ),
          ),
        ),
      });
    }

    function SettingsPage({ navigate }) {
      const [store, setStore] = React.useState(null);
      const [loading, setLoading] = React.useState(true);
      const [saving, setSaving] = React.useState(false);
      const [formData, setFormData] = React.useState({ name: '', brand_name: '', logo_url: '', theme_id: 'light' });
      const [saveMessage, setSaveMessage] = React.useState('');

      React.useEffect(() => {
        fetch('/admin/settings')
          .then(r => r.json())
          .then(d => { setStore(d.store); setFormData({ name: d.store.name || '', brand_name: d.store.brand_name || '', logo_url: d.store.logo_url || '', theme_id: d.store.theme_id || 'light' }); setLoading(false); })
          .catch(() => setLoading(false));
      }, []);

      const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSaveMessage('');
        const res = await fetch('/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
        setSaveMessage(res.ok ? 'Settings saved!' : 'Failed to save');
        setSaving(false);
      };

      return React.createElement(AdminLayout, { currentPath: '/settings', navigate,
        children: React.createElement('div', { className: 'p-6' },
          React.createElement('h1', { className: 'text-2xl font-bold mb-6' }, 'Store Settings'),
          loading
            ? React.createElement('div', { className: 'text-center py-8 text-gray-500' }, 'Loading...')
            : React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-2 gap-6' },
                React.createElement('div', { className: 'bg-white rounded-lg shadow p-6' },
                  React.createElement('h2', { className: 'text-lg font-semibold mb-4' }, 'General Settings'),
                  React.createElement('form', { onSubmit: handleSave, className: 'space-y-4' },
                    React.createElement('div', null,
                      React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Store Name'),
                      React.createElement('input', { type: 'text', value: formData.name, onChange: (e) => setFormData({...formData, name: e.target.value}), className: 'w-full border rounded px-3 py-2' }),
                    ),
                    React.createElement('div', null,
                      React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Brand Name'),
                      React.createElement('input', { type: 'text', value: formData.brand_name, onChange: (e) => setFormData({...formData, brand_name: e.target.value}), className: 'w-full border rounded px-3 py-2' }),
                    ),
                    React.createElement('div', null,
                      React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Logo URL'),
                      React.createElement('input', { type: 'text', value: formData.logo_url, onChange: (e) => setFormData({...formData, logo_url: e.target.value}), className: 'w-full border rounded px-3 py-2' }),
                    ),
                    React.createElement('div', null,
                      React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Theme'),
                      React.createElement('select', { value: formData.theme_id, onChange: (e) => setFormData({...formData, theme_id: e.target.value}), className: 'w-full border rounded px-3 py-2' },
                        React.createElement('option', { value: 'light' }, 'Light'),
                        React.createElement('option', { value: 'dark' }, 'Dark'),
                        React.createElement('option', { value: 'minimal' }, 'Minimal'),
                        React.createElement('option', { value: 'vibrant' }, 'Vibrant'),
                      ),
                    ),
                    React.createElement('button', { type: 'submit', disabled: saving, className: 'bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 disabled:opacity-50' }, saving ? 'Saving...' : 'Save Settings'),
                    saveMessage && React.createElement('p', { className: 'text-sm ' + (saveMessage.includes('saved') ? 'text-green-600' : 'text-red-600') }, saveMessage),
                  ),
                ),
                React.createElement('div', { className: 'bg-white rounded-lg shadow p-6' },
                  React.createElement('h2', { className: 'text-lg font-semibold mb-4' }, 'Payment Configuration'),
                  React.createElement('div', { className: 'space-y-3 text-sm' },
                    React.createElement('div', { className: 'flex justify-between items-center' },
                      React.createElement('span', null, 'Razorpay'),
                      React.createElement('span', { className: 'px-2 py-1 bg-green-100 text-green-700 rounded text-xs' }, 'Configured'),
                    ),
                    React.createElement('div', { className: 'flex justify-between items-center' },
                      React.createElement('span', null, 'Cash on Delivery'),
                      React.createElement('span', { className: 'px-2 py-1 bg-green-100 text-green-700 rounded text-xs' }, 'Enabled'),
                    ),
                  ),
                ),
              ),
        ),
      });
    }

    function NotFoundPage({ navigate }) {
      return React.createElement(AdminLayout, { currentPath: '', navigate,
        children: React.createElement('div', { className: 'p-6 text-center' },
          React.createElement('h1', { className: 'text-4xl font-bold text-gray-300 mb-4' }, '404'),
          React.createElement('p', { className: 'text-gray-500' }, 'Page not found'),
        ),
      });
    }

    function AdminLayout({ currentPath, navigate, children }) {
      const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: '\uD83D\uDCCA' },
        { name: 'Products', path: '/products', icon: '\uD83D\uDCE6' },
        { name: 'Orders', path: '/orders', icon: '\uD83D\uDED2' },
        { name: 'Customers', path: '/customers', icon: '\uD83D\uDC65' },
        { name: 'Discounts', path: '/discounts', icon: '\uD83C\uDFF7\uFE0F' },
        { name: 'Bulk Upload', path: '/bulk-upload', icon: '\uD83D\uDCE4' },
        { name: 'Settings', path: '/settings', icon: '\u2699\uFE0F' },
      ];

      return React.createElement('div', { className: 'min-h-screen bg-gray-100' },
        React.createElement('header', { className: 'bg-white border-b shadow-sm' },
          React.createElement('div', { className: 'flex items-center justify-between px-6 py-3' },
            React.createElement('h1', { className: 'text-xl font-bold text-indigo-600' }, 'Myntra Clone Admin'),
            React.createElement('span', { className: 'text-sm text-gray-500' }, 'v1.0.0'),
          ),
        ),
        React.createElement('div', { className: 'flex' },
          React.createElement('aside', { className: 'w-64 bg-white border-r min-h-[calc(100vh-57px)]' },
            React.createElement('nav', { className: 'p-4 space-y-1' },
              navItems.map((item) =>
                React.createElement('a', {
                  key: item.path,
                  href: item.path,
                  onClick: (e) => { e.preventDefault(); navigate(item.path); },
                  className: 'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ' + (currentPath === item.path ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'),
                },
                  React.createElement('span', null, item.icon),
                  React.createElement('span', null, item.name),
                ),
              ),
            ),
          ),
          React.createElement('main', { className: 'flex-1' }, children),
        ),
      );
    }

    function Modal({ title, onClose, children }) {
      return React.createElement('div', { className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50' },
        React.createElement('div', { className: 'bg-white rounded-lg p-6 w-full max-w-lg' },
          React.createElement('div', { className: 'flex justify-between items-center mb-4' },
            React.createElement('h2', { className: 'text-xl font-semibold' }, title),
            React.createElement('button', { onClick: onClose, className: 'text-gray-400 hover:text-gray-600 text-xl' }, '\u2715'),
          ),
          children,
        ),
      );
    }

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(App));
  </script>
</body>
</html>
  `);
});

// Mock API routes for the admin panel to work without backend
app.get("/admin/analytics/dashboard", (req, res) => {
  res.json({
    total_products: 0,
    total_orders: 0,
    total_customers: 0,
    total_revenue: 0,
    orders_by_status: { pending: 0, completed: 0, processing: 0, canceled: 0 },
    recent_orders: [],
  });
});

app.get("/admin/products", (req, res) => {
  res.json({ products: [], total_pages: 1 });
});

app.get("/admin/orders", (req, res) => {
  res.json({ orders: [], total_pages: 1 });
});

app.get("/admin/customers", (req, res) => {
  res.json({ customers: [], total_pages: 1 });
});

app.get("/admin/discounts", (req, res) => {
  res.json({ discounts: [], total_pages: 1 });
});

app.get("/admin/settings", (req, res) => {
  res.json({ store: { name: "Myntra Clone", brand_name: "Myntra Clone", logo_url: "", theme_id: "light" } });
});

app.listen(PORT, () => {
  console.log(`Admin panel running at http://localhost:${PORT}/admin`);
});
