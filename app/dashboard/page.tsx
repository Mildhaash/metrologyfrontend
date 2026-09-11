'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import {
  Plus,
  Calendar,
  ChevronDown,
  ScanLine,
  CheckCircle2,
  RefreshCcw,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { apiFetch, getToken } from '@/lib/api'

interface DashboardStats {
  total_scans: number
  compliant: number
  non_compliant: number
  violations_by_type: { rule_id: string; count: number }[]
  severity_breakdown: { critical: number; major: number; minor: number; needs_review: number }
}

interface ScanItem {
  _id: string
  extracted_fields?: Record<string, string>
  overall_status: string
  violations_summary?: Record<string, number>
  scanned_at: string
}

const DUMMY_KPIS = {
  totalScanned: 1248,
  totalScannedChange: '+12.4% vs last month',
  compliant: 982,
  complianceRate: 78.7,
  issuesResolved: 186,
  resolutionRate: 68.2,
  issuesPending: 80,
}

const DUMMY_CHART_DATA = [
  { month: 'Jan', scanned: 120, compliant: 90 },
  { month: 'Feb', scanned: 150, compliant: 115 },
  { month: 'Mar', scanned: 140, compliant: 108 },
  { month: 'Apr', scanned: 130, compliant: 100 },
  { month: 'May', scanned: 170, compliant: 128 },
  { month: 'Jun', scanned: 180, compliant: 140 },
  { month: 'Jul', scanned: 205, compliant: 150 },
  { month: 'Aug', scanned: 190, compliant: 145 },
]

const DUMMY_INSPECTIONS = [
  { id: 'INS-2026-1248', product: 'Milma Prime Toned Milk', date: '25 Aug 2026', compliant: true, issues: 0, status: '\u2014' as const },
  { id: 'INS-2026-1247', product: 'Packaged Rice - 5 kg', date: '25 Aug 2026', compliant: false, issues: 2, status: 'Pending' as const },
  { id: 'INS-2026-1246', product: 'Packaged Sugar - 1 kg', date: '24 Aug 2026', compliant: false, issues: 1, status: 'Resolved' as const },
  { id: 'INS-2026-1245', product: 'Cocoa Life Chocolate', date: '24 Aug 2026', compliant: true, issues: 0, status: '\u2014' as const },
  { id: 'INS-2026-1244', product: 'Instant Noodles', date: '23 Aug 2026', compliant: false, issues: 3, status: 'Resolved' as const },
]

const DATE_RANGES = ['Last 8 Months', 'Last 3 Months', 'This Month']

