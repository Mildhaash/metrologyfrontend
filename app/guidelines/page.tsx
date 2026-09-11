'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Scale,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ScanLine,
  ListChecks,
  FlagTriangleRight,
  BookOpenCheck,
} from 'lucide-react'

const useReveal = () => {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('opacity-100', 'translate-y-0')
          el.classList.remove('opacity-0', 'translate-y-4')
          io.unobserve(el)
        }
      },
      { threshold: 0.15 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return ref
}

const Stat = ({ target, label, trigger }: { target: number; label: string; trigger: boolean }) => {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!trigger) return
    const duration = 900
    const start = performance.now()
    let frame: number
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      setValue(Math.floor(progress * target))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [trigger, target])

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
      <p className="text-xl sm:text-2xl font-extrabold text-slate-900">{value}</p>
      <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-snug">{label}</p>
    </div>
  )
}

const RULES = [
  { n: '01', title: 'Packaged Commodities Rules, 2011', desc: 'Declarations and presentation requirements for pre-packaged goods. Core focus of this Checker.' },
  { n: '02', title: 'Approval of Models Rules, 2011', desc: 'Governs model approval for weighing and measuring instruments before sale.' },
  { n: '03', title: 'Numeration Rules, 2010', desc: 'Prescribes the numeral system used for legal metrology purposes.' },
  { n: '04', title: 'General Rules, 2011', desc: 'Covers general instrument and unit provisions, periodically updated to add new instrument categories.' },
  { n: '05', title: 'National Standards Rules, 2011', desc: 'Establishes national standards of weights and measures for reference and calibration.' },
  { n: '06', title: 'IILM & Test Centre Rules', desc: 'Govern the Indian Institute of Legal Metrology and government-approved test centres.' },
]

const GOOD_PRACTICE = [
  'Show the retail sale price clearly, using either "₹" or "Rs."',
  'State net quantity in the applicable standard unit of weight, measure or number.',
  "Print the manufacturer's, packer's or importer's name and address in full.",
  'Include month and year of manufacture, packing or import.',
  'Keep a working consumer-complaint contact on the package.',
]

const COMMON_GAPS = [
  'Altering or overprinting the declared MRP after the package is sealed.',
  'Quantity shown in a non-standard or ambiguous unit.',
  'Missing country of origin on an imported product.',
  'Mandatory declarations placed somewhere other than the principal display panel.',
  'Declarations present but too small or faint to be legible.',
]

const FLOW_STEPS = [
  { icon: BookOpenCheck, title: 'Reference the Rule', desc: 'Each declaration requirement is mapped back to its source rule.' },
  { icon: ScanLine, title: 'Scan the Package', desc: 'OCR and AI processing extract the visible declarations.' },
  { icon: ListChecks, title: 'Compare Against Checks', desc: 'Extracted text is matched against the configured requirement list.' },
  { icon: FlagTriangleRight, title: 'Flag for Review', desc: 'Gaps are surfaced for the inspector to confirm — final decisions stay with the authority.' },
]

