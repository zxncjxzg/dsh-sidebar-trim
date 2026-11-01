/**
 * dsh-sidebar-trim · Host half.
 *
 * v1 has no Host behavior — the entire plugin is one stylesheet owned by the
 * Client half. This entry exists because every plugin bundle needs a Host
 * plugin; keeping it a no-op means installing this package can never fail on
 * the Host side.
 */
export function apply() {}