function StatusPill({ label, tone }: { label: string; tone: 'green' | 'red' | 'blue' | 'amber' }) {
  const tones: Record<string, string> = {
    green: 'bg-emerald-50 text-emerald-700',
    red: 'bg-rose-50 text-rose-700',
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
  }
  const dots: Record<string, string> = {
    green: 'bg-emerald-500',
    red: 'bg-rose-500',
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${tones[tone]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[tone]}`} />
      {label}
    </span>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [kpis, setKpis] = useState(DUMMY_KPIS)
  const [chartData, setChartData] = useState(DUMMY_CHART_DATA)
  const [severityData, setSeverityData] = useState([
    { name: 'Critical', value: 0, color: '#DC2626' },
    { name: 'Major', value: 0, color: '#EA580C' },
    { name: 'Minor', value: 0, color: '#CA8A04' },
    { name: 'Needs Review', value: 0, color: '#9333EA' },
  ])
  const [inspections, setInspections] = useState(DUMMY_INSPECTIONS)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState(DATE_RANGES[0])
  const [rangeOpen, setRangeOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!getToken()) {
      router.replace('/?auth=login')
      return
    }
    fetchDashboardData()
  }, [router])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [statsData, scansData] = await Promise.all([
        apiFetch('/dashboard/stats'),
        apiFetch('/dashboard/recent?limit=10'),
      ])

      const stats: DashboardStats = statsData
      const scans: ScanItem[] = scansData.scans

      setKpis({
        totalScanned: stats.total_scans,
        totalScannedChange: '+12.4% vs last month',
        compliant: stats.compliant,
        complianceRate: stats.total_scans > 0
          ? Math.round((stats.compliant / stats.total_scans) * 1000) / 10
          : 0,
        issuesResolved: stats.non_compliant,
        resolutionRate: stats.total_scans > 0
          ? Math.round((stats.non_compliant / stats.total_scans) * 1000) / 10
          : 0,
        issuesPending: stats.violations_by_type?.reduce((sum, v) => sum + v.count, 0) ?? 0,
      })

      if (stats.severity_breakdown) {
        setSeverityData([
          { name: 'Critical', value: stats.severity_breakdown.critical || 0, color: '#DC2626' },
          { name: 'Major', value: stats.severity_breakdown.major || 0, color: '#EA580C' },
          { name: 'Minor', value: stats.severity_breakdown.minor || 0, color: '#CA8A04' },
          { name: 'Needs Review', value: stats.severity_breakdown.needs_review || 0, color: '#9333EA' },
        ])
      }

      const mapped = scans.map((s) => ({
        id: s._id.slice(-12).toUpperCase(),
        product: s.extracted_fields?.commodity_name || 'Scanned Product',
        date: new Date(s.scanned_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        compliant: s.overall_status === 'compliant',
        issues: s.violations_summary
          ? (s.violations_summary.critical || 0) + (s.violations_summary.major || 0) + (s.violations_summary.minor || 0) + (s.violations_summary.needs_review || 0)
          : 0,
        status: s.overall_status === 'compliant' ? '\u2014' as const : 'Pending' as const,
      }))
      setInspections(mapped.length > 0 ? mapped : DUMMY_INSPECTIONS)

      if (stats.violations_by_type && stats.violations_by_type.length > 0) {
        const monthMap = new Map<string, { scanned: number; compliant: number; critical: number; major: number; minor: number; needs_review: number }>()
        scans.forEach((s) => {
          const month = new Date(s.scanned_at).toLocaleString('en-US', { month: 'short' })
          const entry = monthMap.get(month) || { scanned: 0, compliant: 0, critical: 0, major: 0, minor: 0, needs_review: 0 }
          entry.scanned += 1
          if (s.overall_status === 'compliant') entry.compliant += 1
          if (s.violations_summary) {
            entry.critical += s.violations_summary.critical || 0
            entry.major += s.violations_summary.major || 0
            entry.minor += s.violations_summary.minor || 0
            entry.needs_review += s.violations_summary.needs_review || 0
          }
          monthMap.set(month, entry)
        })
        const chartArr = Array.from(monthMap.entries()).map(([month, data]) => ({ month, ...data }))
        if (chartArr.length > 0) setChartData(chartArr)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />
  }

  if (error) {
    return (
      <div className="py-10 px-6">
        <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
        <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl p-4 text-sm">{error}</div>
      </div>
    )
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-6 sm:py-10">
        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wide text-orange-600">COMPLIANCE MONITORING</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1 max-w-md">
              Track product inspections, compliance issues and resolution progress.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
            <div className="relative flex-1 sm:flex-none">
              <button
                onClick={() => setRangeOpen((o) => !o)}
                className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{dateRange}</span>
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${rangeOpen ? 'rotate-180' : ''}`} />
              </button>
              {rangeOpen && (
                <div className="absolute right-0 left-0 sm:left-auto mt-2 sm:w-44 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-10">
                  {DATE_RANGES.map((range) => (
                    <button
                      key={range}
                      onClick={() => { setDateRange(range); setRangeOpen(false) }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-orange-50 transition-colors ${range === dateRange ? 'text-orange-600 font-medium' : 'text-slate-600'}`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Link href="/dashboard/scan" className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 transition-colors text-white text-sm font-semibold px-4 py-2.5 rounded-lg">
              <Plus className="w-4 h-4" />
              <span className="whitespace-nowrap">New Inspection</span>
            </Link>
          </div>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8">
          <div className="bg-white border-t-4 border-t-orange-400 border border-slate-200 rounded-xl p-3.5 sm:p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs sm:text-sm text-slate-500 leading-tight">Total Products Scanned</p>
              <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                <ScanLine className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
            </div>
            <p className="text-xl sm:text-3xl font-extrabold text-slate-900 mt-2 sm:mt-3">{kpis.totalScanned.toLocaleString()}</p>
            <p className="text-[11px] sm:text-xs text-emerald-600 mt-1 leading-tight">{kpis.totalScannedChange}</p>
          </div>
          <div className="bg-white border-t-4 border-t-orange-400 border border-slate-200 rounded-xl p-3.5 sm:p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs sm:text-sm text-slate-500 leading-tight">Compliant Products</p>
              <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
            </div>
            <p className="text-xl sm:text-3xl font-extrabold text-slate-900 mt-2 sm:mt-3">{kpis.compliant.toLocaleString()}</p>
            <p className="text-[11px] sm:text-xs text-emerald-600 mt-1 leading-tight">{kpis.complianceRate}% overall rate</p>
          </div>
          <div className="bg-white border-t-4 border-t-orange-400 border border-slate-200 rounded-xl p-3.5 sm:p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs sm:text-sm text-slate-500 leading-tight">Issues Resolved</p>
              <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <RefreshCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
            </div>
            <p className="text-xl sm:text-3xl font-extrabold text-slate-900 mt-2 sm:mt-3">{kpis.issuesResolved.toLocaleString()}</p>
            <p className="text-[11px] sm:text-xs text-emerald-600 mt-1 leading-tight">{kpis.resolutionRate}% resolution rate</p>
          </div>
          <div className="bg-white border-t-4 border-t-orange-400 border border-slate-200 rounded-xl p-3.5 sm:p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs sm:text-sm text-slate-500 leading-tight">Issues Pending</p>
              <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
            </div>
            <p className="text-xl sm:text-3xl font-extrabold text-slate-900 mt-2 sm:mt-3">{kpis.issuesPending.toLocaleString()}</p>
            <p className="text-[11px] sm:text-xs text-amber-600 mt-1 leading-tight">Needs follow-up</p>
          </div>
        </div>

        {/* CHARTS */}
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6">
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6">
            <div className="flex items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-900 text-sm sm:text-base">Violation Severity Trend</h2>
                <p className="text-xs text-slate-500 mt-0.5">Violations by severity, by month</p>
              </div>
              <span className="text-[11px] sm:text-xs bg-slate-100 text-slate-500 px-2.5 sm:px-3 py-1 rounded-full whitespace-nowrap shrink-0">{dateRange}</span>
            </div>
            <div className="h-56 sm:h-64 mt-4 -ml-2 sm:ml-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={2} margin={{ left: -10, right: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={32} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} cursor={{ fill: '#F8FAFC' }} />
                  <Bar dataKey="critical" name="Critical" stackId="a" fill="#DC2626" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="major" name="Major" stackId="a" fill="#EA580C" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="minor" name="Minor" stackId="a" fill="#CA8A04" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="needs_review" name="Needs Review" stackId="a" fill="#9333EA" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] sm:text-xs mt-2">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full" style={{background:'#DC2626'}} /> Critical
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full" style={{background:'#EA580C'}} /> Major
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full" style={{background:'#CA8A04'}} /> Minor
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full" style={{background:'#9333EA'}} /> Needs Review
              </span>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 flex flex-col">
            <div>
              <h2 className="font-bold text-slate-900 text-sm sm:text-base">Violation Severity Breakdown</h2>
              <p className="text-xs text-slate-500 mt-0.5">Current distribution of violation types</p>
            </div>
            <div className="relative h-40 sm:h-48 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={severityData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="45%" outerRadius="80%" stroke="none">
                    {severityData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-extrabold text-slate-900">{severityData.reduce((s,d)=>s+d.value,0)}</p>
                  <p className="text-[10px] sm:text-xs text-slate-500">Total Violations</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] sm:text-xs mt-2">
              {severityData.map((s) => (
                <span key={s.name} className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full" style={{background: s.color}} /> {s.name}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <Link href="/dashboard/inspections" className="text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 transition-colors rounded-lg py-2 px-2 text-center">
                View All Inspections
              </Link>
              <Link href="/dashboard/reports" className="text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 transition-colors rounded-lg py-2 px-2 text-center">
                View Reports
              </Link>
            </div>
          </div>
        </div>

        {/* RECENT INSPECTIONS */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 mt-4 sm:mt-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900 text-sm sm:text-base">Recent Inspections</h2>
              <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">Latest product compliance inspections</p>
            </div>
            <Link href="/dashboard/inspections" className="flex items-center gap-1 text-xs sm:text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors shrink-0 whitespace-nowrap">
              View All
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto mt-4 hidden sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                  <th className="pb-3 font-medium">Inspection ID</th>
                  <th className="pb-3 font-medium">Product</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Compliance</th>
                  <th className="pb-3 font-medium">Issues</th>
                  <th className="pb-3 font-medium">Resolution</th>
                </tr>
              </thead>
              <tbody>
                {inspections.map((row) => (
                  <tr key={row.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="py-3 font-semibold text-slate-800 whitespace-nowrap">{row.id}</td>
                    <td className="py-3 text-slate-600 max-w-[200px] truncate" title={row.product}>{row.product}</td>
                    <td className="py-3 text-slate-500 whitespace-nowrap">{row.date}</td>
                    <td className="py-3">
                      <StatusPill label={row.compliant ? 'Compliant' : 'Non-Compliant'} tone={row.compliant ? 'green' : 'red'} />
                    </td>
                    <td className="py-3 text-slate-600">{row.issues}</td>
                    <td className="py-3">
                      {row.status === '\u2014' ? (
                        <span className="text-slate-400">\u2014</span>
                      ) : (
                        <StatusPill label={row.status} tone={row.status === 'Resolved' ? 'blue' : 'amber'} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="sm:hidden mt-4 space-y-3">
            {inspections.map((row) => (
              <div key={row.id} className="border border-slate-100 rounded-lg p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{row.product}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{row.id}</p>
                  </div>
                  <StatusPill label={row.compliant ? 'Compliant' : 'Non-Compliant'} tone={row.compliant ? 'green' : 'red'} />
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                  <span className="text-xs text-slate-500">{row.date}</span>
                  <span className="text-xs text-slate-500">{row.issues} issue{row.issues === 1 ? '' : 's'}</span>
                  {row.status === '\u2014' ? (
                    <span className="text-xs text-slate-400">\u2014</span>
                  ) : (
                    <StatusPill label={row.status} tone={row.status === 'Resolved' ? 'blue' : 'amber'} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
