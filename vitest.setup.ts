import '@testing-library/jest-dom/vitest';

interface ResizeObserverEntry {
  target: Element;
  contentRect: DOMRectReadOnly;
}

// Mock ResizeObserver for Radix UI components
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: class ResizeObserver {
    #callback: (entries: ResizeObserverEntry[]) => void;
    
    constructor(callback: (entries: ResizeObserverEntry[]) => void) {
      this.#callback = callback;
    }
    
    observe() {
      this.#callback([{
        target: document.createElement('div'),
        contentRect: { 
          width: 0, 
          height: 0,
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          x: 0,
          y: 0,
          toJSON: () => {}
        } as DOMRectReadOnly,
      }]);
    }
    
    unobserve() {}
    disconnect() {}
  },
});

// Mock matchMedia for dark mode
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});