import "server-only";

type Program = {
  id: string | number;
  name: string;
  parent_id: string | number | null;
  slug: string;
  image_url?: string | null;
  sub_text?: string | null;
  details_external?: boolean | null;
  external_link?: string | null;
};

function getTodayLocalISODate() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toKey(value: string | number) {
  return String(value);
}

export async function getPublicProgramsFromPublishedSessions(
  supabase: {
    from: (table: string) => any;
  },
  {
    offset,
    limit,
  }: {
    offset: number;
    limit: number;
  }
): Promise<{ programs: Program[]; hasMore: boolean }> {
  const today = getTodayLocalISODate();

  const { data: externalProgramRows, error: externalProgramsError } = await supabase
    .from("programs")
    .select("id, name, parent_id, slug, image_url, sub_text, details_external, external_link")
    .eq("details_external", true);

  if (externalProgramsError) {
    throw new Error(externalProgramsError.message);
  }

  const { data: sessionRows, error: sessionsError } = await supabase
    .from("sessions")
    .select("program_id")
    .eq("is_published", true)
    .gte("start_date", today)
    .not("program_id", "is", null);

  if (sessionsError) {
    throw new Error(sessionsError.message);
  }

  const programIds = Array.from(
    new Set((sessionRows ?? []).map((row: any) => row.program_id).filter(Boolean))
  ) as Array<string | number>;

  const externalPrograms = (externalProgramRows ?? []) as Program[];

  const programsFromSessions = await (async () => {
    if (programIds.length === 0) return [] as Program[];

    const { data: programRows, error: programsError } = await supabase
      .from("programs")
      .select(
        "id, name, parent_id, slug, image_url, sub_text, details_external, external_link"
      )
      .in("id", programIds);

    if (programsError) {
      throw new Error(programsError.message);
    }

    const programs = (programRows ?? []) as Program[];

    const parentIds = Array.from(
      new Set(programs.map((p) => p.parent_id).filter(Boolean))
    ) as Array<string | number>;

    const parentMap = new Map<string, Program>();

    if (parentIds.length > 0) {
      const { data: parentRows, error: parentsError } = await supabase
        .from("programs")
        .select(
          "id, name, parent_id, slug, image_url, sub_text, details_external, external_link"
        )
        .in("id", parentIds);

      if (parentsError) {
        throw new Error(parentsError.message);
      }

      for (const parent of (parentRows ?? []) as Program[]) {
        parentMap.set(toKey(parent.id), parent);
      }
    }

    // Roll up each session program to its parent program when available.
    const rolledUp = new Map<string, Program>();

    for (const program of programs) {
      const parent =
        program.parent_id != null
          ? parentMap.get(toKey(program.parent_id)) ?? null
          : null;

      const displayProgram = parent ?? program;
      rolledUp.set(toKey(displayProgram.id), displayProgram);
    }

    return Array.from(rolledUp.values());
  })();

  const combined = new Map<string, Program>();

  for (const program of programsFromSessions) {
    combined.set(toKey(program.id), program);
  }

  for (const program of externalPrograms) {
    combined.set(toKey(program.id), program);
  }

  const sorted = Array.from(combined.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const page = sorted.slice(offset, offset + limit);
  const hasMore = offset + limit < sorted.length;

  return { programs: page, hasMore };
}


