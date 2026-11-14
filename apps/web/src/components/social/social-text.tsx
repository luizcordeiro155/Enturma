import { Fragment } from "react";
import { NavigationLink } from "../navigation-link";
import { ForumLinks } from "../forum-links";
import { announceHashtag, hashtagHref } from "./social-hashtag";

/** Keep URL fragments intact; standalone hashtags open their page and mentions open search. */
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
            ) : term.startsWith("#") ? (
              <NavigationLink
                className="social-text-link social-text-hashtag"
                href={hashtagHref(term.slice(1).toLowerCase())}
                onClick={(event) => {
                  // Inside the Social the tag page opens in place, without leaving the post.
                  if (announceHashtag(term.slice(1).toLowerCase())) {
                    event.preventDefault();
                    event.stopPropagation();
                  }
                }}
              >
                {term}
              </NavigationLink>
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
