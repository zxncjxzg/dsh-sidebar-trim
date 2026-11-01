/**
 * dsh-sidebar-trim · Client half.
 *
 * The whole plugin is one stylesheet: the sidebar's global panel navigation
 * (`插件` / `插件市场` / `自动化任务` / `更多`) is rendered by the shell from
 * `sidebar.panellist` registrations, and the Slot API can only add entries, not
 * hide them — the "plugins" row is even hard-wired to always show. So the one
 * supported lever left is CSS, anchored on the slot contract instead of the
 * build-hashed class names (`kB3qhq_panelRow`, which change every release).
 *
 * Ownership: the tag carries `data-plugin` / `data-plugin-css`, so the client
 * module system removes it when this plugin is reloaded, disabled or removed,
 * and the `ctx.effect` disposer removes it on plugin disposal. Disabling the
 * plugin is therefore a complete undo, with no page reload.
 */
window.__ModuleLoader__.load({
  id: "dsh-sidebar-trim",
  factory() {
    const PLUGIN_ID = "dsh-sidebar-trim";
    const STYLE_KEY = PLUGIN_ID + "/sidebar-trim.css";

    // `[data-slot="sidebar"]` is the anchor every Slot renders around its
    // content (display:contents), and the panel navigation is the only <nav>
    // inside the sidebar subtree. Hiding it also drops its margins, so no
    // empty gap is left between "新会话" and the workspace list.
    const CSS = [
      "/* dsh-sidebar-trim: hide the sidebar's global panel navigation. */",
      '[data-slot="sidebar"] nav {',
      "  display: none !important;",
      "}",
      "",
    ].join("\n");

    /** Insert the stylesheet once; returns the disposer that takes it back out. */
    function mountStyle() {
      if (typeof document === "undefined") return function noop() {};
      const selector = 'style[data-plugin-css="' + STYLE_KEY + '"]';
      if (document.querySelector(selector) !== null) return function noop() {};
      const tag = document.createElement("style");
      tag.dataset.plugin = PLUGIN_ID;
      tag.dataset.pluginCss = STYLE_KEY;
      tag.textContent = CSS;
      document.head.appendChild(tag);
      return function unmountStyle() {
        tag.remove();
      };
    }

    return {
      name: PLUGIN_ID,
      apply(ctx) {
        ctx.effect(mountStyle, PLUGIN_ID + ": hide the sidebar panel navigation");
      },
    };
  },
});
