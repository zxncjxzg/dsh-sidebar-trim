# Changelog

## 0.2.5

- The mode is stored in a cookie instead of `localStorage`, so it survives a restart: the harness picks a new port on every launch and `localStorage` is scoped by origin (scheme + host + port). Cookies ignore the port. A value written by 0.2.4 or earlier is adopted on first load.

## 0.2.4

- The Settings page follows the UI language by reading `<html lang>`. The desktop renderer runs with `--lang=en-US`, so `navigator.language` reported English even in a Chinese UI.

## 0.2.3

- No longer touches `ctx.locale`. A client context throws on any service property that is not listed in `inject`, and that read aborted the entry — which is a boot failure, not a missing panel.
- The whole `apply()` body is wrapped in one guard: a decoration may fail to appear, it may never fail to boot.

## 0.2.2

- Adds a start-up self-check recorded in storage (withdrawn: it read `ctx.locale` outside the guard and broke web boot).

## 0.2.1

- Fixes `factory()`: the module needs `factory(require)` — the loader passes `require` as the first argument, and the previous signature made the client bundle fail with `require is not defined`, which took the whole web boot down.

## 0.2.0

- Three modes in a Settings page: hide everything, keep the More button, hide nothing.
- The choice applies immediately; nothing reloads.

## 0.1.0

- Hides the sidebar's global panel navigation (Plugins / Market / Schedules / More) with one stylesheet anchored on the `[data-slot="sidebar"]` contract.
