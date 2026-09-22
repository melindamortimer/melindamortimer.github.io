const KEY_ACTIONS = Object.freeze({
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'jump',
  KeyW: 'jump',
  Space: 'jump',
  ShiftLeft: 'dash',
  ShiftRight: 'dash',
  KeyX: 'dash',
  Escape: 'pause',
  KeyP: 'pause',
  KeyR: 'restart',
});

const ACTIONS = new Set(Object.values(KEY_ACTIONS));
const INTERACTIVE_TARGETS = [
  'button',
  'a[href]',
  'input',
  'select',
  'textarea',
  '[contenteditable="true"]',
  '[role="button"]',
  '[role="dialog"]',
  '.screen.is-active',
].join(',');

function isInteractiveTarget(target) {
  return Boolean(target?.closest?.(INTERACTIVE_TARGETS));
}

/**
 * Keyboard and pointer input with both held and one-frame edge states.
 * Buttons carrying a data-action attribute are wired automatically.
 */
export class InputManager {
  constructor(options = {}) {
    const looksLikeRoot = options?.querySelectorAll && !('root' in options);

    this.root = looksLikeRoot
      ? options
      : options.root ?? globalThis.document ?? null;
    this.target = looksLikeRoot
      ? globalThis.window ?? null
      : options.target ?? globalThis.window ?? null;

    this.pressed = new Set();
    this.sources = new Map();
    this.pointerActions = new Map();
    this.buttonBindings = [];
    this.activationTimers = new Set();
    this.enabled = true;

    this._onKeyDown = (event) => {
      const action = KEY_ACTIONS[event.code];
      if (!action || !this.enabled || isInteractiveTarget(event.target)) return;

      event.preventDefault();
      this._press(action, `key:${event.code}`);
    };

    this._onKeyUp = (event) => {
      const action = KEY_ACTIONS[event.code];
      if (!action) return;

      const source = `key:${event.code}`;
      const wasHandled = this.sources.get(action)?.has(source);
      if (!wasHandled) return;
      event.preventDefault();
      this._release(action, source);
    };

    this._onWindowPointerEnd = (event) => {
      if (this.pointerActions.has(event.pointerId)) event.preventDefault();
      this._releasePointer(event.pointerId);
    };

    this._onBlur = () => this._clearHeld();
    this._onVisibilityChange = () => {
      if (globalThis.document?.hidden) this._clearHeld();
    };

    this.target?.addEventListener('keydown', this._onKeyDown, { passive: false });
    this.target?.addEventListener('keyup', this._onKeyUp, { passive: false });
    this.target?.addEventListener('pointerup', this._onWindowPointerEnd, { passive: false });
    this.target?.addEventListener('pointercancel', this._onWindowPointerEnd, { passive: false });
    this.target?.addEventListener('blur', this._onBlur);
    globalThis.document?.addEventListener('visibilitychange', this._onVisibilityChange);

    this._bindTouchButtons();
  }

  _bindTouchButtons() {
    if (!this.root?.querySelectorAll) return;

    this.root.querySelectorAll('[data-action]').forEach((button, index) => {
      const action = button.dataset.action;
      if (!ACTIONS.has(action)) return;

      const onPointerDown = (event) => {
        if (!this.enabled) return;
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        event.preventDefault();

        this._releasePointer(event.pointerId);
        const source = `pointer:${event.pointerId}:${index}`;
        this.pointerActions.set(event.pointerId, { action, source });
        this._press(action, source);

        try {
          button.setPointerCapture?.(event.pointerId);
        } catch {
          // Capture is an enhancement; window-level pointer handlers are the fallback.
        }
      };

      const onPointerEnd = (event) => {
        event.preventDefault();
        this._releasePointer(event.pointerId);
      };

      const onContextMenu = (event) => event.preventDefault();

      // Native buttons emit a detail=0 click for keyboard and most assistive
      // activation. Give those users the same short, real input pulse while
      // pointer users retain press-and-hold movement above.
      const onClick = (event) => {
        if (!this.enabled || event.detail !== 0) return;
        event.preventDefault();

        const source = `activation:${index}:${performance.now()}`;
        this._press(action, source);
        const timer = globalThis.setTimeout(() => {
          this.activationTimers.delete(timer);
          this._release(action, source);
        }, 140);
        this.activationTimers.add(timer);
      };

      button.addEventListener('pointerdown', onPointerDown, { passive: false });
      button.addEventListener('pointerup', onPointerEnd, { passive: false });
      button.addEventListener('pointercancel', onPointerEnd, { passive: false });
      button.addEventListener('lostpointercapture', onPointerEnd, { passive: false });
      button.addEventListener('contextmenu', onContextMenu);
      button.addEventListener('click', onClick);

      this.buttonBindings.push({
        button,
        onPointerDown,
        onPointerEnd,
        onContextMenu,
        onClick,
      });
    });
  }

  _press(action, source) {
    let actionSources = this.sources.get(action);
    if (!actionSources) {
      actionSources = new Set();
      this.sources.set(action, actionSources);
    }

    const wasDown = actionSources.size > 0;
    actionSources.add(source);
    if (!wasDown) this.pressed.add(action);
  }

  _release(action, source) {
    const actionSources = this.sources.get(action);
    if (!actionSources) return;

    actionSources.delete(source);
    if (actionSources.size === 0) this.sources.delete(action);
  }

  _releasePointer(pointerId) {
    const binding = this.pointerActions.get(pointerId);
    if (!binding) return;

    this._release(binding.action, binding.source);
    this.pointerActions.delete(pointerId);
  }

  _clearHeld() {
    this.sources.clear();
    this.pointerActions.clear();
    this.pressed.clear();
  }

  setEnabled(enabled) {
    const next = Boolean(enabled);
    if (this.enabled === next) return;
    this.enabled = next;
    if (!next) this._clearHeld();
  }

  isDown(action) {
    return (this.sources.get(action)?.size ?? 0) > 0;
  }

  consume(action) {
    if (!this.pressed.has(action)) return false;
    this.pressed.delete(action);
    return true;
  }

  endFrame() {
    this.pressed.clear();
  }

  destroy() {
    this.target?.removeEventListener('keydown', this._onKeyDown);
    this.target?.removeEventListener('keyup', this._onKeyUp);
    this.target?.removeEventListener('pointerup', this._onWindowPointerEnd);
    this.target?.removeEventListener('pointercancel', this._onWindowPointerEnd);
    this.target?.removeEventListener('blur', this._onBlur);
    globalThis.document?.removeEventListener('visibilitychange', this._onVisibilityChange);

    this.buttonBindings.forEach(({ button, onPointerDown, onPointerEnd, onContextMenu, onClick }) => {
      button.removeEventListener('pointerdown', onPointerDown);
      button.removeEventListener('pointerup', onPointerEnd);
      button.removeEventListener('pointercancel', onPointerEnd);
      button.removeEventListener('lostpointercapture', onPointerEnd);
      button.removeEventListener('contextmenu', onContextMenu);
      button.removeEventListener('click', onClick);
    });

    this.activationTimers.forEach((timer) => globalThis.clearTimeout(timer));
    this.activationTimers.clear();
    this.buttonBindings.length = 0;
    this._clearHeld();
  }
}
