/** Ícones dos tipos de arquivo (traço fino, herdam a cor do texto). */
type Props = { kind: string; className?: string };

export function FileIcon({ kind, className = "size-6" }: Props) {
  const common = { className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (kind) {
    case "excel":
    case "xlsx":
      return (
        <svg {...common}>
          <rect x="3.5" y="4" width="17" height="16" rx="2" />
          <path d="M3.5 9h17M3.5 14.5h17M9.5 4v16M15 4v16" />
        </svg>
      );
    case "csv":
      return (
        <svg {...common}>
          <path d="M14 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5z" />
          <path d="M14 3.5v5h5M8.5 12.5h7M8.5 16h7" />
        </svg>
      );
    case "pdf":
      return (
        <svg {...common}>
          <rect x="7" y="3.5" width="13.5" height="15" rx="2" />
          <path d="M4 7v12a1.5 1.5 0 0 0 1.5 1.5H17" />
          <text x="13.75" y="13" fontSize="5.2" fontWeight="800" textAnchor="middle" fill="currentColor" stroke="none" fontFamily="system-ui, sans-serif">
            PDF
          </text>
        </svg>
      );
    case "imagem":
    case "png":
      return (
        <svg {...common}>
          <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
          <circle cx="9" cy="10" r="1.6" />
          <path d="m20.5 16-4.5-4.5L7 19.5" />
        </svg>
      );
    case "liga":
      return (
        <svg {...common}>
          <path d="M4 9.5 5.5 4.5h13L20 9.5" />
          <path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0" />
          <path d="M5.5 12v7.5h13V12M10 19.5v-4h4v4" />
        </svg>
      );
    case "texto":
    case "txt":
      return (
        <svg {...common}>
          <path d="M5 6h14M5 10h14M5 14h9M5 18h6" />
        </svg>
      );
    case "link":
      return (
        <svg {...common}>
          <path d="M10 14a4.5 4.5 0 0 0 6.4 0l2.8-2.8a4.5 4.5 0 0 0-6.4-6.4L11.5 6" />
          <path d="M14 10a4.5 4.5 0 0 0-6.4 0l-2.8 2.8a4.5 4.5 0 0 0 6.4 6.4l1.3-1.2" />
        </svg>
      );
    case "upload":
      return (
        <svg {...common}>
          <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" />
          <path d="M4.5 14.5v3a2.5 2.5 0 0 0 2.5 2.5h10a2.5 2.5 0 0 0 2.5-2.5v-3" />
        </svg>
      );
    case "camera":
      return (
        <svg {...common}>
          <path d="M4 8.5A2 2 0 0 1 6 6.5h1.8l1.4-2h5.6l1.4 2H18a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
          <circle cx="12" cy="12.5" r="3.4" />
        </svg>
      );
    case "paste":
      return (
        <svg {...common}>
          <rect x="6" y="4.5" width="12" height="16" rx="2" />
          <path d="M9.5 4.5V3.5h5v1M9 10h6M9 13.5h6M9 17h4" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M14 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5z" />
          <path d="M14 3.5v5h5" />
        </svg>
      );
  }
}

/** Cor de destaque de cada tipo (texto e fundo suave). */
export const KIND_TONE: Record<string, string> = {
  excel: "text-emerald-400 bg-emerald-400/10 ring-emerald-400/30",
  csv: "text-sky-400 bg-sky-400/10 ring-sky-400/30",
  pdf: "text-rose-400 bg-rose-400/10 ring-rose-400/30",
  imagem: "text-violet-400 bg-violet-400/10 ring-violet-400/30",
  liga: "text-cyan-300 bg-cyan-400/10 ring-cyan-400/30",
  texto: "text-amber-300 bg-amber-400/10 ring-amber-400/30",
};
