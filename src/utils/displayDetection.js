export async function detectExtendedDisplay() {
  const fallback = detectExtendedDisplayFallback();
  const details = await readScreenDetails();
  if (!details) return fallback;
  return {
    extended: details.extended || fallback.extended,
    method: details.method,
    reason: details.reason || fallback.reason,
    screenCount: details.screenCount || fallback.screenCount
  };
}

export function detectExtendedDisplayFallback() {
  try {
    const screen = window.screen;
    if (!screen) return { extended: false, method: 'unavailable', reason: 'Screen API unavailable', screenCount: 1 };

    if (screen.isExtended === true) {
      return { extended: true, method: 'screen.isExtended', reason: 'Browser reports an extended display', screenCount: 2 };
    }

    const width = Number(screen.width || 0);
    const height = Number(screen.height || 0);
    const availWidth = Number(screen.availWidth || 0);
    const availHeight = Number(screen.availHeight || 0);
    const left = Number(screen.left ?? screen.availLeft ?? 0);
    const top = Number(screen.top ?? screen.availTop ?? 0);
    const screenX = Number(window.screenX ?? window.screenLeft ?? 0);
    const screenY = Number(window.screenY ?? window.screenTop ?? 0);

    if (left !== 0 || top !== 0 || screenX < left - 20 || screenY < top - 20) {
      return { extended: true, method: 'screen-position', reason: 'Assessment window appears on a non-primary display', screenCount: 2 };
    }

    if (width > 0 && availWidth > width * 1.25) {
      return { extended: true, method: 'screen-width', reason: 'Available desktop width is larger than a single display', screenCount: 2 };
    }

    if (height > 0 && availHeight > height * 1.25) {
      return { extended: true, method: 'screen-height', reason: 'Available desktop height is larger than a single display', screenCount: 2 };
    }

    return { extended: false, method: 'fallback', reason: 'Single display detected', screenCount: 1 };
  } catch {
    return { extended: false, method: 'fallback-error', reason: 'Display check could not complete', screenCount: 1 };
  }
}

async function readScreenDetails() {
  if (typeof window === 'undefined' || typeof window.getScreenDetails !== 'function') return null;
  try {
    const details = await window.getScreenDetails();
    const screens = Array.isArray(details?.screens) ? details.screens : [];
    return {
      extended: Boolean(details?.isExtended) || screens.length > 1,
      method: 'getScreenDetails',
      reason: screens.length > 1 ? `${screens.length} displays detected` : 'Single display detected',
      screenCount: screens.length || 1,
      details
    };
  } catch (err) {
    return {
      extended: false,
      method: 'getScreenDetails-denied',
      reason: err?.message || 'Screen details permission was not granted',
      screenCount: 1
    };
  }
}
