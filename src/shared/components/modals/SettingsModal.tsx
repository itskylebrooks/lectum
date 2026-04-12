import { usePWA } from '@/shared/hooks/usePWA';
import ConfirmModal from '@/shared/components/modals/ConfirmModal';
import { STORAGE_KEYS } from '@/shared/constants/storageKeys';
import { useBookStore } from '@/shared/store/books';
import { usePreferencesStore } from '@/shared/store/preferences';
import useThemeStore from '@/shared/store/theme';
import { buildExportPayload, parseImportPayload } from '@/shared/utils/dataTransfer';
import {
  ChevronDown,
  Dot,
  Linkedin,
  Share2,
  SquareArrowOutUpRight,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const APP_VERSION = '1.0.0';

export default function SettingsModal({ open, onClose }: SettingsModalProps) {
  const [visible, setVisible] = useState(open);
  const [closing, setClosing] = useState(false);
  const [entering, setEntering] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const enterRaf = useRef<number | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const books = useBookStore((state) => state.books);
  const importBooks = useBookStore((state) => state.importBooks);
  const dateFormat = usePreferencesStore((state) => state.dateFormat);
  const setDateFormat = usePreferencesStore((state) => state.setDateFormat);
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  const isSystemTheme = mode === 'system';
  const { isInstalled, canInstall, install } = usePWA();

  useEffect(() => {
    if (open) {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (enterRaf.current) cancelAnimationFrame(enterRaf.current);
      setVisible(true);
      setClosing(false);
      setEntering(true);
      enterRaf.current = requestAnimationFrame(() => {
        enterRaf.current = requestAnimationFrame(() => setEntering(false));
      });
      return;
    }

    if (visible) {
      setClosing(true);
      timeoutRef.current = window.setTimeout(() => {
        setVisible(false);
        setClosing(false);
      }, 220);
    }
  }, [open, visible]);

  useEffect(
    () => () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      if (enterRaf.current) cancelAnimationFrame(enterRaf.current);
    },
    [],
  );

  useEffect(() => {
    if (!visible) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [visible]);

  const beginClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    timeoutRef.current = window.setTimeout(() => {
      onClose();
      setVisible(false);
      setClosing(false);
    }, 220);
  }, [closing, onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Esc') beginClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [beginClose, open]);

  async function handleShare() {
    const shareUrl = 'https://lectum.wiki/';
    try {
      const shareData: ShareData = {
        title: 'Lectum',
        text: 'Check out Lectum — a minimalist reading tracker',
        url: shareUrl,
      };
      const navWithShare = navigator as Navigator & {
        share?: (data: ShareData) => Promise<void>;
      };
      if (typeof navWithShare.share === 'function') {
        await navWithShare.share(shareData);
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setStatusMessage('Link copied.');
        return;
      }
      window.prompt('Copy this link', shareUrl);
    } catch {
      setStatusMessage('Share unavailable.');
    }
  }

  async function handleExport() {
    try {
      setExporting(true);
      const payload = buildExportPayload({
        books,
        settings: {
          themeMode: mode,
          dateFormat,
        },
      });
      const json = JSON.stringify(payload, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const now = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `lectum-export-${now}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setStatusMessage('Export complete.');
    } catch {
      setStatusMessage('Export failed.');
    } finally {
      setExporting(false);
    }
  }

  async function handleFileChosen(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    setImporting(true);
    try {
      const parsed = parseImportPayload(text);
      if (!parsed.ok) {
        setStatusMessage(
          parsed.reason === 'not_lectum'
            ? 'That file is not a Lectum export.'
            : 'Import failed. Check the file and try again.',
        );
        return;
      }

      await importBooks(parsed.payload.books);
      setMode(parsed.payload.settings.themeMode);
      setDateFormat(parsed.payload.settings.dateFormat);
      setStatusMessage(
        `Imported ${parsed.payload.books.length} ${parsed.payload.books.length === 1 ? 'book' : 'books'}.`,
      );
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  }

  function triggerFilePick() {
    fileRef.current?.click();
  }

  function handleSyncInfo() {
    setStatusMessage('Sync is planned for a later Lectum release.');
  }

  async function handleEraseData() {
    try {
      await useBookStore.getState().importBooks([]);
      usePreferencesStore.getState().setDateFormat('DMY');
      useThemeStore.getState().setMode('system');
      localStorage.removeItem(STORAGE_KEYS.PREFERENCES);
      localStorage.removeItem(STORAGE_KEYS.THEME_STORE);
      localStorage.removeItem(STORAGE_KEYS.THEME_MODE);
      localStorage.removeItem(STORAGE_KEYS.THEME_LAST_RESOLVED);
      setStatusMessage(null);
      setConfirmClearOpen(false);
      beginClose();
    } catch (error) {
      console.error('Failed to erase Lectum data', error);
      setStatusMessage('Erase failed.');
      setConfirmClearOpen(false);
    }
  }

  if (!visible) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      className={`fixed inset-0 z-[80] flex flex-col items-center p-5 transition-colors duration-200 ${closing || entering ? 'bg-transparent' : 'bg-overlay backdrop-blur-sm'}`}
      onClick={beginClose}
    >
      <div className="flex-[4] min-h-[40px] pointer-events-none" />
      <div
        className={`w-full max-w-sm rounded-2xl bg-surface-elevated p-6 pt-3 shadow-elevated ring-1 ring-black/5 dark:ring-neutral-700/5 border border-subtle overflow-y-auto relative transition-all duration-200 ${closing || entering ? 'opacity-0 scale-[0.95] translate-y-1' : 'opacity-100 scale-100 translate-y-0'}`}
        style={{
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
          maxHeight: 'min(720px, 90vh)',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="-mx-6 px-6 pb-3 mb-2 border-b border-subtle">
          <div className="grid grid-cols-3 items-center gap-2 h-12 relative">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  void handleShare();
                }}
                className="grid h-10 w-full place-items-center rounded-lg border border-subtle text-muted hover-nonaccent transition"
                aria-label="Share"
                title="Share"
              >
                <Share2 className="h-4 w-4" />
              </button>
              <div />
            </div>

            <span id="settings-title" className="text-lg font-semibold tracking-wide text-strong text-center">
              Settings
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div />
              <button
                type="button"
                onClick={beginClose}
                className="grid h-10 w-full place-items-center rounded-lg border border-subtle text-muted hover-nonaccent transition"
                aria-label="Close settings"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          <div className="text-sm">
            <div className="grid grid-cols-3 items-center gap-2">
              <div>
                <div className="text-sm font-semibold mb-0.5">THEME</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div />
                <button
                  type="button"
                  onClick={() => setMode('system')}
                  className={`grid h-10 w-full place-items-center rounded-lg border border-subtle transition ${isSystemTheme ? 'bg-accent text-inverse shadow-elevated' : 'text-muted hover-nonaccent'}`}
                  aria-pressed={isSystemTheme}
                  aria-label="System"
                  title="System"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <path d="M8 21h8" />
                    <path d="M12 17v4" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => setMode('light')}
                  className={`grid h-10 w-full place-items-center rounded-lg border border-subtle transition ${!isSystemTheme && mode === 'light' ? 'bg-accent text-inverse shadow-elevated' : 'text-muted hover-nonaccent'}`}
                  aria-pressed={!isSystemTheme && mode === 'light'}
                  aria-label="Light"
                  title="Light"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M20 12h2M2 12H0" />
                    <path d="m17 17 1.5 1.5M5.5 5.5 7 7" />
                    <path d="m17 7 1.5-1.5M5.5 18.5 7 17" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('dark')}
                  className={`grid h-10 w-full place-items-center rounded-lg border border-subtle transition ${!isSystemTheme && mode === 'dark' ? 'bg-accent text-inverse shadow-elevated' : 'text-muted hover-nonaccent'}`}
                  aria-pressed={!isSystemTheme && mode === 'dark'}
                  aria-label="Dark"
                  title="Dark"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div className="border-t border-subtle" />

          <div className="text-sm">
            <div className="grid grid-cols-3 items-center gap-2">
              <div>
                <div className="text-sm font-semibold mb-0.5">FORMAT</div>
              </div>
              <div className="relative w-full col-span-2">
                <select
                  aria-label="Date format"
                  className="appearance-none w-full rounded-lg border border-subtle bg-transparent px-3 h-10 pr-7 text-sm text-strong"
                  value={dateFormat}
                  onChange={(event) => setDateFormat(event.target.value as 'MDY' | 'DMY')}
                >
                  <option value="MDY">MM/DD</option>
                  <option value="DMY">DD/MM</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              </div>
            </div>
          </div>
          <div className="border-t border-subtle" />

          <div className="text-sm">
            <div className="grid grid-cols-3 items-center gap-2">
              <div className="col-span-2">
                <div className="text-sm font-semibold mb-0.5">INSTALL APP</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (isInstalled) return;
                  if (canInstall) {
                    void install();
                  } else {
                    setStatusMessage('Install prompt is unavailable on this device right now.');
                  }
                }}
                disabled={isInstalled}
                aria-disabled={isInstalled}
                className={`w-full flex items-center justify-center gap-1.5 rounded-lg h-10 px-3 text-xs font-medium transition-colors whitespace-nowrap ${
                  isInstalled
                    ? 'cursor-not-allowed border border-subtle text-muted opacity-60'
                    : 'bg-accent text-inverse hover:opacity-90'
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {isInstalled ? 'Installed' : 'Install'}
              </button>
            </div>
          </div>
          <div className="border-t border-subtle" />

          <div className="text-sm">
            <div className="grid grid-cols-3 items-center gap-2">
              <div>
                <div className="text-sm font-semibold mb-0.5">DATA</div>
              </div>
              <button
                type="button"
                onClick={triggerFilePick}
                disabled={importing || exporting}
                aria-label="Import from file"
                title="Import from file"
                className="w-full flex items-center justify-center gap-1.5 rounded-lg h-10 px-3 text-xs font-medium border border-subtle text-strong hover:bg-subtle transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-folder-input-icon lucide-folder-input"
                >
                  <path d="M2 9V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1" />
                  <path d="M2 13h10" />
                  <path d="m9 16 3-3-3-3" />
                </svg>
                <span>Import</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleExport();
                }}
                disabled={exporting}
                aria-label="Export data"
                title="Export data"
                className="w-full flex items-center justify-center gap-1.5 rounded-lg h-10 px-3 text-xs font-medium border border-subtle text-strong hover:bg-subtle transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-folder-output-icon lucide-folder-output"
                >
                  <path d="M2 7.5V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-1.5" />
                  <path d="M2 13h10" />
                  <path d="m5 10-3 3 3 3" />
                </svg>
                <span>Export</span>
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              onChange={handleFileChosen}
              className="hidden"
            />
          </div>
          <div className="border-t border-subtle" />

          <div className="text-sm">
            <div className="grid grid-cols-3 items-center gap-2">
              <div className="col-span-2">
                <div className="text-sm font-semibold mb-0.5">SYNC</div>
              </div>
              <button
                type="button"
                onClick={handleSyncInfo}
                className="w-full h-10 flex items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium border border-subtle text-strong hover:bg-subtle transition whitespace-nowrap"
              >
                <Dot className="h-6 w-6 shrink-0 text-muted" strokeWidth={6} aria-hidden />
                <span>Manage</span>
              </button>
            </div>
          </div>
          <div className="border-t border-subtle" />

          <div className="text-sm">
            <div className="grid grid-cols-3 items-center gap-2">
              <div className="col-span-2">
                <div className="text-sm font-semibold mb-0.5">ERASE DATA</div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmClearOpen(true)}
                aria-label="Erase local data"
                title="Erase local data"
                className="w-full flex items-center justify-center gap-1.5 rounded-lg h-10 px-3 text-xs font-medium border border-danger text-danger hover:bg-danger-soft transition whitespace-nowrap"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-eraser-icon lucide-eraser"
                >
                  <path d="M21 21H8a2 2 0 0 1-1.42-.587l-3.994-3.999a2 2 0 0 1 0-2.828l10-10a2 2 0 0 1 2.829 0l5.999 6a2 2 0 0 1 0 2.828L12.834 21" />
                  <path d="m5.082 11.09 8.828 8.828" />
                </svg>
                <span>Erase</span>
              </button>
            </div>
          </div>

          {statusMessage ? (
            <>
              <div className="border-t border-subtle" />
              <div className="text-xs text-muted">{statusMessage}</div>
            </>
          ) : null}
        </div>

        <div className="-mx-6 mt-6 border-t border-subtle pt-4 px-6">
          <div className="text-[12px] text-muted">
            <div className="grid grid-cols-3 items-center gap-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="grid h-10 w-full place-items-center">
                  <a
                    href="https://www.linkedin.com/in/itskylebrooks/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Kyle Brooks on LinkedIn"
                    className="text-strong opacity-90 hover:opacity-75 transition-opacity inline-flex items-center justify-center"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                </div>
                <div />
              </div>

              <div className="text-center flex flex-col items-center">
                <div className="font-medium text-strong whitespace-nowrap">
                  Lectum <span className="mx-2">•</span> {APP_VERSION}
                </div>
                <div className="mt-0.5 flex items-center justify-center gap-3 whitespace-nowrap">
                  <a
                    href="https://lectum.wiki/imprint"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline inline-block leading-tight relative z-10"
                  >
                    Imprint
                  </a>
                  <a
                    href="https://lectum.wiki/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline inline-block leading-tight relative z-10"
                  >
                    Privacy Policy
                  </a>
                  <a
                    href="https://lectum.wiki/license"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline inline-block leading-tight relative z-10"
                  >
                    License
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div />
                <div className="grid h-10 w-full place-items-center">
                  <a
                    href="https://lectum.wiki/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open Lectum website"
                    className="text-strong opacity-90 hover:opacity-75 transition-opacity inline-flex items-center justify-center"
                  >
                    <SquareArrowOutUpRight className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ConfirmModal
        open={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        onConfirm={() => {
          void handleEraseData();
        }}
        title="Erase all local data?"
        message="This will remove all Lectum books and local settings stored in this browser. This cannot be undone."
        confirmLabel="Erase"
        destructive
      />
      <div className="flex-[6] pointer-events-none" />
    </div>,
    document.body,
  );
}
