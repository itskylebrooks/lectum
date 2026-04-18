import MobileTabBar from "@/shared/components/headers/MobileTabBar";
import SettingsModal from "@/shared/components/modals/SettingsModal";
import { useBookStore } from "@/shared/store/books";
import {
  ChartPie,
  Home,
  Library,
  PlusCircle,
  Settings as SettingsIcon,
} from "lucide-react";
import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

export default function AppHeader() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const openCreate = useBookStore((state) => state.openCreate);
  const location = useLocation();
  const navLinkBase =
    "rounded-lg border border-subtle px-3 text-sm transition-colors duration-150 ease-in-out inline-flex items-center gap-2 h-10";

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between bg-app py-2.5 sm:py-3">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            aria-label="Go to home"
            className="inline-flex items-center h-10 text-2xl leading-none font-bold uppercase tracking-wider hover-change-color transition-colors"
          >
            Lectum
          </Link>
        </div>

        <nav className="hidden sm:flex absolute left-1/2 -translate-x-1/2 z-10">
          <ul className="flex items-center gap-2">
            <li>
              <NavLink
                to="/library"
                aria-label="Library"
                title="Library"
                className={({ isActive }: { isActive: boolean }) =>
                  `${navLinkBase} ${isActive ? "bg-accent text-inverse border-transparent hover-accent-fade" : "text-strong hover-nonaccent"}`
                }
              >
                <Library className="w-4 h-4" />
                <span className="text-sm">Library</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/"
                end
                aria-label="Home"
                title="Home"
                className={({ isActive }: { isActive: boolean }) =>
                  `${navLinkBase} ${isActive ? "bg-accent text-inverse border-transparent hover-accent-fade" : "text-strong hover-nonaccent"}`
                }
              >
                <Home className="w-4 h-4" />
                <span className="text-sm">Home</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/stats"
                aria-label="Stats"
                title="Stats"
                className={({ isActive }: { isActive: boolean }) =>
                  `${navLinkBase} ${isActive ? "bg-accent text-inverse border-transparent hover-accent-fade" : "text-strong hover-nonaccent"}`
                }
              >
                <ChartPie className="w-4 h-4" />
                <span className="text-sm">Stats</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              openCreate(location.pathname === "/" ? "reading" : "next");
            }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-subtle transition-colors duration-150 hover-nonaccent"
            aria-label="Add book"
          >
            <PlusCircle className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-subtle transition-colors duration-150 hover-nonaccent"
            aria-label="Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </header>

      <MobileTabBar />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}
