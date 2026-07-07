"use client"

import { useState } from "react"
import Link from "next/link"
import { HiOutlineSearch, HiOutlineShoppingBag, HiOutlineUser, HiOutlineHeart, HiOutlineMenu, HiX } from "react-icons/hi"

const navCategories = [
  { name: "Men", href: "/products?category=men" },
  { name: "Women", href: "/products?category=women" },
  { name: "Kids", href: "/products?category=kids" },
  { name: "Home & Living", href: "/products?category=home-living" },
  { name: "Beauty", href: "/products?category=beauty" },
  { name: "Studio", href: "/studio" },
]

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between h-[80px] max-w-[1280px] mx-auto px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center mr-8">
          <div
            className="w-[53px] h-[36px]"
            style={{
              backgroundImage: 'url("https://constant.myntassets.com/web/assets/img/MyntraWebSprite_27_01_2021.png")',
              backgroundPosition: "-462px 0",
              backgroundSize: "1404px 105px",
            }}
          />
        </Link>

        {/* Navigation */}
        <nav className="flex items-center h-full space-x-0">
          {navCategories.map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              className="px-[17px] py-0 text-[14px] font-bold uppercase tracking-[0.15em] text-[#282c3f] hover:text-[#ff3f6c] transition-colors h-full flex items-center"
            >
              {cat.name}
            </Link>
          ))}
        </nav>

        {/* Search Bar */}
        <div className="flex-1 max-w-[400px] mx-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for products, brands and more"
              className="w-full bg-[#f5f5f6] rounded-[0_4px_4px_0] h-[40px] pl-[40px] pr-4 text-[14px] text-[#696e79] focus:outline-none focus:bg-white focus:border focus:border-[#e9e9eb]"
            />
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#696e79]" size={18} />
          </div>
        </div>

        {/* User Icons */}
        <div className="flex items-center space-x-6">
          <Link href="/account" className="flex flex-col items-center text-[12px] font-semibold text-[#282c3f]">
            <HiOutlineUser size={20} />
            <span className="mt-1">Profile</span>
          </Link>
          <Link href="/account/wishlist" className="flex flex-col items-center text-[12px] font-semibold text-[#282c3f]">
            <HiOutlineHeart size={20} />
            <span className="mt-1">Wishlist</span>
          </Link>
          <Link href="/cart" className="flex flex-col items-center text-[12px] font-semibold text-[#282c3f]">
            <HiOutlineShoppingBag size={20} />
            <span className="mt-1">Bag</span>
          </Link>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between h-[56px] px-4">
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menu">
          {mobileMenuOpen ? <HiX size={24} /> : <HiOutlineMenu size={24} />}
        </button>
        <Link href="/" className="flex items-center">
          <span className="text-xl font-bold text-[#282c3f]">MYNTRA</span>
        </Link>
        <div className="flex items-center space-x-4">
          <button onClick={() => setSearchOpen(!searchOpen)} aria-label="Search">
            <HiOutlineSearch size={22} />
          </button>
          <Link href="/cart" aria-label="Cart">
            <HiOutlineShoppingBag size={22} />
          </Link>
        </div>
      </div>

      {/* Mobile Search */}
      {searchOpen && (
        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for products, brands and more"
              className="w-full bg-[#f5f5f6] rounded-[4px] h-[40px] pl-[40px] pr-4 text-[14px] focus:outline-none"
              autoFocus
            />
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#696e79]" size={18} />
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <nav className="px-4 py-3 space-y-3">
            {navCategories.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                className="block text-sm font-bold uppercase tracking-wider text-[#282c3f] py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {cat.name}
              </Link>
            ))}
            <hr className="border-[#e9e9eb]" />
            <Link href="/account" className="block text-sm text-[#696e79] py-1">Profile</Link>
            <Link href="/account/orders" className="block text-sm text-[#696e79] py-1">Orders</Link>
            <Link href="/account/wishlist" className="block text-sm text-[#696e79] py-1">Wishlist</Link>
          </nav>
        </div>
      )}
    </header>
  )
}
