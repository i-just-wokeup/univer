const { withAndroidStyles } = require("@expo/config-plugins");

const OPT_OUT_ITEM_NAME = "android:windowOptOutEdgeToEdgeEnforcement";
const APP_THEME_PATTERN = /^(Theme\.App|AppTheme|MainActivityTheme)/;

function toArray(value) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function upsertStyleItem(style, name, value) {
  style.item = toArray(style.item);

  const existingItem = style.item.find((item) => item?.$?.name === name);

  if (existingItem) {
    existingItem._ = value;
    return;
  }

  style.item.push({
    $: { name },
    _: value,
  });
}

module.exports = function withAndroidEdgeToEdgeOptOut(config) {
  return withAndroidStyles(config, (config) => {
    const resources = config.modResults.resources;
    const styles = toArray(resources.style);

    resources.style = styles;

    styles
      .filter((style) => {
        const styleName = style?.$?.name;
        return typeof styleName === "string" && APP_THEME_PATTERN.test(styleName);
      })
      .forEach((style) => {
        upsertStyleItem(style, OPT_OUT_ITEM_NAME, "true");
      });

    return config;
  });
};
