# Synx.js Roadmap

## Core Framework
- [x] Virtual DOM implementation (@vdom)
- [x] Component system (@instance)
- [x] Props and state management (@hooks, @store)
- [x] Lifecycle hooks (@hooks)
- [x] Reactivity system (@reactivity)
- [x] Fragments (@vdom)
- [ ] Error boundaries (partial - basic support exists)
- [ ] Suspense support
- [ ] Concurrent rendering
- [ ] Portals
- [ ] Refs system

## Rendering
- [x] Client-side rendering (@client)
- [x] Server-side rendering (@server)
- [x] Static site generation
- [x] Basic hydration (@client)
- [x] Streaming SSR improvements
  - [x] Selective streaming
    - [x] Priority-based streaming
    - [x] Deferred streaming
    - [x] Timeout control
  - [x] Error boundary support
  - [x] Head management
    - [x] Title handling
    - [x] Meta tags
    - [x] Link tags
    - [x] Script injection
  - [ ] Progressive hydration
  - [ ] Selective hydration
  - [x] Shell generation
  - [x] Data serialization
  - [x] Security
    - [x] HTML escaping
    - [x] XSS prevention
    - [x] Data sanitization
- [ ] Partial hydration
- [ ] Island architecture
- [ ] Component prefetching
- [x] Basic SEO support
  - [x] Server rendering
  - [x] Meta tags
  - [ ] Advanced optimizations

## Asset Management
- [x] Basic static asset handling
- [x] CSS minification and sourcemaps
- [x] Image optimization (JPEG, PNG, WebP)
- [ ] Additional image formats (GIF, AVIF)
- [ ] CSS modules support
- [ ] Asset versioning/hashing
- [ ] Asset preloading
- [ ] Lazy loading for images
- [ ] Asset bundling optimization
- [ ] WebP/AVIF auto-conversion
- [ ] Image responsive sizes generation

## Build System
- [x] Basic build pipeline
- [x] Development/production mode configurations (@tsup)
  - [x] Minification
  - [x] Source maps
  - [x] Tree shaking
- [x] Code splitting
  - [x] Package-level splitting (monorepo)
  - [x] Integration-level splitting (vike)
  - [ ] Route-based splitting
  - [ ] Component-level splitting
- [ ] Build-time optimizations
  - [ ] Dead code elimination
  - [ ] Module concatenation
  - [ ] Scope hoisting
- [ ] Differential bundling (modern/legacy)
- [x] Build caching (via Turborepo)
- [ ] CSS/Asset handling improvements
  - [ ] CSS code splitting
  - [ ] Asset optimization pipeline
  - [ ] Critical CSS extraction

## Development Experience
- [x] Hot Module Replacement (HMR)
- [x] File system routing
- [x] Development server improvements
  - [x] Custom middleware support
  - [x] Source maps support
  - [x] HMR + SSR integration
  - [ ] HTTPS support
  - [ ] Proxy configuration
  - [ ] Fast refresh integration
- [x] Error handling
  - [x] Runtime error catching
  - [x] Source map integration
  - [ ] Enhanced error overlay
  - [ ] Build error formatting
- [x] Development tools
  - [x] Performance profiling
  - [x] Type checking in dev mode
  - [ ] Bundle analysis

## Router
- [x] File-system based routing
- [x] Dynamic routes (via `[param]` syntax)
- [x] Nested routes
- [x] Route guards
- [x] Middleware support
- [x] Lazy loading
- [x] Route transitions
- [ ] Data loading
  - [ ] Route-level data fetching
  - [ ] Parallel data loading
  - [ ] Data prefetching
- [ ] Navigation improvements
  - [ ] Route prefetching
  - [ ] Back/forward handling
  - [ ] Scroll restoration
- [ ] Advanced patterns
  - [ ] Modal routes
  - [ ] Parallel routes
  - [ ] Intercepting routes

## State Management
- [x] Built-in store (PulseStore)
- [x] State persistence (via middleware)
- [x] State middleware
  - [x] Logger middleware
  - [x] Persistence middleware
  - [ ] Time-travel middleware
  - [ ] DevTools middleware
- [ ] Actions/mutations system
- [ ] DevTools integration
  - [x] Basic DevTools UI
  - [x] State inspection
  - [x] Time travel debugging
  - [x] Undo/Redo functionality
  - [x] State history
  - [x] DevTools middleware
  - [x] Action logging
  - [x] State diff visualization
  - [ ] Advanced features
    - [ ] Component tree inspection
    - [ ] Performance profiling
    - [ ] Network request tracking
    - [ ] Custom plugin API
  - [ ] Browser extension
    - [ ] Chrome extension
    - [ ] Firefox extension
    - [ ] State persistence
    - [ ] Remote debugging
- [ ] Advanced features
  - [ ] State composition
  - [ ] Computed values
  - [ ] State snapshots
  - [ ] Undo/Redo

## Testing
- [x] Unit testing setup (Vitest)
- [x] Component testing utilities
- [x] Integration testing
- [ ] E2E testing integration
- [ ] Visual regression testing
- [ ] Performance testing tools
- [ ] Accessibility testing

## Documentation
- [ ] API documentation
- [ ] Getting started guide
- [ ] Best practices
- [ ] Examples/Templates
- [ ] Migration guides
- [ ] Contributing guidelines

## Performance
- [ ] Runtime performance optimizations
- [ ] Bundle size optimizations
- [ ] Memory usage improvements
- [ ] Startup time optimization
- [ ] Core library tree-shaking

## Ecosystem
- [ ] CLI tool
- [ ] DevTools extension
- [ ] VS Code extension
- [ ] Official component library
- [ ] Form handling
- [ ] Data fetching utilities

## Infrastructure
- [x] Monorepo tooling (using Turborepo)
- [x] Package structure
  - [x] Core packages separation
  - [x] Plugin system
  - [x] Framework integrations
- [x] Build system (@tsup)
  - [x] Multiple entry points
  - [x] Integration builds
  - [x] Plugin builds
- [x] Testing setup (Vitest)
- [ ] CI/CD improvements
- [ ] Automated release process
- [ ] Version management

## Hooks
- [x] Core Hooks
  - [x] useState
  - [x] useEffect
  - [x] useCallback
  - [x] useMemo
  - [x] useRef
  - [x] useMount
- [x] Store Integration
  - [x] usePulseState
  - [x] usePulseEffect
- [ ] Advanced Hooks
  - [ ] useComputed (reactive computed values)
  - [ ] useResource (data fetching)
  - [ ] useTransition (animation states)
  - [ ] useSignal (fine-grained reactivity)
  - [ ] useScheduler (batch updates)
- [ ] Custom Hooks
  - [ ] usePrevious
  - [ ] useDebounce
  - [ ] useThrottle
  - [ ] useLocalStorage
  - [ ] useMediaQuery

Feel free to contribute by submitting PRs or opening issues for discussion!
