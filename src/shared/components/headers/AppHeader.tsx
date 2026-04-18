import { desktopDropdownVariants } from '@/shared/animations';
import MobileTabBar from '@/shared/components/headers/MobileTabBar';
import SettingsModal from '@/shared/components/modals/SettingsModal';
import { useBookStore } from '@/shared/store/books';
import { useLibraryUiStore } from '@/shared/store/libraryUi';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChartPie,
  ChevronDown,
  Home,
  Library,
  PlusCircle,
  Settings as SettingsIcon,
  SlidersHorizontal,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

export default function AppHeader() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const openCreate = useBookStore((state) => state.openCreate);
  const filtersOpen = useLibraryUiStore((state) => state.filtersOpen);
  const toggleFilters = useLibraryUiStore((state) => state.toggleFilters);
  const setFiltersOpen = useLibraryUiStore((state) => state.setFiltersOpen);
  const moreRef = useRef<HTMLDivElement | null>(null);
  const moreButtonRef = useRef<HTMLButtonElement | null>(null);
  const location = useLocation();
  const isLibrary = location.pathname === '/library';
  const navLinkBase =
    'rounded-lg border border-subtle px-3 text-sm transition-colors duration-150 ease-in-out inline-flex items-center gap-2 h-10';

  useEffect(() => {
    if (!isLibrary) {
      setFiltersOpen(false);
    }
  }, [isLibrary, setFiltersOpen]);

  useEffect(() => {
    if (!moreOpen) return;

    const handleClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (moreRef.current?.contains(target) || moreButtonRef.current?.contains(target)) return;
      setMoreOpen(false);
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMoreOpen(false);
        moreButtonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    window.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
      window.removeEventListener('keydown', handleKey);
    };
  }, [moreOpen]);

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
                  `${navLinkBase} ${isActive ? 'bg-accent text-inverse border-transparent hover-accent-fade' : 'text-strong hover-nonaccent'}`
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
                  `${navLinkBase} ${isActive ? 'bg-accent text-inverse border-transparent hover-accent-fade' : 'text-strong hover-nonaccent'}`
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
                  `${navLinkBase} ${isActive ? 'bg-accent text-inverse border-transparent hover-accent-fade' : 'text-strong hover-nonaccent'}`
                }
              >
                <ChartPie className="w-4 h-4" />
                <span className="text-sm">Stats</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="relative flex items-center gap-2">
          <button
            ref={moreButtonRef}
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            className="rounded-lg border border-subtle px-3 text-sm inline-flex items-center gap-2 h-10 transition-colors duration-150 hover-nonaccent"
            aria-haspopup="menu"
            aria-expanded={moreOpen}
            aria-label="Open menu"
          >
            <ChevronDown className="w-4 h-4" />
          </button>

          <AnimatePresence>
            {moreOpen ? (
              <motion.div
                ref={moreRef}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={desktopDropdownVariants}
                className="absolute right-0 top-full mt-2 w-44 rounded-lg border border-subtle bg-surface-elevated text-strong shadow-elevated z-30"
              >
                <ul className="p-2">
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setMoreOpen(false);
                        openCreate(location.pathname === '/' ? 'reading' : 'next');
                      }}
                      className="w-full text-left px-3 py-2 rounded-md text-strong transition-colors duration-150 hover-nonaccent"
                    >
                      <span className="flex items-center gap-2">
                        <PlusCircle className="w-4 h-4" />
                        Add book
                      </span>
                    </button>
                  </li>

                  {isLibrary ? (
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setMoreOpen(false);
                          toggleFilters();
                        }}
                        className="w-full text-left px-3 py-2 rounded-md text-strong transition-colors duration-150 hover-nonaccent"
                      >
                        <span className="flex items-center gap-2">
                          <SlidersHorizontal className="w-4 h-4" />
                          {filtersOpen ? 'Hide filters' : 'Filters'}
                        </span>
                      </button>
                    </li>
                  ) : null}

                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setMoreOpen(false);
                        setSettingsOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 rounded-md text-strong transition-colors duration-150 hover-nonaccent"
                    >
                      <span className="flex items-center gap-2">
                        <SettingsIcon className="w-4 h-4" />
                        Settings
                      </span>
                    </button>
                  </li>
                </ul>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </header>

      <MobileTabBar />

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
