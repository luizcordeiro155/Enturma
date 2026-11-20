export type TeamStatus = "PENDING" | "ACCEPTED" | "DECLINED";

/** Someone the author tagged in one of their projects. */
export type TeamMember = {
  userId: string;
  name: string;
  username?: string;
  status: TeamStatus;
  /** The member's own words; empty until they accept and write them. */
  contribution: string;
};

/** A project of someone else's that tagged this student. */
export type TeamInvitation = {
  ownerId: string;
  projectId: string;
  ownerName: string;
  ownerUsername?: string;
  status: "PENDING" | "ACCEPTED";
  contribution: string;
  projectName: string;
  projectDescription: string;
  /** Already copied into this student's own portfolio. */
  included: boolean;
};

export type TeamState = {
  projects: Record<string, TeamMember[]>;
  invitations: TeamInvitation[];
};

/** A teammate as visitors see them: only people who accepted. */
export type PublicMember = {
  name: string;
  username?: string;
  contribution: string;
  /** Whether there is a public portfolio to link to. */
  portfolio: boolean;
};

export const TEAM_STATUS: Record<TeamStatus, string> = {
  PENDING: "Aguardando resposta",
  ACCEPTED: "Na equipe",
  DECLINED: "Recusou",
};
