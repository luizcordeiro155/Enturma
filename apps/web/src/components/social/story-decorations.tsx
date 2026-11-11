import type { StoryOverlay } from "@/lib/social";

export function StoryDecorations({ items }: { items: StoryOverlay[] }) {
  return (
    <div className="social-story-decorations">
      {items.map((item, i) => (
        <span
          key={i}
          style={{ left: `${item.x * 100}%`, top: `${item.y * 100}%` }}
        >
          {item.text}
        </span>
      ))}
    </div>
  );
}

export function StoryDecorationEditor({
  items,
  change,
}: {
  items: StoryOverlay[];
  change: (items: StoryOverlay[]) => void;
}) {
  function update(index: number, patch: Partial<StoryOverlay>) {
    change(
      items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }
  return (
    <details className="social-story-decoration-editor">
      <summary>Textos e adesivos do Story</summary>
      <p>Adicione uma ideia ou um adesivo e ajuste sua posição na prévia.</p>
      <div className="social-row">
        {["Sua ideia", "📚", "🎓", "✨", "💡", "💚"].map((text) => (
          <button
            key={text}
            className="secondary"
            disabled={items.length >= 8}
            onClick={() => change([...items, { text, x: 0.5, y: 0.3 }])}
          >
            Adicionar {text}
          </button>
        ))}
      </div>
      {items.map((item, i) => (
        <fieldset key={i}>
          <legend>Elemento {i + 1}</legend>
          <label>
            Texto ou adesivo
            <input
              maxLength={120}
              value={item.text}
              onChange={(e) => update(i, { text: e.target.value })}
            />
          </label>
          <div className="social-edit-controls">
            <label>
              Horizontal
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.01"
                value={item.x}
                onChange={(e) => update(i, { x: Number(e.target.value) })}
              />
            </label>
            <label>
              Vertical
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.01"
                value={item.y}
                onChange={(e) => update(i, { y: Number(e.target.value) })}
              />
            </label>
          </div>
          <button
            className="text-button"
            onClick={() => change(items.filter((_, at) => at !== i))}
          >
            Remover elemento {i + 1}
          </button>
        </fieldset>
      ))}
    </details>
  );
}
