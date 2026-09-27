# ATLAS Apple Design Agent

Módulo de conhecimento e execução para gerar especificações de interface inspiradas no padrão atual das plataformas Apple, com foco em clareza, hierarquia, consistência, acessibilidade, adaptação por plataforma e uso criterioso de materiais translúcidos.

## Estrutura

- `agent-config.json`: configuração e capacidades do agente.
- `SYSTEM_PROMPT.md`: instrução-base para o modelo de IA.
- `knowledge/apple-hig-rules.json`: regras estruturadas de design.
- `knowledge/components.json`: catálogo semântico de componentes.
- `apple-designer.js`: motor JavaScript que transforma pedidos em briefs de UI.
- `apple-design.css`: tokens e classes-base para protótipos web.

## Objetivo

O agente não tenta clonar aplicativos Apple nem usar marcas da Apple. Ele aplica princípios de interface compatíveis com HIG: conteúdo em primeiro lugar, controles claros, hierarquia visual, adaptação a light/dark mode, acessibilidade, áreas de toque adequadas e movimento com propósito.

## Uso no navegador

```html
<link rel="stylesheet" href="apple-design-agent/apple-design.css">
<script src="apple-design-agent/apple-designer.js"></script>
<script>
  const spec = AtlasAppleDesigner.createDesignBrief(
    "Crie um painel financeiro com sidebar, cartões e gráfico",
    { platform: "macOS", density: "comfortable" }
  );

  console.log(spec);
</script>
```

## Uso via agente

O motor expõe `window.AtlasAppleDesigner` com:

- `createDesignBrief(request, options)`
- `buildPrompt(request, options)`
- `validateSpec(spec)`
- `tokens`
- `rules`

## Fontes de referência

Este módulo foi escrito de forma original, usando como referência:
- Apple Human Interface Guidelines atuais.
- Apple Design Resources.
- Estruturas públicas de skills HIG e design systems iOS disponíveis no GitHub.

Não copie conteúdo visual, ícones proprietários ou ativos protegidos. Use SF Symbols somente quando o ambiente e a licença aplicável permitirem.
