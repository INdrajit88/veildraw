// Browser shim for isomorphic-ws.
// The real package is CommonJS (`module.exports = WebSocket`), which webpack
// cannot interop with when node_modules code does ESM named/default imports.
// In browsers the global WebSocket is the correct implementation.
export const WebSocket = globalThis.WebSocket;
export default globalThis.WebSocket;
