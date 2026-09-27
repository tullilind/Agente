(function (global) {
  "use strict";

  const loaders = new Map();

  function loadScript(src, globalName) {
    if (global[globalName]) return Promise.resolve(global[globalName]);
    if (loaders.has(src)) return loaders.get(src);

    const promise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-atlas-module="${src}"]`);

      const resolveModule = () => {
        const module = global[globalName];
        if (!module) {
          reject(new Error("Módulo carregado, mas global ausente: " + globalName));
          return;
        }
        resolve(module);
      };

      if (existing) {
        if (global[globalName]) return resolve(global[globalName]);
        existing.addEventListener("load", resolveModule, { once: true });
        existing.addEventListener("error", () => reject(new Error("Falha ao carregar " + src)), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.dataset.atlasModule = src;
      script.onload = resolveModule;
      script.onerror = () => reject(new Error("Falha ao carregar " + src));
      document.head.appendChild(script);
    });

    loaders.set(src, promise);
    return promise;
  }

  function carregarBibliotecaApple() {
    return loadScript(
      "apple-design-agent/reference-library/library.js",
      "AtlasAppleReferenceLibrary"
    );
  }

  function carregarDesignerApple() {
    return loadScript(
      "apple-design-agent/apple-designer.js",
      "AtlasAppleDesigner"
    );
  }

  async function consultarBibliotecaApple(consulta, opcoes) {
    const library = await carregarBibliotecaApple();
    if (!library) throw new Error("Biblioteca Apple não ficou disponível.");

    const opts = opcoes || {};
    return library.search(consulta, {
      platform: opts.platform || "",
      limit: opts.limit || 15
    });
  }

  async function criarDesignApple(descricao, opcoes) {
    const opts = opcoes || {};
    const [engine, library] = await Promise.all([
      carregarDesignerApple(),
      carregarBibliotecaApple()
    ]);

    if (!engine) throw new Error("Designer Apple não ficou disponível.");

    const spec = engine.createDesignBrief(descricao, opts);
    const validation = engine.validateSpec(spec);

    let referenceContext = null;
    if (library) {
      const intent = spec.designIntent || "general-product";
      const topics = intent === "dashboard"
        ? ["dashboard", "navigation", "accessibility", "principles", "examples"]
        : intent === "authentication"
          ? ["forms", "accessibility", "writing", "principles", "examples"]
          : ["navigation", "accessibility", "principles", "examples"];

      referenceContext = await library.buildContext(topics, {
        query: descricao,
        platform: spec.platform,
        limit: 15
      });
    }

    const referencesUsed = [];
    const matches = referenceContext?.searchResults?.results || [];

    matches.forEach(item => {
      const data = item.data || {};
      const url = data.sourceUrl || data.url || null;
      if (url && !referencesUsed.includes(url)) referencesUsed.push(url);
    });

    return {
      spec,
      validation,
      referencesUsed: referencesUsed.slice(0, 8),
      referenceContext
    };
  }

  global.MotorAgente = Object.freeze({
    carregarDesignerApple,
    carregarBibliotecaApple,
    consultarBibliotecaApple,
    criarDesignApple,
    get ready() {
      return Promise.all([
        carregarDesignerApple(),
        carregarBibliotecaApple()
      ]);
    }
  });

  global.MotorAgente.ready.catch((err) => {
    console.error("[ATLAS Apple Design Agent]", err);
  });
})(window);
