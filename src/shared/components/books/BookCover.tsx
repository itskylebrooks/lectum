import useThemeStore from "@/shared/store/theme";

interface BookCoverProps {
  title: string;
  author: string;
  thumbnailDataUrl?: string | null;
  accentSeed?: string;
  className?: string;
}

const PLACEHOLDER_ACCENTS = [
  {
    light: {
      bg: "#f3ece0",
      border: "#b88f62",
      title: "#472f18",
      author: "#67452a",
    },
    dark: {
      bg: "#2a2117",
      border: "#9c7449",
      title: "#f2dfc7",
      author: "#dcc1a0",
    },
  },
  {
    light: {
      bg: "#e5edf3",
      border: "#7498b8",
      title: "#1f3b52",
      author: "#325773",
    },
    dark: {
      bg: "#1a242d",
      border: "#5f82a1",
      title: "#d9e8f3",
      author: "#b8cee0",
    },
  },
  {
    light: {
      bg: "#e6efe5",
      border: "#789e74",
      title: "#234323",
      author: "#376137",
    },
    dark: {
      bg: "#1a2419",
      border: "#638a5f",
      title: "#d7e9d4",
      author: "#b8d2b4",
    },
  },
  {
    light: {
      bg: "#f3e6ea",
      border: "#ba7f90",
      title: "#572536",
      author: "#773a4e",
    },
    dark: {
      bg: "#281a1e",
      border: "#996577",
      title: "#f0d8df",
      author: "#dcbbc6",
    },
  },
  {
    light: {
      bg: "#ece8f3",
      border: "#8b79b4",
      title: "#3f2b60",
      author: "#573d7f",
    },
    dark: {
      bg: "#221b2b",
      border: "#725f9b",
      title: "#e7dcf3",
      author: "#d1c2e8",
    },
  },
  {
    light: {
      bg: "#e3eff1",
      border: "#6fa0aa",
      title: "#1e4a4f",
      author: "#2f6a71",
    },
    dark: {
      bg: "#182427",
      border: "#5b8a93",
      title: "#d4e7ea",
      author: "#b4d0d5",
    },
  },
  {
    light: {
      bg: "#f2e6ee",
      border: "#b27b9f",
      title: "#57274c",
      author: "#773866",
    },
    dark: {
      bg: "#271922",
      border: "#935f83",
      title: "#edd8e7",
      author: "#d8bed2",
    },
  },
  {
    light: {
      bg: "#e5ecf2",
      border: "#7693ad",
      title: "#234059",
      author: "#365f7d",
    },
    dark: {
      bg: "#18222b",
      border: "#617f99",
      title: "#d8e6f2",
      author: "#bbcee0",
    },
  },
  {
    light: {
      bg: "#f4ebe1",
      border: "#bd8b67",
      title: "#4b301d",
      author: "#6c4228",
    },
    dark: {
      bg: "#2a2018",
      border: "#9d6f4f",
      title: "#f1decb",
      author: "#ddc0a3",
    },
  },
  {
    light: {
      bg: "#ececef",
      border: "#8c95a5",
      title: "#283142",
      author: "#3c4960",
    },
    dark: {
      bg: "#1a1d22",
      border: "#697386",
      title: "#dde2ea",
      author: "#c2cad7",
    },
  },
] as const;

function hashSeed(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export default function BookCover({
  title,
  author,
  thumbnailDataUrl,
  accentSeed,
  className = "",
}: BookCoverProps) {
  const theme = useThemeStore((state) => state.theme);

  if (thumbnailDataUrl) {
    return (
      <img
        src={thumbnailDataUrl}
        alt={`Cover for ${title} by ${author}`}
        className={`h-28 w-20 rounded-2xl border border-subtle object-cover bg-subtle ${className}`.trim()}
      />
    );
  }

  const seed = accentSeed ?? `${title}:${author}`;
  const paletteIndex = hashSeed(seed) % PLACEHOLDER_ACCENTS.length;
  const palette = PLACEHOLDER_ACCENTS[paletteIndex]![theme];

  return (
    <div
      className={`flex h-28 w-20 shrink-0 flex-col justify-center gap-1 rounded-2xl border p-3 ${className}`.trim()}
      style={{ backgroundColor: palette.bg, borderColor: palette.border }}
      aria-hidden="true"
    >
      <span
        className="text-center text-[13px] font-semibold uppercase leading-tight tracking-wide"
        style={{ color: palette.title }}
      >
        {title}
      </span>
      <span
        className="text-center text-[11px] uppercase leading-tight tracking-wide"
        style={{ color: palette.author }}
      >
        {author}
      </span>
    </div>
  );
}
