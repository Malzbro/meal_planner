export function PlanSkeleton() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse">
      <div className="mb-10">
        <div className="h-3 w-20 bg-chip rounded-sm mb-3" />
        <div className="h-10 w-3/4 bg-chip rounded-sm mb-2" />
        <div className="h-4 w-1/2 bg-chip rounded-sm" />
      </div>

      <div className="mb-12">
        <div className="h-3 w-32 bg-chip rounded-sm mb-2" />
        <div className="h-2 bg-chip rounded-sm" />
        <div className="h-3 w-full bg-chip rounded-sm mt-2 opacity-50" />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-5 border border-line rounded-lg">
            <div className="flex justify-between mb-3">
              <div className="h-3 w-6 bg-chip rounded-sm" />
              <div className="h-3 w-16 bg-chip rounded-sm" />
            </div>
            <div className="h-6 w-3/4 bg-chip rounded-sm mb-2" />
            <div className="h-6 w-1/2 bg-chip rounded-sm mb-4" />
            <div className="flex gap-4">
              <div className="h-4 w-12 bg-chip rounded-sm" />
              <div className="h-4 w-16 bg-chip rounded-sm" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}