"use client";

import { useState } from "react";
import {
  ShoppingCart,
  Search,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface PlatformListing {
  platform: string;
  platform_id: string;
  color: string;
  search_url: string;
  compliance_score: number | null;
  price: number | null;
  status: string;
}

interface CompareResult {
  product_name: string;
  reference_fields: Record<string, string>;
  total_scans: number;
  listings: PlatformListing[];
}

export default function ECommercePage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const data = await apiFetch(
        `/ecommerce/compare?product_name=${encodeURIComponent(query)}`
      );
      setResults(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to search products");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-gray-400";
    if (score >= 80) return "text-green-600";
    if (score >= 50) return "text-amber-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number | null) => {
    if (score === null) return "bg-gray-50";
    if (score >= 80) return "bg-green-50";
    if (score >= 50) return "bg-amber-50";
    return "bg-red-50";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">E-Commerce</h1>
        <p className="text-sm text-gray-500 mt-1">
          Compare product compliance across e-commerce platforms
        </p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Enter product name to compare across platforms..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Compare
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {!results && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShoppingCart className="w-12 h-12 text-orange-300 mb-3" />
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Search a product
          </h2>
          <p className="text-sm text-gray-500 max-w-sm">
            Enter a product name to see how it&apos;s listed across different
            e-commerce platforms and check its compliance score.
          </p>
        </div>
      )}

      {results && (
        <div className="space-y-6">
          {/* Product info */}
          <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {results.product_name}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {results.total_scans} scan{results.total_scans !== 1 ? "s" : ""} in
                  database
                </p>
              </div>
              {results.total_scans > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-center">
                  <p className="text-lg font-bold text-green-700">
                    {results.listings[0]?.compliance_score ?? "N/A"}%
                  </p>
                  <p className="text-[10px] text-green-600">Compliance</p>
                </div>
              )}
            </div>

            {Object.keys(results.reference_fields).length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(results.reference_fields).map(([k, v]) => (
                  <div key={k} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                      {k.replace(/_/g, " ")}
                    </p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5 truncate">
                      {String(v) || "—"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Platform listings */}
          <div className="grid sm:grid-cols-2 gap-4">
            {results.listings.map((listing) => (
              <div
                key={listing.platform_id}
                className="bg-white rounded-2xl border border-orange-100 shadow-sm p-5 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: listing.color }}
                    >
                      {listing.platform.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {listing.platform}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {listing.status === "found" ? "Listed" : "Not found"}
                      </p>
                    </div>
                  </div>
                  {listing.compliance_score !== null ? (
                    <div
                      className={`px-3 py-1.5 rounded-lg text-sm font-bold ${getScoreBg(
                        listing.compliance_score
                      )} ${getScoreColor(listing.compliance_score)}`}
                    >
                      {listing.compliance_score}%
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">N/A</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {listing.compliance_score !== null ? (
                      listing.compliance_score >= 80 ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Good compliance
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-600">
                          <XCircle className="w-3.5 h-3.5" /> Needs review
                        </span>
                      )
                    ) : (
                      <span>No scan data</span>
                    )}
                  </div>
                  <a
                    href={listing.search_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700"
                  >
                    View on {listing.platform}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
