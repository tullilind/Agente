(function (global) {
  "use strict";

  const tokens = Object.freeze({
    spacing: [4, 8, 12, 16, 20, 24, 32, 40],
    radius: { small: 10, medium: 14, large: 20 },
    touchTarget: { default: 44, visionOS: 60 },
    typography: {
      title: { size: 34, weight: 700, lineHeight: 1.08 },
      heading: { size: 20, weight: 650, lineHeight: 1.2 },
      body: { size: 16, weight: 400, lineHeight: 1.5 },
      caption: { size: 13, weight: 400, lineHeight: 1.4 }
    }
  });

  const rules = Object.freeze({
    maxPrimaryActions: 2,
    preferSystemFont: true,
    semanticColors: true,
    lightDarkModes: true,
    reducedMotion: true,
    colorMustNotBeOnlySignal: true,
    progressiveDisclosure: true
  });

  const platformPatterns = {
    iOS: {
      navigation: ["NavigationBar", "TabBar", "Sheet"],
      density: "comfortable",
      pointer: false
    },
    iPadOS: {
      navigation: ["Sidebar", "NavigationBar", "TabBar", "Sheet"],
      density: "comfortable",
      pointer: true
    },
    macOS: {
      navigation: ["Sidebar", "Toolbar", "Window"],
      density: "compact",
      pointer: true
    },
    visionOS: {
      navigation: ["Ornament", "Window", "Toolbar"],
      density: "spatial",
      pointer: false
    },
    web: {
      navigation: ["Sidebar", "Toolbar", "TopNavigation"],
      density: "adaptive",
      pointer: true
    }
  };

  function normalizePlatform(value) {
    const raw = String(value || "web").trim().toLowerCase();
    if (raw === "ios") return "iOS";
    if (raw === "ipados" || raw === "ipad") return "iPadOS";
    if (raw === "macos" || raw === "mac") return "macOS";
    if (raw === "visionos" || raw === "vision") return "visionOS";
    return "web";
  }

  function inferIntent(request) {
    const text = String(request || "").toLowerCase();

    if (/dashboard|painel|indicador|kpi|gráfico|grafico/.test(text)) return "dashboard";
    if (/login|entrar|acesso|senha/.test(text)) return "authentication";
    if (/configura|prefer|ajuste/.test(text)) return "settings";
    if (/lista|tabela|cadastro|produt|cliente|pedido/.test(text)) return "data-management";
    if (/chat|agente|assistente|ia/.test(text)) return "conversational";
    if (/landing|site|apresenta|vitrine/.test(text)) return "marketing";
    return "general-product";
  }

  function chooseComponents(intent, platform) {
    const nav = platformPatterns[platform].navigation;
    const base = ["PrimaryButton", "SecondaryButton"];

    const map = {
      dashboard: ["Card", "Toolbar", "Sidebar", "ListRow"],
      authentication: ["TextField", "PrimaryButton", "SecondaryButton"],
      settings: ["ListRow", "Toggle", "NavigationBar"],
      "data-management": ["SearchField", "ListRow", "Toolbar", "Sheet"],
      conversational: ["TextField", "Toolbar", "Sidebar", "EmptyState"],
      marketing: ["PrimaryButton", "Card"],
      "general-product": ["NavigationBar", "ListRow", "PrimaryButton"]
    };

    return Array.from(new Set([...nav, ...base, ...(map[intent] || map["general-product"])]));
  }

  function createDesignBrief(request, options) {
    const opts = options || {};
    const platform = normalizePlatform(opts.platform);
    const intent = inferIntent(request);
    const components = chooseComponents(intent, platform);

    return {
      engine: "ATLAS Apple Design Agent",
      version: "1.0.0",
      request: String(request || "").trim(),
      designIntent: intent,
      platform,
      density: opts.density || platformPatterns[platform].density,
      layout: {
        hierarchy: ["primary-task", "supporting-content", "secondary-actions"],
        navigation: platformPatterns[platform].navigation,
        progressiveDisclosure: true,
        responsive: true,
        contentFirst: true
      },
      components,
      tokens: {
        spacing: tokens.spacing,
        radius: tokens.radius,
        typography: tokens.typography,
        minimumInteractiveTarget: platform === "visionOS" ? 60 : 44,
        preferSemanticColors: true,
        supportLightDark: true
      },
      states: ["default", "focus", "pressed", "disabled", "loading", "error"],
      accessibility: {
        targetSizePt: platform === "visionOS" ? 60 : 44,
        smallTextContrast: "4.5:1",
        largeTextContrast: "3:1",
        doNotRelyOnColorOnly: true,
        keyboardFocusWhenApplicable: true,
        reducedMotion: true
      },
      motion: {
        principle: "feedback-and-continuity",
        decorativeMotion: "minimal",
        reducedMotionFallback: true
      },
      implementationNotes: [
        "Use fonte do sistema.",
        "Evite mais de duas ações primárias visualmente dominantes por tela.",
        "Use translucidez apenas onde separar controles do conteúdo melhorar a leitura.",
        "Crie variantes claras, escuras e de maior contraste.",
        "Mantenha foco visível para teclado e pointer quando aplicável."
      ]
    };
  }

  function buildPrompt(request, options) {
    const spec = createDesignBrief(request, options);
    return [
      "Crie uma interface original orientada pelas Human Interface Guidelines atuais da Apple.",
      "Não copie telas ou branding proprietário.",
      "Priorize clareza, hierarquia, consistência, conteúdo e acessibilidade.",
      "Use esta especificação como contrato de design:",
      JSON.stringify(spec, null, 2)
    ].join("\n\n");
  }

  function validateSpec(spec) {
    const errors = [];
    const warnings = [];

    if (!spec || typeof spec !== "object") {
      return { valid: false, errors: ["Especificação ausente ou inválida."], warnings };
    }

    const minTarget = spec.platform === "visionOS" ? 60 : 44;
    const actualTarget = spec?.accessibility?.targetSizePt;

    if (typeof actualTarget === "number" && actualTarget < minTarget) {
      errors.push(`Alvo interativo abaixo de ${minTarget}pt.`);
    }

    if (spec?.accessibility?.doNotRelyOnColorOnly === false) {
      errors.push("A especificação depende apenas de cor para comunicar informação.");
    }

    if (!spec?.accessibility?.reducedMotion) {
      warnings.push("Inclua fallback para Reduce Motion.");
    }

    if (!spec?.tokens?.supportLightDark) {
      warnings.push("Inclua comportamento para Light e Dark Mode.");
    }

    const primaryCount = Number(spec.primaryActionCount || 0);
    if (primaryCount > rules.maxPrimaryActions) {
      warnings.push("Há ações primárias demais competindo pela atenção.");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  const api = Object.freeze({
    createDesignBrief,
    buildPrompt,
    validateSpec,
    tokens,
    rules
  });

  global.AtlasAppleDesigner = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
