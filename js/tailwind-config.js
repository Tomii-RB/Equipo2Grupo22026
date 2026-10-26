// js/tailwind-config.js
tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      "colors": {
        "outline-variant": "#5e3f3a",
        "outline": "#af8781",
        "on-primary-fixed": "#410100",
        "surface-container-lowest": "#0d0d16",
        "on-secondary-container": "#b9b7c1",
        "tertiary-fixed-dim": "#c6c6c7",
        "on-error-container": "#ffdad6",
        "surface-container-high": "#292933",
        "tertiary-container": "#6f7070",
        "error-container": "#93000a",
        "on-secondary-fixed-variant": "#46464e",
        "secondary-container": "#494851",
        "inverse-primary": "#c00500",
        "surface-dim": "#13131b",
        "surface-container-highest": "#34343e",
        "on-background": "#e4e1ee",
        "secondary-fixed": "#e4e1ec",
        "on-tertiary-container": "#f5f5f5",
        "on-secondary": "#303038",
        "on-secondary-fixed": "#1b1b22",
        "on-tertiary-fixed-variant": "#454747",
        "on-primary-fixed-variant": "#930300",
        "secondary-fixed-dim": "#c7c5d0",
        "on-surface": "#e4e1ee",
        "inverse-on-surface": "#302f39",
        "on-error": "#690005",
        "inverse-surface": "#e4e1ee",
        "primary-fixed": "#ffdad4",
        "surface-bright": "#393842",
        "error": "#ffb4ab",
        "on-primary": "#680200",
        "surface-tint": "#ffb4a8",
        "on-tertiary": "#2f3131",
        "primary-container": "#e10600",
        "secondary": "#c7c5d0",
        "surface-container-low": "#1b1b24",
        "tertiary": "#c6c6c7",
        "on-tertiary-fixed": "#1a1c1c",
        "surface-container": "#1f1f28",
        "background": "#13131b",
        "surface-variant": "#34343e",
        "on-surface-variant": "#e9bcb5",
        "tertiary-fixed": "#e2e2e2",
        "primary": "#ffb4a8",
        "surface": "#13131b",
        "on-primary-container": "#fff2f0",
        "primary-fixed-dim": "#ffb4a8"
      },
      "borderRadius": { "DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px" },
      "spacing": { "margin-desktop": "48px", "max-width": "1440px", "gutter": "24px", "margin-mobile": "16px", "unit": "4px" },
      "fontFamily": {
        "body-lg": ["Hanken Grotesk"], "stat-value": ["Chivo"], "headline-xl": ["Chivo"],
        "headline-md": ["Chivo"], "label-mono": ["JetBrains Mono"], "headline-lg-mobile": ["Chivo"],
        "headline-lg": ["Chivo"], "body-md": ["Hanken Grotesk"]
      },
      "fontSize": {
        "body-lg": ["18px", {"lineHeight": "1.6", "fontWeight": "400"}],
        "stat-value": ["20px", {"lineHeight": "1.0", "fontWeight": "900"}],
        "headline-xl": ["48px", {"lineHeight": "1.1", "letterSpacing": "-0.02em", "fontWeight": "900"}],
        "headline-md": ["24px", {"lineHeight": "1.3", "fontWeight": "700"}],
        "label-mono": ["14px", {"lineHeight": "1.0", "letterSpacing": "0.05em", "fontWeight": "500"}],
        "headline-lg-mobile": ["28px", {"lineHeight": "1.2", "fontWeight": "800"}],
        "headline-lg": ["32px", {"lineHeight": "1.2", "letterSpacing": "-0.01em", "fontWeight": "800"}],
        "body-md": ["16px", {"lineHeight": "1.5", "fontWeight": "400"}]
      }
    }
  }
};