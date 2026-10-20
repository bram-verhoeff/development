// Stilstaande kleurvlekken + subtiel raster als achtergrond van het werkvlak.
// Bewust niet geanimeerd: bewegende vlakken met blur-3xl laten de GPU elk frame het hele scherm
// opnieuw tekenen (ook onder backdrop-blur), wat scrollen en klikken merkbaar traag maakt.
const blobs = [
  "left-[10%] top-[-10%] h-[32rem] w-[32rem] bg-indigo-500/25 dark:bg-indigo-500/30",
  "right-[-5%] top-[20%] h-[28rem] w-[28rem] bg-fuchsia-500/20 dark:bg-fuchsia-500/25",
  "left-[35%] bottom-[-15%] h-[30rem] w-[30rem] bg-orange-400/20 dark:bg-orange-500/20",
];

export function Aurora() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {blobs.map((className, i) => (
        <div key={i} className={`absolute rounded-full blur-3xl ${className}`} />
      ))}
      <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
    </div>
  );
}