export default function GuidelinesPage() {
  const heroRef = useReveal()
  const statsRef = useReveal()
  const aboutRef = useReveal()
  const rulesRef = useReveal()
  const goodBadRef = useReveal()
  const enforcementRef = useReveal()
  const flowRef = useReveal()
  const ctaRef = useReveal()

  const [statsVisible, setStatsVisible] = useState(false)
  useEffect(() => {
    const el = statsRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsVisible(true)
          io.disconnect()
        }
      },
      { threshold: 0.4 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [statsRef])

  return (
    <div className="bg-slate-50 text-slate-800">
      {/* HERO */}
      <section ref={heroRef} className="relative overflow-hidden bg-orange-50/40 py-12 sm:py-16 md:py-20 opacity-0 translate-y-4 transition-all duration-700 ease-out">
        <div className="absolute w-72 h-72 bg-orange-300 rounded-full blur-[70px] opacity-30 -top-10 -left-10 animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute w-64 h-64 bg-emerald-200 rounded-full blur-[70px] opacity-30 top-24 right-0 animate-pulse" style={{ animationDuration: '7s' }} />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 md:px-10">
          <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            <Scale className="w-3.5 h-3.5 shrink-0" />
            LEGAL METROLOGY FRAMEWORK
          </span>
          <h1 className="mt-5 text-2xl xs:text-3xl md:text-5xl font-extrabold text-slate-900 leading-tight max-w-3xl">
            Legal Metrology (Packaged Commodities) Rules, 2011
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
            The Legal Metrology (Packaged Commodities) Rules, 2011 lay down the standards and
            procedures for the measurement and labeling of packaged commodities. These rules form
            the regulatory foundation used by the Compliance Checker to identify relevant package
            declarations during digital inspection.
          </p>
          <div className="mt-6 bg-amber-50 border-l-4 border-amber-400 rounded-md p-4 max-w-2xl text-xs sm:text-sm text-amber-900">
            <span className="font-semibold">Important:</span> This page is a plain-language summary
            for inspection support. For the authoritative legal text and current amendments, always
            refer to the Department of Consumer Affairs.
          </div>
        </div>
      </section>

      {/* QUICK STATS */}
      <section ref={statsRef} className="bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-8 sm:py-10 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Stat target={2009} label="Legal Metrology Act" trigger={statsVisible} />
          <Stat target={2011} label="In force from 1 April" trigger={statsVisible} />
          <Stat target={7} label="Rules framed under the Act" trigger={statsVisible} />
          <Stat target={10} label="Core package declarations" trigger={statsVisible} />
        </div>
      </section>

      {/* WHAT / WHO */}
      <section ref={aboutRef} className="opacity-0 translate-y-4 transition-all duration-700 ease-out">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-10 sm:py-14 grid md:grid-cols-2 gap-5 sm:gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">What the rules cover</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600 leading-relaxed">
              <li className="flex gap-2"><span className="text-orange-500 mt-0.5 shrink-0">•</span>Standardising weights and measures on the metric system, based on the international system of units.</li>
              <li className="flex gap-2"><span className="text-orange-500 mt-0.5 shrink-0">•</span>Model approval, verification and stamping of weighing and measuring instruments.</li>
              <li className="flex gap-2"><span className="text-orange-500 mt-0.5 shrink-0">•</span>Mandatory declarations on pre-packaged commodities meant for sale, distribution or delivery.</li>
              <li className="flex gap-2"><span className="text-orange-500 mt-0.5 shrink-0">•</span>Appointment and powers of legal metrology officers who enforce these provisions.</li>
              <li className="flex gap-2"><span className="text-orange-500 mt-0.5 shrink-0">•</span>Penalties for non-compliance, ranging from fines to enhanced penalties on repetition.</li>
            </ul>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Who these rules are for</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600 leading-relaxed">
              <li className="flex gap-2"><span className="text-orange-500 mt-0.5 shrink-0">•</span>Manufacturers, packers and importers of pre-packaged commodities.</li>
              <li className="flex gap-2"><span className="text-orange-500 mt-0.5 shrink-0">•</span>Wholesale and retail dealers who store, display or sell packaged goods.</li>
              <li className="flex gap-2"><span className="text-orange-500 mt-0.5 shrink-0">•</span>Users of licensed weighing and measuring instruments in trade.</li>
              <li className="flex gap-2"><span className="text-orange-500 mt-0.5 shrink-0">•</span>Legal metrology officers and inspectors conducting field verification.</li>
              <li className="flex gap-2"><span className="text-orange-500 mt-0.5 shrink-0">•</span>Consumers who want to understand what a compliant package should show.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FRAMEWORK OF RULES */}
      <section ref={rulesRef} className="bg-slate-100/70 opacity-0 translate-y-4 transition-all duration-700 ease-out">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-10 sm:py-14">
          <p className="text-xs font-semibold tracking-wide text-orange-600">RULES FRAMED UNDER THE ACT</p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">The regulatory framework, at a glance</h2>
          <p className="text-slate-600 mt-2 max-w-2xl text-sm">
            The Department of Consumer Affairs has notified the following rules to give effect to the Act. The Packaged Commodities Rules are the ones this Checker verifies against most closely.
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
            {RULES.map((rule) => (
              <div key={rule.n} className="bg-white border border-slate-200 rounded-2xl p-5">
                <span className="inline-flex w-8 h-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600 font-bold text-sm">{rule.n}</span>
                <h3 className="font-semibold text-slate-900 mt-3 text-sm sm:text-base">{rule.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{rule.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-4">
            State Governments additionally frame their own State Legal Metrology (Enforcement) Rules for on-ground implementation.
          </p>
        </div>
      </section>

      {/* DO'S AND DON'TS */}
      <section ref={goodBadRef} className="opacity-0 translate-y-4 transition-all duration-700 ease-out">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-10 sm:py-14 grid md:grid-cols-2 gap-5 sm:gap-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 sm:p-7">
            <h2 className="text-base sm:text-lg font-bold text-emerald-800">Good practice for compliant packaging</h2>
            <ul className="mt-4 space-y-3 text-sm text-emerald-900">
              {GOOD_PRACTICE.map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 sm:p-7">
            <h2 className="text-base sm:text-lg font-bold text-rose-800">Common compliance gaps to avoid</h2>
            <ul className="mt-4 space-y-3 text-sm text-rose-900">
              {COMMON_GAPS.map((item) => (
                <li key={item} className="flex gap-2">
                  <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ENFORCEMENT */}
      <section ref={enforcementRef} className="bg-slate-900 text-white opacity-0 translate-y-4 transition-all duration-700 ease-out">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-10 sm:py-14">
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-orange-400 shrink-0" />
            Enforcement, in plain terms
          </h2>
          <p className="text-slate-300 mt-3 text-sm leading-relaxed max-w-3xl">
            Legal metrology officers appointed by State Governments carry out inspections, verification
            and seizure where required. Non-compliance can attract fines, and repeated or serious
            violations can carry enhanced penalties, including imprisonment in specified cases. Exact
            amounts and thresholds are set out in the Act and its amendments, so this Checker does not
            display penalty figures — it only flags where a declaration appears missing, unclear or
            inconsistent.
          </p>
        </div>
      </section>

      {/* HOW WE USE THIS */}
      <section ref={flowRef} className="opacity-0 translate-y-4 transition-all duration-700 ease-out">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-10 sm:py-14">
          <p className="text-xs font-semibold tracking-wide text-orange-600">HOW THE CHECKER APPLIES THESE RULES</p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">From rule to on-ground check</h2>
          <div className="grid xs:grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {FLOW_STEPS.map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="bg-white border border-slate-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 text-orange-500 font-bold text-sm">
                  <Icon className="w-4 h-4 shrink-0" />
                  {String(i + 1).padStart(2, '0')}
                </div>
                <h3 className="font-semibold text-slate-900 mt-2 text-sm">{title}</h3>
                <p className="text-xs text-slate-500 mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section ref={ctaRef} className="bg-slate-100/70 opacity-0 translate-y-4 transition-all duration-700 ease-out">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-10 sm:py-14">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Read the official rules</h2>
              <p className="text-sm text-slate-500 mt-1 max-w-md">
                For the authoritative version of the Legal Metrology Act and Packaged Commodities Rules, refer to the Department of Consumer Affairs.
              </p>
            </div>
            <a
              href="https://consumeraffairs.gov.in/pages/legal-metrology-act"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 transition-colors text-white text-sm font-semibold px-6 py-3 rounded-lg shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 w-full md:w-auto"
            >
              View Official Rules
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
