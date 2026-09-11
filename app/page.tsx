"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import {
  ShieldCheck,
  ScanLine,
  CheckSquare,
  FileCheck2,
  Upload,
  ScanText,
  ClipboardList,
  Download,
} from "lucide-react";

// ─── SVG Icons for Hero tags ───────────────────────────────────────────
const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </svg>
);

const TypeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
    <path d="M5 6h14M12 6v14M9 20h6" />
  </svg>
);

const TagIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
    <path d="M12 2l9 9-9 9-9-9 4-9h5z" />
    <circle cx="9" cy="9" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const ScaleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
    <path d="M12 3v18M5 7h14M5 7l-3 6a3 3 0 006 0l-3-6zM19 7l-3 6a3 3 0 006 0l-3-6z" />
  </svg>
);

const heroTags = [
  { icon: CalendarIcon, label: "Expiry date present" },
  { icon: TypeIcon, label: "Font size correct" },
  { icon: TagIcon, label: "MRP clearly printed" },
  { icon: ScaleIcon, label: "Net quantity declared" },
];

const CornerMark = ({ className }: { className: string }) => (
  <div className={`absolute h-5 w-5 border-orange-500 ${className}`} />
);

// ─── Key Features Data ────────────────────────────────────────────────
const features = [
  {
    icon: ShieldCheck,
    title: "Rule-based verification",
    description:
      "Every check is mapped directly to the Legal Metrology (PC) Rules, 2011.",
  },
  {
    icon: ScanLine,
    title: "AI-powered OCR",
    description:
      "High-accuracy text extraction reads declarations straight off the label, even at odd angles.",
  },
  {
    icon: CheckSquare,
    title: "Instant results",
    description:
      "Get a clear compliant or non-compliant verdict the moment a scan finishes processing.",
  },
  {
    icon: FileCheck2,
    title: "Detailed report",
    description:
      "Download a shareable compliance report with every field checked and its result.",
  },
];

// ─── Process Steps Data ───────────────────────────────────────────────
const processSteps = [
  { icon: Upload, title: "Scan / upload", description: "Capture or upload an image of the product package." },
  { icon: ScanText, title: "Extract text", description: "AI-OCR extracts declaration text from the label." },
  { icon: ShieldCheck, title: "Verify compliance", description: "System checks the data against the PC Rules, 2011." },
  { icon: ClipboardList, title: "Get result", description: "View compliance status and flag missing details." },
  { icon: Download, title: "Download report", description: "Save a detailed report for your records." },
];

