import '@testing-library/jest-dom';
import { vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock global para fetch
global.fetch = vi.fn();

// Mock matchMedia for responsive component tests
Object.defineProperty(window, 'matchMedia', {
writable: true,
value: vi.fn().mockImplementation(query => ({
matches: false,
media: query,
onchange: null,
addListener: vi.fn(),
removeListener: vi.fn(),
addEventListener: vi.fn(),
removeEventListener: vi.fn(),
dispatchEvent: vi.fn(),
})),
});

// Mock IntersectionObserver for lazy loading tests
class MockIntersectionObserver {
observe = vi.fn();
disconnect = vi.fn();
unobserve = vi.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
writable: true,
value: MockIntersectionObserver,
});

// Mock ResizeObserver for responsive tests
class MockResizeObserver {
observe = vi.fn();
disconnect = vi.fn();
unobserve = vi.fn();
}

Object.defineProperty(window, 'ResizeObserver', {
writable: true,
value: MockResizeObserver,
});

// Mock scrollTo for scroll tests
Object.defineProperty(window, 'scrollTo', {
writable: true,
value: vi.fn(),
});

// Mock localStorage and sessionStorage
const mockStorage = {
getItem: vi.fn(),
setItem: vi.fn(),
removeItem: vi.fn(),
clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
value: mockStorage,
});

Object.defineProperty(window, 'sessionStorage', {
value: mockStorage,
});

// Mock de console en tests para reducir ruido
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

console.error = (...args: unknown[]) => {
// Ignorar warnings específicos de React
if (
typeof args[0] === 'string' &&
(
args[0].includes('Warning: ReactDOM.render') ||
args[0].includes('act(...)') ||
args[0].includes('Warning: validateDOMNesting') ||
args[0].includes('Warning: useLayoutEffect')
)
) {
return;
}
originalConsoleError(...args);
};

console.warn = (...args: unknown[]) => {
if (
typeof args[0] === 'string' &&
(
args[0].includes('React does not recognize') ||
args[0].includes('forwardRef') ||
args[0].includes('propTypes')
)
) {
return;
}
originalConsoleWarn(...args);
};

// Silence logs in test mode unless DEBUG is set
if (!process.env.DEBUG) {
console.log = vi.fn();
}

// Cleanup después de cada test
afterEach(() => {
vi.clearAllMocks();
cleanup();
});
