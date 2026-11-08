const BASE =
  "w-full rounded-xl border border-zinc-600 bg-[#0d0d0d] px-3.5 py-2.5 text-sm font-normal text-white shadow-[0_1px_2px_rgba(0,0,0,0.35)] outline-none transition-colors placeholder:text-zinc-400 hover:border-zinc-400 focus:border-white disabled:cursor-not-allowed disabled:opacity-60";

const ICONO_NATIVO =
  "[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60";

export const CAMPO = BASE;

export const CAMPO_FECHA = `${BASE} ${ICONO_NATIVO}`;

export const CAMPO_SELECT = `${BASE} appearance-none pr-9 [&>option]:bg-[#0d0d0d] [&>option]:text-white`;

export const CAMPO_AREA = `${BASE} min-h-24 resize-y`;

export const CAMPO_CORTO =
  "rounded-xl border border-zinc-600 bg-[#0d0d0d] px-2 py-2 text-center text-sm font-normal text-white shadow-[0_1px_2px_rgba(0,0,0,0.35)] outline-none transition-colors hover:border-zinc-400 focus:border-white disabled:cursor-not-allowed disabled:opacity-60";

export const ETIQUETA = "block text-sm font-semibold text-zinc-400";

export const AYUDA = "text-xs text-zinc-400";
