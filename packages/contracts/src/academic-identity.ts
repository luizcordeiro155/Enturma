import type { AcademicEntry } from "./index";

export type AcademicContext = {
  accessAllowed: boolean;
  institutionId?: string | null;
  institutionName?: string | null;
  campusId?: string | null;
  campusName?: string | null;
};

/** Only carries the context proved/selected by the account; never infers a course. */
export function academicOnboardingContext(
  identity: AcademicContext,
): AcademicEntry[] {
  if (
    !identity.accessAllowed ||
    !identity.institutionId ||
    !identity.institutionName
  )
    return [];
  const institution: AcademicEntry = {
    id: identity.institutionId,
    name: identity.institutionName,
    kind: "INSTITUTION",
    parentId: null,
    sourceUrl: "",
    sourceName: "Seleção da verificação acadêmica",
    status: "VERIFIED",
  };
  if (!identity.campusId || !identity.campusName) return [institution];
  return [
    institution,
    {
      id: identity.campusId,
      name: identity.campusName,
      kind: "CAMPUS",
      parentId: identity.institutionId,
      sourceUrl: "",
      sourceName: "Seleção da verificação acadêmica",
      status: "VERIFIED",
    },
  ];
}
