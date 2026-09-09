// A focus departure remains one incident until the candidate has returned.
// Fullscreen loss caused by that departure shares the same durable event ID.
export function createIncidentCoordinator(makeId = () => crypto.randomUUID()) {
  let departure = null;
  let fullscreen = null;
  return {
    leave() { return departure ||= fullscreen || makeId(); },
    exitFullscreen() { return fullscreen ||= departure || makeId(); },
    returned(isFullscreen) { departure = null; if (isFullscreen) fullscreen = null; },
    enteredFullscreen() { fullscreen = null; },
    action() { return makeId(); }
  };
}