// ─── Main Page ────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAF6EF] font-sans">
      {/* ─── Hero Section ───────────────────────────────────── */}
      <section className="bg-[#FAF6EF] font-sans">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-14 lg:gap-16 items-center">

            {/* Left: copy */}
            <div className="text-center lg:text-left">
              <h1 className="font-display text-3xl xs:text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900 leading-[1.1]">
                Evaluate the quality
                <br />
                of your{" "}
                <span className="font-cursive text-5xl xs:text-6xl sm:text-7xl font-semibold text-orange-600 inline-block -rotate-3">
                  foods
                </span>
              </h1>

              <p className="mt-5 sm:mt-6 text-base sm:text-lg text-neutral-600 max-w-md leading-relaxed mx-auto lg:mx-0">
                Do you really know what you&apos;re buying? Our system scans and
                analyzes labels in the blink of an eye against the Legal
                Metrology (PC) Rules, 2011, so you can learn at a glance which
                products are compliant and which aren&apos;t.
              </p>

              <div className="mt-7 sm:mt-8 flex flex-wrap justify-center lg:justify-start gap-3">
                <Link href="/dashboard/scan" className="rounded-full bg-orange-600 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-700 active:bg-orange-800 transition-colors">
                  Scan a label
                </Link>
                <a href="#features" className="rounded-full border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-800 hover:border-neutral-400 transition-colors bg-white">
                  See how it works
                </a>
              </div>

              <div className="mt-9 sm:mt-10 flex items-center justify-center lg:justify-start gap-6 sm:gap-8 text-sm text-neutral-500">
                <div>
                  <p className="font-display text-xl sm:text-2xl font-bold text-neutral-900">98.2%</p>
                  <p>OCR accuracy</p>
                </div>
                <div className="h-8 w-px bg-neutral-200" />
                <div>
                  <p className="font-display text-xl sm:text-2xl font-bold text-neutral-900">&lt;10s</p>
                  <p>Avg. scan time</p>
                </div>
              </div>
            </div>

            {/* Right: product visual */}
            <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:gap-5">
              <div className="relative w-56 xs:w-64 sm:w-72 flex-shrink-0">
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden">
                  <Image
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRfwKGTOLYdFrZfEO1FFxxaGgToHlMYUbZ1qS2XSu1Dmg&s"
                    alt="Scanned product package"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute left-0 right-0 h-0.5 bg-orange-500/80 animate-scan" />
                </div>

                <CornerMark className="-top-1.5 -left-1.5 border-t-2 border-l-2 rounded-tl-md" />
                <CornerMark className="-top-1.5 -right-1.5 border-t-2 border-r-2 rounded-tr-md" />
                <CornerMark className="-bottom-1.5 -left-1.5 border-b-2 border-l-2 rounded-bl-md" />
                <CornerMark className="-bottom-1.5 -right-1.5 border-b-2 border-r-2 rounded-br-md" />

                <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-white pl-1.5 pr-4 py-1.5 shadow-[0_4px_14px_rgba(0,0,0,0.12)] whitespace-nowrap">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 shrink-0">
                    <span className="h-2 w-2 rounded-full bg-white" />
                  </span>
                  <span className="font-display text-xs font-bold text-neutral-800">
                    Compliant &middot; 92/100
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5 w-full max-w-xs lg:max-w-none lg:w-auto">
                {heroTags.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 lg:gap-3 rounded-full bg-neutral-100 px-3 lg:px-4 py-2.5 lg:py-3 text-xs lg:text-sm text-neutral-500 lg:whitespace-nowrap"
                  >
                    <span className="text-neutral-400 flex-shrink-0">
                      <Icon />
                    </span>
                    <span className="truncate lg:whitespace-nowrap">{label}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        <style>{`
          @keyframes scan {
            0% { top: 6%; }
            50% { top: 92%; }
            100% { top: 6%; }
          }
          .animate-scan {
            animation: scan 2.2s ease-in-out infinite;
          }
        `}</style>
      </section>

      {/* ─── Key Features Section ───────────────────────────── */}
      <KeyFeaturesSection />

      {/* ─── Process Section ────────────────────────────────── */}
      <ProcessSection />

      {/* ─── CTA Section ───────────────────────────────────── */}
      <section className="bg-slate-100/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-10 sm:py-14">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Ready to check your label?</h2>
              <p className="text-sm text-slate-500 mt-1 max-w-md">
                Upload a photo of any packaged food product and get a full legal
                metrology compliance report in seconds.
              </p>
            </div>
            <Link
              href="/dashboard/scan"
              className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 transition-colors text-white text-sm font-semibold px-6 py-3 rounded-lg shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 w-full md:w-auto"
            >
              Start scanning
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-semibold text-white">ComplianceChecker</span>
          </div>
          <p className="text-xs">
            &copy; {new Date().getFullYear()} ComplianceChecker. Legal Metrology Compliance Tool.
          </p>
        </div>
      </footer>
    </div>
  );
}

