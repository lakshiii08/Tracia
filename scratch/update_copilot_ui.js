const fs = require('fs');
const path = require('path');

// 1. Update app/copilot/page.tsx
{
  const p = path.join(process.cwd(), 'app/copilot/page.tsx');
  let c = fs.readFileSync(p, 'utf8');

  // Replace assistantMsg assignment
  c = c.replace(
    /const assistantMsg:\s*CopilotMessage\s*=\s*\{\s*role:\s*"assistant",\s*text:\s*res\.text,\s*\};/,
    `const assistantMsg: CopilotMessage = {
        role: "assistant",
        text: res.text,
        intent: res.intent,
        supportingPaths: res.supportingPaths,
        sources: res.sources,
      };`
  );

  // Replace message rendering
  const oldRender = `<div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>`;
  const newRender = `{m.intent && (
                      <div className="flex items-center gap-1.5 pb-1 border-b border-outline-variant/40">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span className="text-[10px] font-mono text-primary uppercase tracking-wide">
                          {m.intent}
                        </span>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
                    {m.supportingPaths && m.supportingPaths.length > 0 && (
                      <div className="pt-2 border-t border-outline-variant/40 space-y-1">
                        <div className="text-[10px] font-mono text-outline uppercase tracking-wider">
                          Neo4j Graph Traversal Paths:
                        </div>
                        <div className="space-y-0.5 font-mono text-[11px] text-on-surface-variant bg-surface-container/60 p-2 rounded border border-outline-variant/40">
                          {m.supportingPaths.map((pStr, pIdx) => (
                            <div key={pIdx} className="truncate">↳ {pStr}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    {m.sources && m.sources.length > 0 && (
                      <div className="text-[10px] font-mono text-outline/80 pt-1">
                        Sources: {m.sources.join(" · ")}
                      </div>
                    )}`;

  if (c.includes(oldRender)) {
    c = c.replace(oldRender, newRender);
    fs.writeFileSync(p, c, 'utf8');
    console.log('Updated app/copilot/page.tsx');
  } else {
    console.warn('oldRender not found in app/copilot/page.tsx');
  }
}

// 2. Update components/copilot/CaseCopilotWidget.tsx
{
  const p = path.join(process.cwd(), 'components/copilot/CaseCopilotWidget.tsx');
  let c = fs.readFileSync(p, 'utf8');

  // Replace message update
  c = c.replace(
    /role:\s*"assistant",\s*text:\s*res\.text,/,
    `role: "assistant",
          text: res.text,
          intent: res.intent,
          supportingPaths: res.supportingPaths,
          sources: res.sources,`
  );

  // Replace message rendering
  const oldWidgetRender = `<div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>`;
  const newWidgetRender = `{m.intent && (
                <div className="flex items-center gap-1.5 pb-1 border-b border-outline-variant/40">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] font-mono text-primary uppercase tracking-wide">
                    {m.intent}
                  </span>
                </div>
              )}
              <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
              {m.supportingPaths && m.supportingPaths.length > 0 && (
                <div className="pt-2 border-t border-outline-variant/40 space-y-1">
                  <div className="text-[10px] font-mono text-outline uppercase tracking-wider">
                    Neo4j Traversal Paths:
                  </div>
                  <div className="space-y-0.5 font-mono text-[11px] text-on-surface-variant bg-surface-container/60 p-2 rounded border border-outline-variant/40">
                    {m.supportingPaths.map((pStr, pIdx) => (
                      <div key={pIdx} className="truncate">↳ {pStr}</div>
                    ))}
                  </div>
                </div>
              )}
              {m.sources && m.sources.length > 0 && (
                <div className="text-[10px] font-mono text-outline/80 pt-1">
                  Sources: {m.sources.join(" · ")}
                </div>
              )}`;

  if (c.includes(oldWidgetRender)) {
    c = c.replace(oldWidgetRender, newWidgetRender);
    fs.writeFileSync(p, c, 'utf8');
    console.log('Updated components/copilot/CaseCopilotWidget.tsx');
  } else {
    console.warn('oldWidgetRender not found in CaseCopilotWidget.tsx');
  }
}
