export default function LoadingPrograms() {
  return (
    <main className="min-h-screen bg-[#F7F6F2] text-slate-900">
      <section className="bg-[#1F2A63]">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center">
          <div className="mx-auto h-10 w-72 animate-pulse rounded-md bg-white/10 sm:h-12 sm:w-96" />
          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-[#F28C18]" />
          <div className="mx-auto mt-6 h-4 w-80 animate-pulse rounded bg-white/10 sm:w-[28rem]" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm"
            >
              <div className="aspect-[4/3] w-full animate-pulse bg-slate-200" />
              <div className="p-6">
                <div className="mx-auto h-6 w-2/3 animate-pulse rounded bg-slate-200" />
                <div className="mx-auto mt-5 h-9 w-32 animate-pulse rounded-full bg-[#F28C18]/30" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}


