export default function ComingSoon() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#F7EFE2] px-6 text-center text-[#3B2A21]">
      <img src="/breakTimeLogo.png" alt="Breaktime Bakers" className="h-20 w-20 object-contain" />
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-[#B08968]">Fresh from the oven</p>
        <h1 className="font-['Fraunces'] text-4xl font-semibold sm:text-5xl">Breaktime Bakers</h1>
        <p className="text-lg text-[#6B5A4E]">Our website is coming soon.</p>
      </div>
    </div>
  )
}
