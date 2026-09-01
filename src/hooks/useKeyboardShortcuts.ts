import { useEffect } from 'react';

interface Shortcuts {
  toggle: () => void;
  skipBack: () => void;
  skipForward: () => void;
  prev: () => void;
  next: () => void;
}

function isTypingTarget(el: EventTarget | null): boolean {
  const node = el as HTMLElement | null;
  if (!node) return false;
  const tag = node.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || node.isContentEditable;
}

/** Global player keyboard shortcuts (ignored while typing in a field). */
export function useKeyboardShortcuts({ toggle, skipBack, skipForward, prev, next }: Shortcuts): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          toggle();
          break;
        case 'ArrowLeft':
        case 'j':
          e.preventDefault();
          skipBack();
          break;
        case 'ArrowRight':
        case 'l':
          e.preventDefault();
          skipForward();
          break;
        case 'ArrowUp':
          e.preventDefault();
          prev();
          break;
        case 'ArrowDown':
          e.preventDefault();
          next();
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle, skipBack, skipForward, prev, next]);
}
