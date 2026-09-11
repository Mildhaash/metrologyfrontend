"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, Search, CheckCircle2, XCircle, Eye } from "lucide-react";
import { apiFetch } from "@/lib/api";
import GradeBadge from "@/components/ui/GradeBadge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface Product {
  id: string;
  name: string;
  total_scans: number;
  compliant_count: number;
  non_compliant_count: number;
  latest_status: string;
  latest_scan: string | null;
  latest_scan_id: string | null;
  fields: Record<string, string>;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);
      const data = await apiFetch(`/products?${params.toString()}`);
      setProducts(data.products);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchProducts();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">
            All scanned products and their compliance history
          </p>
        </div>
        <Link
          href="/dashboard/scan"
          className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-xl transition-all"
        >
          Scan New Product
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="">All Status</option>
            <option value="compliant">Compliant</option>
            <option value="non-compliant">Non-Compliant</option>
          </select>
          <button
            onClick={handleSearch}
            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-xl transition-all"
          >
            Search
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading products..." />
      ) : error ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl p-4 text-sm space-y-3">
          <p>{error}</p>
          <p className="text-xs text-amber-600">
            Make sure the backend is running (e.g. `uvicorn main:app --port
            8000` in `backend/`) and MongoDB is connected (MONGODB_URI in
            `backend/.env`).
          </p>
          <button
            onClick={fetchProducts}
            className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg transition-all"
          >
            Retry
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package className="w-12 h-12 text-orange-300 mb-3" />
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            No products found
          </h2>
          <p className="text-sm text-gray-500">
            {search
              ? "Try a different search term"
              : "Scan a product label to get started"}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-orange-100 shadow-sm p-5 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{p.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {p.total_scans} scan{p.total_scans !== 1 ? "s" : ""}
                  </p>
                </div>
                <GradeBadge percent={p.total_scans > 0 ? Math.round((p.compliant_count / p.total_scans) * 100) : 100} size={40} />
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  {p.compliant_count} compliant
                </span>
                <span className="flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-red-500" />
                  {p.non_compliant_count} non-compliant
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {p.latest_scan
                    ? new Date(p.latest_scan).toLocaleDateString()
                    : "Never scanned"}
                </span>
                {p.latest_scan_id && (
                  <Link
                    href={`/dashboard/scan/results/${p.latest_scan_id}`}
                    className="flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
