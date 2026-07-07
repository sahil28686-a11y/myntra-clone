import Link from "next/link"

interface FooterLink {
  name: string
  href: string
}

interface FooterSection {
  title: string
  links?: FooterLink[]
  type?: string
}

const footerSections: FooterSection[] = [
  {
    title: "ONLINE SHOPPING",
    links: [
      { name: "Men", href: "/products?category=men" },
      { name: "Women", href: "/products?category=women" },
      { name: "Kids", href: "/products?category=kids" },
      { name: "Home & Living", href: "/products?category=home-living" },
      { name: "Beauty", href: "/products?category=beauty" },
      { name: "Gift Cards", href: "/gift-cards" },
      { name: "Myntra Insider", href: "/insider" },
    ],
  },
  {
    title: "CUSTOMER POLICIES",
    links: [
      { name: "Contact Us", href: "/contact" },
      { name: "FAQ", href: "/faq" },
      { name: "T&C", href: "/terms" },
      { name: "Terms of Use", href: "/terms-of-use" },
      { name: "Track Orders", href: "/account/orders" },
      { name: "Shipping", href: "/shipping" },
      { name: "Cancellation", href: "/cancellation" },
      { name: "Returns", href: "/returns" },
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Grievance Officer", href: "/grievance" },
    ],
  },
  {
    title: "EXPERIENCE MYNTRA APP ON MOBILE",
    type: "app",
  },
  {
    title: "KEEP IN TOUCH",
    type: "social",
  },
  {
    title: "USEFUL LINKS",
    type: "useful-links",
  },
]

export default function Footer() {
  return (
    <footer className="bg-[#fafbfc] text-[#282c3f] border-t border-[#e9e9eb]">
      <div className="max-w-[1280px] mx-auto px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Online Shopping */}
          <div>
            <h4 className="text-[12px] font-bold text-[#282c3f] mb-4 tracking-[0.3em] uppercase">
              ONLINE SHOPPING
            </h4>
            <ul className="space-y-2">
              {footerSections[0].links!.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-[15px] text-[#696b79] hover:text-[#282c3f] transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Policies */}
          <div>
            <h4 className="text-[12px] font-bold text-[#282c3f] mb-4 tracking-[0.3em] uppercase">
              CUSTOMER POLICIES
            </h4>
            <ul className="space-y-2">
              {footerSections[1].links!.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-[15px] text-[#696b79] hover:text-[#282c3f] transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* App Download */}
          <div>
            <h4 className="text-[12px] font-bold text-[#282c3f] mb-4 tracking-[0.3em] uppercase">
              EXPERIENCE MYNTRA APP ON MOBILE
            </h4>
            <div className="flex gap-2 mb-6">
              <div className="w-[120px] h-[40px] bg-[#282c3f] rounded flex items-center justify-center text-white text-[10px] font-bold">
                Google Play
              </div>
              <div className="w-[120px] h-[40px] bg-[#282c3f] rounded flex items-center justify-center text-white text-[10px] font-bold">
                App Store
              </div>
            </div>

            <h4 className="text-[12px] font-bold text-[#282c3f] mb-4 tracking-[0.3em] uppercase">
              KEEP IN TOUCH
            </h4>
            <div className="flex gap-3">
              <div className="w-[28px] h-[28px] bg-[#282c3f] rounded-full" />
              <div className="w-[28px] h-[28px] bg-[#282c3f] rounded-full" />
              <div className="w-[28px] h-[28px] bg-[#282c3f] rounded-full" />
              <div className="w-[28px] h-[28px] bg-[#282c3f] rounded-full" />
            </div>
          </div>

          {/* Useful Links & Promises */}
          <div>
            <h4 className="text-[12px] font-bold text-[#282c3f] mb-4 tracking-[0.3em] uppercase">
              USEFUL LINKS
            </h4>
            <ul className="space-y-2 mb-6">
              <li><Link href="/contact" className="text-[15px] text-[#696b79]">Contact Us</Link></li>
              <li><Link href="/faq" className="text-[15px] text-[#696b79]">FAQ</Link></li>
              <li><Link href="/terms" className="text-[15px] text-[#696b79]">T&C</Link></li>
            </ul>

            <h4 className="text-[12px] font-bold text-[#282c3f] mb-4 tracking-[0.3em] uppercase">
              MYNTRA PROMISES
            </h4>
            <div className="flex items-center gap-2 text-[15px] text-[#696b79]">
              <span className="text-[#ff3f6c] font-bold">✓</span>
              100% ORIGINAL guarantee for all products at myntra.com
            </div>
            <div className="flex items-center gap-2 text-[15px] text-[#696b79] mt-2">
              <span className="text-[#ff3f6c] font-bold">✓</span>
              Return within 30 days of receiving your order
            </div>
          </div>
        </div>

        <hr className="border-[#e9e9eb] my-8" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center text-[13px] text-[#94969f]">
          <div className="flex items-center gap-1">
            <span className="font-bold text-[#282c3f]">© 2026</span>
            <span>www.myntra.com. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-1 mt-2 md:mt-0">
            <span>A Medusa.js + Next.js 14 Production</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
