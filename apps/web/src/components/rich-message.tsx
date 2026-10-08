"use client";
import { ForumLinks } from "./forum-links";
import { EmojiText, emojiOnly } from "./emoji-picker";
// Only text nodes are rendered. HTML and executable markdown are never interpreted.
export function RichMessage({ text }: { text: string }) {
  if (emojiOnly(text))
    return (
      <div className="rich-message">
        <EmojiText text={text} />
      </div>
    );
  return (
    <div className="rich-message">
      {text.split(/(```[\s\S]*?```)/g).map((block, i) =>
        block.startsWith("```") ? (
          <pre key={i}>
            <code>{block.slice(3, -3).replace(/^\w+\n/, "")}</code>
          </pre>
        ) : (
          block.split("\n").map((line, j) =>
            line.startsWith("> ") ? (
              <blockquote key={`${i}-${j}`}>
                <ForumLinks text={line.slice(2)} />
              </blockquote>
            ) : (
              <p key={`${i}-${j}`}>
                {line
                  .split(/(`[^`]+`|@[\p{L}\p{N}_]+)/u)
                  .map((part, k) =>
                    part.startsWith("`") ? (
                      <code key={k}>{part.slice(1, -1)}</code>
                    ) : part.startsWith("@") ? (
                      <mark key={k}>{part}</mark>
                    ) : (
                      <ForumLinks key={k} text={part} />
                    ),
                  )}
              </p>
            ),
          )
        ),
      )}
    </div>
  );
}
