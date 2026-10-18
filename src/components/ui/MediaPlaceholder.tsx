type Props = { label: string; className?: string };

/** Marcador de posición para fotos y videos. Los archivos reales se cargarán desde Supabase Storage. */
export function MediaPlaceholder({ label, className }: Props) {
  return (
    <div
      role="img"
      aria-label={label}
      className={`${className ?? ""} flex items-center justify-center overflow-hidden bg-linear-to-br from-zinc-800 to-zinc-950 p-2 text-center text-[11px] font-semibold text-zinc-500`}
    >
      <span className="line-clamp-2">{label}</span>
    </div>
  );
}
