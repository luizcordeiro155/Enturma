"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { FolderGit2, Share2 } from "lucide-react";
import { ShareDialog } from "./profile-share";
import "./portfolio-share.css";

const SITE = "https://enturma-flax.vercel.app";

/** The public address of a portfolio, or of one project inside it. */
export const portfolioLink = (username: string, projectId?: string) =>
  `${SITE}/p/${encodeURIComponent(username)}${projectId ? `#projeto-${projectId}` : ""}`;

/** LinkedIn's own share page: it only receives the address. */
export const linkedInShare = (url: string) =>
  `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

/**
 * Shares a public portfolio or one of its projects: to friends in the conversation, by link,
 * on LinkedIn, and for the owner as a post in the Enturma Social.
 */
export function PortfolioShareButton({
  owner,
  project,
  mine,
  className = "secondary",
}: {
  owner: { name: string; username: string };
  project?: { id: string; name: string };
  /** The viewer owns this portfolio. */
  mine?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const link = portfolioLink(owner.username, project?.id);
  const what = project ? "projeto" : "portfólio";
  return (
    <>
      <button
        type="button"
        className={`portfolio-share-button ${className}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={
          project ? `Compartilhar ${project.name}` : "Compartilhar portfólio"
        }
        onClick={() => setOpen(true)}
      >
        <Share2 size={16} aria-hidden="true" /> Compartilhar
      </button>
      {open &&
        createPortal(
          <ShareDialog
            onClose={() => setOpen(false)}
            subject={{
              eyebrow: "PORTFÓLIO NO ENTURMA",
              title: `Compartilhar ${what}`,
              description: project
                ? "Envie este projeto a um amigo ou leve o link para onde quiser."
                : "Envie este portfólio a um amigo ou leve o link para onde quiser.",
              link,
              linkLabel: `Link do ${what}`,
              sentLabel: `${project ? "Projeto" : "Portfólio"} enviado para`,
              outside: {
                title: project
                  ? `${project.name}, projeto de ${owner.name}`
                  : `Portfólio de ${owner.name}`,
                text: project
                  ? `Veja o projeto ${project.name} no portfólio de ${owner.name}`
                  : `Veja o portfólio de ${owner.name} no Enturma`,
              },
              open: true,
              preview: (
                <div className="profile-share-person portfolio-share-preview">
                  <span aria-hidden="true">
                    <FolderGit2 size={20} />
                  </span>
                  <div>
                    <strong>
                      {project?.name ?? `Portfólio de ${owner.name}`}
                    </strong>
                    <span>
                      {project
                        ? `Projeto de ${owner.name}`
                        : `@${owner.username}`}
                    </span>
                  </div>
                </div>
              ),
              actions: (
                <>
                  <a
                    className="button secondary"
                    href={linkedInShare(link)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Compartilhar no LinkedIn
                  </a>
                  {mine && project ? (
                    <a
                      className="button secondary"
                      href={`/social?projeto=${encodeURIComponent(project.id)}`}
                    >
                      Publicar no Enturma Social
                    </a>
                  ) : null}
                </>
              ),
            }}
          />,
          document.body,
        )}
    </>
  );
}
