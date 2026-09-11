export default function LoadingSpinner({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
      <p className="mt-4 text-sm text-neutral-500 font-medium">{text}</p>
    </div>
  )
}
