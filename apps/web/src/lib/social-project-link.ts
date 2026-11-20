type Linkable = {
  username: string;
  publicProfile: boolean;
  projects: { id?: string; name: string; archived?: boolean }[];
};

/** The link a post carries when it presents a portfolio project. */
export const projectLink = (username: string, projectId: string) =>
  `https://enturma-flax.vercel.app/p/${encodeURIComponent(username)}#projeto-${projectId}`;

/**
 * The project a "Publicar no Enturma Social" link asked for, when it is one the author's
 * visitors can open: the portfolio is public and the project is not archived.
 */
export function linkedProject(
  id: string | null | undefined,
  portfolio: Linkable | undefined,
) {
  if (!id || !portfolio?.publicProfile) return undefined;
  const project = portfolio.projects.find(
    (item) => item.id === id && !item.archived,
  );
  return project?.id
    ? { name: project.name, url: projectLink(portfolio.username, project.id) }
    : undefined;
}
