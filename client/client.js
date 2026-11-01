/**
 * dsh-sidebar-trim · Client half.
 *
 * The sidebar's global panel navigation (`插件` / `插件市场` / `自动化任务` /
 * `更多`) is rendered by the shell from `sidebar.panellist` registrations. The
 * Slot API can only add entries, never hide them — the "plugins" row is even
 * hard-wired to always show — so the one supported lever left is CSS anchored
 * on the slot contract instead of the build-hashed class names
 * (`kB3qhq_panelRow`, which change every release).
 *
 * v2 adds a settings page at Settings → 侧栏. The chosen mode is applied
 * immediately (the style tag is rewritten in place) and remembered in this
 * browser, so getting the rows back no longer means disabling the plugin.
 *
 * Ownership: the tag carries `data-plugin` / `data-plugin-css`, so the client
 * module system removes it when this plugin is reloaded, disabled or removed,
 * and the `ctx.effect` disposer removes it on plugin disposal.
 */
window.__ModuleLoader__.load({
  id: "dsh-sidebar-trim",
  // The loader passes its module-table `require` as the first argument. Without
  // this parameter the body below throws `require is not defined`, and a throw
  // during materialization takes the whole web boot down with it.
  factory(require) {
    const React = require("react");

    const PLUGIN_ID = "dsh-sidebar-trim";
    const STYLE_KEY = PLUGIN_ID + "/sidebar-trim.css";
    const STORAGE_KEY = PLUGIN_ID + ":mode";
    const DIAG_KEY = PLUGIN_ID + ":diag";
    const DIAG_VERSION = "0.2.4";

    /** `all` = whole nav, `keep-more` = the rows only, `off` = factory sidebar. */
    const MODES = ["all", "keep-more", "off"];
    const DEFAULT_MODE = "all";

    const DICTS = {
      zh: {
        section: "侧栏",
        title: "侧栏精简",
        intro: "收起侧栏顶部的全局导航，把高度还给会话列表。选中后立刻生效。",
        methodAll: "全部隐藏",
        methodAllDetail: "插件、插件市场、自动化任务、更多一起收起，省下约 158px。",
        methodKeep: "保留「更多」",
        methodKeepDetail: "只收三行面板入口，留下「更多」按钮打开被收起的面板。",
        methodOff: "不隐藏",
        methodOffDetail: "恢复出厂侧栏，用来临时对照。",
        reset: "恢复默认",
        note: "这项设置记在本机浏览器里，换浏览器或清空站点数据后回到默认。",
        groupLabel: "显示方式",
      },
      en: {
        section: "Sidebar",
        title: "Sidebar Trim",
        intro: "Collapse the sidebar's global navigation and give the height back to the session list. Applies the moment you pick.",
        methodAll: "Hide all",
        methodAllDetail: "Plugins, Market, Schedules and More all collapse — about 158px back.",
        methodKeep: "Keep \u201cMore\u201d",
        methodKeepDetail: "Hide the three panel rows and keep the More button to reach them.",
        methodOff: "Hide nothing",
        methodOffDetail: "Restore the factory sidebar, for a side-by-side look.",
        reset: "Use default",
        note: "This choice is remembered in this browser. Another browser, or cleared site data, starts from the default.",
        groupLabel: "Display",
      },
    };

    const OPTION_KEYS = {
      all: { title: "methodAll", detail: "methodAllDetail" },
      "keep-more": { title: "methodKeep", detail: "methodKeepDetail" },
      off: { title: "methodOff", detail: "methodOffDetail" },
    };

    // The panel navigation is the only <nav> inside the sidebar subtree, and
    // every panel row is a <button>; the More menu is the only one that opens a
    // menu, so `:not([aria-haspopup])` keeps exactly that one button.
    const HIDE_ALL = '[data-slot="sidebar"] nav {\n  display: none !important;\n}\n';
    const HIDE_ROWS = [
      '[data-slot="sidebar"] nav button:not([aria-haspopup]) {',
      "  display: none !important;",
      "}",
      "",
    ].join("\n");

    const PAGE_CSS = [
      ".dst-page { display: flex; flex-direction: column; padding-bottom: 24px; }",
      ".dst-title { margin: 0; font-size: 15px; font-weight: 600; line-height: 22px; color: var(--dsw-alias-label-primary); }",
      ".dst-intro { margin: 6px 0 14px; font-size: 13px; line-height: 20px; color: var(--dsw-alias-label-secondary); }",
      ".dst-group { display: flex; flex-direction: column; gap: 2px; }",
      ".dst-option { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; border: 1px solid transparent; border-radius: var(--dsw-radius-md, 8px); cursor: pointer; }",
      ".dst-option:hover { background: var(--dsw-alias-interactive-bg-hover); }",
      '.dst-option[data-selected="true"] { background: var(--dsw-alias-interactive-bg-hover); border-color: var(--dsw-alias-border-l2); }',
      ".dst-radio { flex: none; margin: 3px 0 0; accent-color: var(--dsw-alias-brand-primary); }",
      ".dst-body { display: flex; flex-direction: column; min-width: 0; }",
      ".dst-option-title { font-size: 13px; font-weight: 600; line-height: 20px; color: var(--dsw-alias-label-primary); }",
      ".dst-option-detail { font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); }",
      ".dst-foot { display: flex; align-items: center; flex-wrap: wrap; gap: 10px 12px; margin-top: 16px; }",
      ".dst-reset { height: 28px; padding: 0 12px; font-size: 13px; color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-border-l2); border-radius: var(--dsw-radius-md, 8px); cursor: pointer; }",
      ".dst-reset:hover { background: var(--dsw-alias-interactive-bg-hover); }",
      ".dst-note { font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); }",
      "",
    ].join("\n");

    function cssFor(mode) {
      const rules = mode === "off" ? "" : mode === "keep-more" ? HIDE_ROWS : HIDE_ALL;
      return PAGE_CSS + rules;
    }

    /** Unknown or unreadable storage falls back to the default, never throws. */
    function readMode() {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (MODES.indexOf(stored) >= 0) return stored;
      } catch (error) {
        /* private mode / blocked storage: keep the default */
      }
      return DEFAULT_MODE;
    }

    function writeMode(mode) {
      try {
        window.localStorage.setItem(STORAGE_KEY, mode);
      } catch (error) {
        /* the choice still applies to this page view */
      }
    }

    function tagSelector() {
      return 'style[data-plugin-css="' + STYLE_KEY + '"]';
    }

    /** Rewrites the one stylesheet in place, so a pick lands instantly. */
    function applyMode(mode) {
      const tag = document.querySelector(tagSelector());
      if (tag !== null) tag.textContent = cssFor(mode);
    }

    /** Insert the stylesheet once; returns the disposer that takes it back out. */
    function mountStyle() {
      if (typeof document === "undefined") return function noop() {};
      if (document.querySelector(tagSelector()) !== null) return function noop() {};
      const tag = document.createElement("style");
      tag.dataset.plugin = PLUGIN_ID;
      tag.dataset.pluginCss = STYLE_KEY;
      tag.textContent = cssFor(readMode());
      document.head.appendChild(tag);
      return function unmountStyle() {
        tag.remove();
      };
    }

    /** The Settings → 侧栏 page; `t` is passed in because it binds the locale. */
    function makeSection(t) {
      return function SidebarTrimSection() {
        const h = React.createElement;
        const state = React.useState(readMode);
        const mode = state[0];
        const setMode = state[1];

        function choose(next) {
          setMode(next);
          writeMode(next);
          applyMode(next);
        }

        return h(
          "div",
          { className: "dst-page" },
          h("h2", { className: "dst-title" }, t("title")),
          h("p", { className: "dst-intro" }, t("intro")),
          h(
            "div",
            { className: "dst-group", role: "radiogroup", "aria-label": t("groupLabel") },
            MODES.map(function renderOption(value) {
              const keys = OPTION_KEYS[value];
              return h(
                "label",
                {
                  key: value,
                  className: "dst-option",
                  "data-selected": mode === value ? "true" : "false",
                },
                h("input", {
                  className: "dst-radio",
                  type: "radio",
                  name: PLUGIN_ID + "-mode",
                  value: value,
                  checked: mode === value,
                  onChange: function onPick() {
                    choose(value);
                  },
                }),
                h(
                  "span",
                  { className: "dst-body" },
                  h("span", { className: "dst-option-title" }, t(keys.title)),
                  h("span", { className: "dst-option-detail" }, t(keys.detail)),
                ),
              );
            }),
          ),
          h(
            "div",
            { className: "dst-foot" },
            h(
              "button",
              {
                type: "button",
                className: "dst-reset",
                onClick: function onReset() {
                  choose(DEFAULT_MODE);
                },
              },
              t("reset"),
            ),
            h("span", { className: "dst-note" }, t("note")),
          ),
        );
      };
    }

    /**
     * Last-resort self report. The settings page is the only way to see that the
     * section failed to register, so each mount step records what it reached;
     * a value of `failedAt` turns "nothing shows up" into a named step.
     */
    function diag(patch) {
      try {
        const previous = JSON.parse(window.localStorage.getItem(DIAG_KEY) ?? "{}");
        window.localStorage.setItem(DIAG_KEY, JSON.stringify({ ...previous, ...patch }));
      } catch (error) {
        /* diagnostics are best effort */
      }
    }

    function fault(step, error) {
      diag({
        failedAt: step,
        message: String((error && error.message) || error),
        stack: String((error && error.stack) || "").slice(0, 900),
      });
      try {
        console.error("[dsh-sidebar-trim] " + step + " failed:", error);
      } catch (ignored) {
        /* console is not guaranteed */
      }
    }

    /**
     * The harness keeps `<html lang>` pointed at the active UI locale (the
     * locale service's `syncDocumentLanguage`), so this follows the app's
     * language — including a switch — without touching the locale service.
     * `navigator.language` is only a fallback: the desktop renderer runs with
     * `--lang=en-US`, so it says "en" even when the UI is Chinese.
     */
    function pickLanguage() {
      let tag = "";
      try {
        tag = String((typeof document !== "undefined" && document.documentElement.lang) || "");
      } catch (error) {
        tag = "";
      }
      if (tag === "") {
        tag = String((typeof navigator !== "undefined" && navigator.language) || "en");
      }
      return tag.toLowerCase().startsWith("zh") ? "zh" : "en";
    }

    function translator() {
      return function translate(key) {
        const language = pickLanguage();
        return DICTS[language][key] ?? DICTS.en[key] ?? key;
      };
    }

    return {
      name: PLUGIN_ID,
      inject: ["slots"],
      apply(ctx) {
        // An entry that throws here is reported as "did not activate" and takes
        // the whole web boot down with it. A decoration may fail to appear; it
        // may never fail to boot — so every step runs inside this one guard, and
        // only declared services are touched (an undeclared service property is
        // denied on the client context).
        try {
          diag({ version: DIAG_VERSION, phase: "apply" });

          ctx.effect(mountStyle, PLUGIN_ID + ": sidebar styles");
          diag({ style: "ok" });

          const t = translator();
          const slots = ctx.slots;
          if (slots === undefined) throw new Error("slots service unavailable");
          diag({ slots: "ok" });

          slots.inject("settings.section", function registerSection() {
            diag({ injectCallback: "fired" });
            try {
              return slots.register(
                {
                  name: "settings.section",
                  id: "sidebar-trim",
                  order: 42,
                  label: function label() {
                    return t("section");
                  },
                },
                makeSection(t),
              );
            } catch (error) {
              fault("register", error);
              return function noop() {};
            }
          });
          diag({ inject: "ok" });
        } catch (error) {
          fault("apply", error);
        }
      },
    };
  },
});
