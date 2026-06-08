/**
 * SIVU IA Sidecar
 * ----------------
 * Servicio HTTP mínimo que usa el plan de Claude Code (vía claude-agent-sdk +
 * CLAUDE_CODE_OAUTH_TOKEN) para dar feedback cualitativo sobre el Informe
 * Final del PM — SIN consumir API key de Anthropic.
 *
 * El backend Java (InformeIAService) llama POST /review cuando la variable
 * app.ia.sidecar-url está configurada; si el sidecar no responde, el backend
 * cae a su revisor heurístico local. Así el sistema funciona con o sin IA.
 *
 * Requiere en el entorno:
 *   CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-...   (de `claude setup-token`)
 *   PORT=8090 (opcional)
 */
import express from "express";
import { query } from "@anthropic-ai/claude-agent-sdk";

const app = express();
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 8090;
const HAS_TOKEN = !!process.env.CLAUDE_CODE_OAUTH_TOKEN;

const SYSTEM = `Eres un asesor académico de la Fundación Universitaria Empresarial (Uniempresarial)
que revisa Informes Finales de Plan Especial de Mejora (formato GTC-FM-16).
Das feedback formativo, claro y específico al estudiante ANTES de la entrega formal.
Sé honesto: si una sección está pobre, dilo. Sé constructivo: siempre indica cómo mejorar.

Responde SIEMPRE en este formato Markdown exacto:

## Resumen ejecutivo
<2-3 frases sobre la calidad global>

## Hallazgos
- **[sección]**: <crítica concreta>

## Recomendaciones
- <acción concreta>

## ¿Listo para entregar?
<SI / NO / CASI> — <una frase>`;

function construirPrompt(informe) {
  const s = (t, c) => `### ${t}\n${(c && c.trim()) ? c : "(VACÍA)"}\n`;
  return [
    SYSTEM,
    "\n\n---\nRevisa este borrador de Informe Final:\n",
    `Título: ${informe.tituloInforme || "(sin título)"}`,
    `Nivel: ${informe.nivel ?? "no indicado"}`,
    `Páginas declaradas: ${informe.numeroPaginas ?? "n/a"} (máx 15)\n`,
    s("Resumen Ejecutivo", informe.resumenEjecutivo),
    s("Contextualización", informe.contextualizacion),
    s("Planteamiento del Problema", informe.planteamientoProblema),
    s("Marco Teórico", informe.marcoTeorico),
    s("Objetivo General", informe.objetivoGeneral),
    s("Objetivos Específicos", informe.objetivosEspecificos),
    s("Diagnóstico", informe.diagnostico),
    s("Metodología", informe.metodologia),
    s("Propuesta de Solución", informe.propuestaSolucion),
    s("Factibilidad", informe.factibilidad),
    s("Conclusiones", informe.conclusiones),
  ].join("\n");
}

async function reviewWithClaude(informe) {
  let textoFinal = "";
  const assistantChunks = [];
  // maxTurns 1 + sin herramientas: queremos una respuesta de texto, no un agente.
  const it = query({
    prompt: construirPrompt(informe),
    options: { maxTurns: 1, allowedTools: [] },
  });
  for await (const msg of it) {
    if (msg.type === "assistant" && msg.message?.content) {
      for (const block of msg.message.content) {
        if (block.type === "text") assistantChunks.push(block.text);
      }
    } else if (msg.type === "result") {
      if (typeof msg.result === "string" && msg.result.trim()) textoFinal = msg.result;
    }
  }
  return (textoFinal || assistantChunks.join("\n")).trim();
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, hasToken: HAS_TOKEN, model: "claude-code-plan" });
});

app.post("/review", async (req, res) => {
  // No exigimos el token explícito: el SDK también usa la sesión de Claude
  // Code ya logueada en la máquina. En deploy headless se provee el token.
  try {
    const informe = req.body || {};
    const reporteMarkdown = await reviewWithClaude(informe);
    if (!reporteMarkdown) {
      return res.status(502).json({ error: "Claude no devolvió contenido" });
    }
    res.json({ fuente: "claude-code", reporteMarkdown });
  } catch (e) {
    console.error("[ia-sidecar] error:", e?.message);
    res.status(500).json({ error: e?.message || "fallo interno" });
  }
});

app.listen(PORT, () => {
  console.log(`[ia-sidecar] escuchando en :${PORT} · token=${HAS_TOKEN ? "presente" : "AUSENTE"}`);
});
