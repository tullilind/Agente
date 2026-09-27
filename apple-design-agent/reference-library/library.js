(function (global) {
  "use strict";

  const INDEX = {
    "navegacao": "patterns/navigation.json",
    "navigation": "patterns/navigation.json",
    "formulario": "patterns/forms.json",
    "forms": "patterns/forms.json",
    "dashboard": "patterns/dashboards.json",
    "painel": "patterns/dashboards.json",
    "glass": "patterns/liquid-glass.json",
    "liquid glass": "patterns/liquid-glass.json",
    "acessibilidade": "patterns/states-accessibility.json",
    "accessibility": "patterns/states-accessibility.json",
    "estados": "patterns/states-accessibility.json",
    "tokens": "tokens/semantic-tokens.json"
  };

  const cache = new Map();

  async function loadJSON(path) {
    if (cache.has(path)) return cache.get(path);

    const response = await fetch("apple-design-agent/reference-library/" + path, {
      cache: "no-cache"
    });

    if (!response.ok) {
      throw new Error("Falha ao carregar referência Apple: " + path);
    }

    const data = await response.json();
    cache.set(path, data);
    return data;
  }

  async function getManifest() {
    return loadJSON("manifest.json");
  }

  async function getTokens() {
    return loadJSON("tokens/semantic-tokens.json");
  }

  function normalizeTopic(topic) {
    return String(topic || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  async function getTopic(topic) {
    const normalized = normalizeTopic(topic);
    let path = INDEX[normalized];

    if (!path) {
      const key = Object.keys(INDEX).find(item =>
        normalized.includes(item) || item.includes(normalized)
      );
      path = key ? INDEX[key] : null;
    }

    if (!path) {
      return {
        found: false,
        topic,
        availableTopics: Array.from(new Set(Object.keys(INDEX))).sort()
      };
    }

    return {
      found: true,
      topic,
      path,
      data: await loadJSON(path)
    };
  }

  async function buildContext(topics) {
    const list = Array.isArray(topics) ? topics : [topics];
    const results = [];

    for (const topic of list) {
      results.push(await getTopic(topic));
    }

    return {
      library: "ATLAS Apple Reference Library",
      version: "2.0.0",
      manifest: await getManifest(),
      references: results
    };
  }

  global.AtlasAppleReferenceLibrary = Object.freeze({
    getManifest,
    getTokens,
    getTopic,
    buildContext
  });
})(window);
