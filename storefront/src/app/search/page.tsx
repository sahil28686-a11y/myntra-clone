"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { HiOutlineSearch } from "react-icons/hi"
import ProductCard from "@/components/product/ProductCard"
import { getProducts, getProductThumbnail, getCheapestVariantPrice } from "@/lib/medusa"

export default function SearchPage() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const result = await getProducts({ q: q.trim(), limit: 20 })
      setResults(
        result.products.map((p: any) => ({
          id: p.id,
          title: p.title,
          handle: p.handle,
          price: getCheapestVariantPrice(p.variants).price,
          originalPrice: getCheapestVariantPrice(p.variants).originalPrice,
          image: getProductThumbnail(p),
          rating: 4.0,
          brand: p.collection?.title || "",
        }))
      )
    } catch (err) {
      console.error("Search failed:", err)
    }
    setLoading(false)
  }, [])

  // Read query from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const q = params.get("q")
    if (q) {
      setQuery(q)
      handleSearch(q)
    }
  }, [handleSearch])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const url = new URL(window.location.href)
    url.searchParams.set("q", query)
    window.history.pushState({}, "", url.toString())
    handleSearch(query)
  }

  return (
    <div className="max-w-container mx-auto px-4 md:px-8 py-6">
      {/* Search Bar */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="relative max-w-2xl mx-auto">
          <input
            type="text"
            placeholder="Search for products, brands and more"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full border-2 border-myntra-border rounded-sm py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-myntra-dark"
            autoFocus
          />
          <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-myntra-muted" size={20} />
        </div>
      </form>

      {/* Results */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-myntra-muted">Searching...</p>
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="text-center py-12">
          <p className="text-myntra-muted text-lg mb-2">No results found for &quot;{query}&quot;</p>
          <p className="text-sm text-myntra-muted">Try checking your spelling or use a different search term</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div>
          <p className="text-sm text-myntra-muted mb-4">
            Showing {results.length} results for &quot;{query}&quot;
          </p>
          <div className="product-grid">
            {results.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {!searched && !loading && (
        <div className="text-center py-12">
          <p className="text-myntra-muted">Search for products by name, brand, or category</p>
        </div>
      )}
    </div>
  )
}
