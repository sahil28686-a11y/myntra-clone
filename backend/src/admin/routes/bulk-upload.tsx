import React, { useState } from "react"

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setUploading(true)
    setError("")
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/admin/products/bulk-upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (res.ok) {
        setResult(data)
      } else {
        setError(data.error || "Upload failed")
      }
    } catch (err: any) {
      setError(err.message || "Upload failed")
    }
    setUploading(false)
  }

  const downloadTemplate = () => {
    const csv = `title,handle,description,material,categories,variants,options,images,weight,height,width,length
"Men's Cotton T-Shirt","mens-cotton-tshirt","Premium cotton t-shirt","Cotton","Men|Topwear","[{\"title\":\"Size\",\"prices\":[{\"amount\":599,\"currency_code\":\"INR\"}]}]","[{\"title\":\"Size\",\"values\":[\"S\",\"M\",\"L\",\"XL\"]}]","https://via.placeholder.com/400",200,30,20,5
"Women's Silk Dress","womens-silk-dress","Elegant silk dress","Silk","Women|Ethnic","[{\"title\":\"Size\",\"prices\":[{\"amount\":1999,\"currency_code\":\"INR\"}]}]","[{\"title\":\"Size\",\"values\":[\"S\",\"M\",\"L\"]}]","https://via.placeholder.com/400",300,40,25,10
`
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "bulk-upload-template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Bulk Product Upload</h1>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Upload Products via CSV</h2>
          <p className="text-sm text-gray-600 mb-4">
            Upload a CSV file with product data. Required columns: title, handle.
            Optional columns: description, material, categories, variants, options, images, weight, height, width, length.
          </p>
          <button
            onClick={downloadTemplate}
            className="text-indigo-600 hover:text-indigo-800 text-sm underline"
          >
            Download CSV Template
          </button>
        </div>

        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select CSV File
            </label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <button
            type="submit"
            disabled={!file || uploading}
            className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload & Import"}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-green-700 font-medium">{result.message}</p>
            {result.errors?.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-red-600 font-medium">Errors:</p>
                <ul className="list-disc list-inside text-sm text-red-600">
                  {result.errors.map((err: string, i: number) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 bg-white rounded-lg shadow p-6 max-w-2xl">
        <h2 className="text-lg font-semibold mb-2">CSV Format Guide</h2>
        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>title</strong> (required) — Product name</p>
          <p><strong>handle</strong> (required) — URL-friendly slug</p>
          <p><strong>description</strong> — Product description</p>
          <p><strong>categories</strong> — Pipe-separated: "Men|Topwear"</p>
          <p><strong>variants</strong> — JSON array of variant objects with prices</p>
          <p><strong>options</strong> — JSON array of option objects with values</p>
          <p><strong>images</strong> — Pipe-separated image URLs</p>
          <p><strong>weight, height, width, length</strong> — Dimensions in grams/cm</p>
        </div>
      </div>
    </div>
  )
}
