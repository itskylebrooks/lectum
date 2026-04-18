import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SettingsModal from './SettingsModal';

const installMock = vi.fn();
const usePWAMock = vi.fn();

vi.mock('@/shared/hooks/usePWA', () => ({
  usePWA: () => usePWAMock(),
}));

describe('SettingsModal PWA install', () => {
  beforeEach(() => {
    installMock.mockReset();
    usePWAMock.mockReturnValue({
      isInstalled: false,
      canInstall: false,
      install: installMock,
      isIosDevice: false,
      isAndroidDevice: false,
    });
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value:
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
    });
    Object.defineProperty(window.navigator, 'platform', {
      configurable: true,
      value: 'Linux x86_64',
    });
  });

  it('calls the browser install prompt when available', async () => {
    usePWAMock.mockReturnValue({
      isInstalled: false,
      canInstall: true,
      install: installMock,
      isIosDevice: false,
      isAndroidDevice: false,
    });

    const user = userEvent.setup();
    render(<SettingsModal open onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /install/i }));

    expect(installMock).toHaveBeenCalledTimes(1);
  });

  it('shows fallback install guidance when no prompt is available', async () => {
    const user = userEvent.setup();
    render(<SettingsModal open onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /install/i }));

    expect(installMock).not.toHaveBeenCalled();
    expect(screen.getByText(/install is not available here/i)).toBeInTheDocument();
  });

  it('shows Safari-specific desktop guidance on macOS Safari', async () => {
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
    });
    Object.defineProperty(window.navigator, 'platform', {
      configurable: true,
      value: 'MacIntel',
    });

    const user = userEvent.setup();
    render(<SettingsModal open onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /install/i }));

    expect(installMock).not.toHaveBeenCalled();
    expect(screen.getByText(/add lectum to your dock/i)).toBeInTheDocument();
  });
});