// ─── Key Features (client component with spotlight animation) ──────
function KeyFeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const node = sectionRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.2 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % features.length)
    }, 2200)
    return () => clearInterval(interval)
  }, [visible])

  return (
    <section id="features" ref={sectionRef} className="bg-white font-sans overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-20">
        <p className="text-xs sm:text-sm font-semibold text-orange-600 mb-2 text-center sm:text-left">Why use this portal</p>
        <h2 className="font-display text-2xl xs:text-3xl sm:text-4xl font-bold text-neutral-900 max-w-xl text-center sm:text-left mx-auto sm:mx-0">
          Everything you need to verify a label
        </h2>
        <p className="mt-3 text-neutral-500 max-w-xl text-center sm:text-left mx-auto sm:mx-0">
          Built around the four checks every packaged commodity must clear before it reaches a shelf.
        </p>

        <div className="mt-10 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {features.map(({ icon: Icon, title, description }, index) => {
            const isSpotlit = visible && activeIndex === index
            return (
              <div
                key={title}
                style={{ transitionDelay: visible ? `${index * 150}ms` : "0ms" }}
                className={`group rounded-2xl border p-5 sm:p-6 transition-all duration-700 ease-out cursor-default ${
                  visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                } ${
                  isSpotlit
                    ? "scale-[1.02] sm:scale-105 border-orange-300 shadow-lg bg-orange-50/40"
                    : "scale-100 border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-300 hover:-translate-y-1 hover:shadow-md"
                }`}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 transition-transform duration-300 ${
                    isSpotlit ? "scale-110" : "group-hover:scale-110"
                  }`}
                >
                  <Icon size={20} />
                </span>
                <h3 className="mt-4 font-display font-semibold text-neutral-900 text-sm sm:text-base">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-neutral-500 leading-relaxed">
                  {description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── Process (client component with auto-advancing steps) ──────────
function ProcessSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const node = sectionRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.2 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % processSteps.length)
    }, 1800)
    return () => clearInterval(interval)
  }, [visible])

  const progressPercent = (activeStep / (processSteps.length - 1)) * 100

  return (
    <section ref={sectionRef} className="bg-[#FAF6EF] font-sans overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-20">

        <div className="text-center max-w-xl mx-auto">
          <span className="inline-block text-xs font-semibold text-orange-600 bg-orange-50 rounded-full px-3 py-1 mb-4">
            The process
          </span>
          <h2 className="font-display text-2xl xs:text-3xl sm:text-4xl font-bold text-neutral-900">
            How our system works
          </h2>
          <p className="mt-3 text-neutral-500">
            Five steps take a package from photo to verified compliance report.
          </p>
        </div>

        <div className="relative mt-14 sm:mt-16">
          <div className="absolute top-6 left-0 right-0 h-0.5 bg-neutral-200 hidden sm:block" />
          <div
            className="absolute top-6 left-0 h-0.5 bg-orange-500 hidden sm:block transition-all duration-700 ease-out"
            style={{ width: visible ? `${progressPercent}%` : "0%" }}
          />

          <div className="absolute top-6 bottom-6 left-6 w-0.5 bg-neutral-200 sm:hidden" />
          <div
            className="absolute top-6 left-6 w-0.5 bg-orange-500 sm:hidden transition-all duration-700 ease-out"
            style={{ height: visible ? `calc(${progressPercent}% * 0.86)` : "0%" }}
          />

          <div className="relative grid grid-cols-1 sm:grid-cols-5 gap-8 sm:gap-4">
            {processSteps.map(({ icon: Icon, title, description }, index) => {
              const isActive = visible && activeStep === index
              const isPast = visible && index < activeStep

              return (
                <div
                  key={title}
                  style={{ transitionDelay: visible ? `${index * 150}ms` : "0ms" }}
                  className={`relative flex items-start gap-4 text-left sm:flex-col sm:items-center sm:text-center sm:gap-0 transition-all duration-700 ease-out ${
                    visible ? "opacity-100 translate-x-0 sm:translate-y-0" : "opacity-0 -translate-x-4 sm:translate-x-0 sm:translate-y-6"
                  }`}
                >
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 bg-[#FAF6EF] transition-all duration-300 ${
                      isActive
                        ? "bg-orange-600 border-orange-600 text-white scale-110 shadow-md"
                        : isPast
                        ? "bg-orange-100 border-orange-300 text-orange-600"
                        : "bg-white border-neutral-200 text-neutral-400"
                    }`}
                  >
                    <Icon size={20} />
                  </span>

                  <div className="sm:mt-4">
                    <h3 className="font-display font-semibold text-neutral-900 text-sm">
                      {title}
                    </h3>
                    <p className="mt-1.5 text-xs text-neutral-500 leading-relaxed max-w-[220px] sm:max-w-[160px]">
                      {description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </section>
  )
}
