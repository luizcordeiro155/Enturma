import { Fragment } from "react";
import { NavigationLink } from "../navigation-link";
import { ForumLinks } from "../forum-links";

/** Keep URL fragments intact; only standalone hashtags and mentions open search. */
export function SocialText({ text }: { text: string }) {
  const matches = [
    ...text.matchAll(
      /https?:\/\/\S+|(?<![\p{L}\p{N}_])[@#][\p{L}\p{N}_]{1,40}/gu,
    ),
  ];
  let offset = 0;
  return (
    <>
      {matches.map((match) => {
        const before = text.slice(offset, match.index);
        offset = match.index! + match[0].length;
        const term = match[0];
        return (
          <Fragment key={match.index}>
            {before}
            {term.startsWith("http") ? (
              <ForumLinks text={term} />
            ) : (
              <NavigationLink
                className="social-text-link"
                href={`/social?q=${encodeURIComponent(term)}`}
              >
                {term}
              </NavigationLink>
            )}
          </Fragment>
        );
      })}
      {text.slice(offset)}
    </>
  );
}
