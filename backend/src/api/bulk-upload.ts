import { Router } from "express"
import multer from "multer"
import { parse } from "csv-parse/sync"
import path from "path"
import fs from "fs"

const router = Router()
const upload = multer({ dest: "uploads/bulk/" })

// POST /admin/products/bulk-upload — Bulk import products via CSV
router.post("/admin/products/bulk-upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "CSV file is required" })
  }

  try {
    const filePath = req.file.path
    const content = fs.readFileSync(filePath, "utf-8")
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
    })

    const results = { imported: 0, errors: [] as string[] }

    for (const [index, record] of records.entries()) {
      try {
        // Validate required fields
        if (!record.title || !record.handle) {
          results.errors.push(`Row ${index + 1}: Missing required fields (title, handle)`)
          continue
        }

        // Create product via Medusa's ProductService
        const productService = req.app.get("medusa").services.productService
        await productService.create({
          title: record.title,
          handle: record.handle,
          description: record.description || "",
          material: record.material || "",
          categories: record.categories ? record.categories.split("|").map((c: string) => c.trim()) : [],
          variants: record.variants ? JSON.parse(record.variants) : [],
          options: record.options ? JSON.parse(record.options) : [],
          images: record.images ? record.images.split("|").map((img: string) => img.trim()) : [],
          weight: record.weight ? parseInt(record.weight) : undefined,
          height: record.height ? parseInt(record.height) : undefined,
          width: record.width ? parseInt(record.width) : undefined,
          length: record.length ? parseInt(record.length) : undefined,
          origin_country: record.origin_country || "IN",
          mid_code: record.mid_code || "",
        })

        results.imported++
      } catch (err: any) {
        results.errors.push(`Row ${index + 1}: ${err.message}`)
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(filePath)

    return res.json({
      message: `Imported ${results.imported} of ${records.length} products`,
      ...results,
    })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
})

// POST /admin/upload — Upload product images
router.post("/admin/upload", upload.array("images", 20), async (req, res) => {
  if (!req.files || !(req.files as Express.Multer.File[]).length) {
    return res.status(400).json({ error: "At least one image is required" })
  }

  const files = req.files as Express.Multer.File[]
  const urls = files.map((file) => `/uploads/${file.filename}`)

  return res.json({ urls })
})

export default router
