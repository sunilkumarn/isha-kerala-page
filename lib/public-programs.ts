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

function minIsoDate(a: string | null, b: string | null) {
  if (!a) return b;
  if (!b) return a;
  return a <= b ? a : b;
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
    .select("program_id, start_date")
    .eq("is_published", true)
    .or(`start_date.gte.${today},start_date.is.null`)
    .not("program_id", "is", null);

  if (sessionsError) {
    throw new Error(sessionsError.message);
  }

  // Sessions should drive ordering:
  // 1) earliest start_date ASC, 2) null start_date, 3) external programs.
  // We compute the earliest upcoming start_date per (session) program_id from the
  // ordered session rows and later roll those dates up to the display program.
  const orderedSessionRows = (sessionRows ?? []) as Array<{
    program_id: string | number | null;
    start_date: string | null;
  }>;

  orderedSessionRows.sort((a, b) => {
    const aDate = a.start_date;
    const bDate = b.start_date;
    if (aDate && bDate) return aDate.localeCompare(bDate);
    if (aDate && !bDate) return -1;
    if (!aDate && bDate) return 1;
    return 0;
  });

  const earliestSessionStartByProgramId = new Map<string, string | null>();

  for (const row of orderedSessionRows) {
    if (!row.program_id) continue;
    const key = toKey(row.program_id);
    if (earliestSessionStartByProgramId.has(key)) continue;
    earliestSessionStartByProgramId.set(key, row.start_date ?? null);
  }

  const programIds = Array.from(earliestSessionStartByProgramId.keys());

  const externalPrograms = (externalProgramRows ?? []) as Program[];

  const programsFromSessions = await (async () => {
    if (programIds.length === 0) {
      return {
        programs: [] as Program[],
        earliestStartByProgramId: new Map<string, string | null>(),
      };
    }

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
    const rolledUpEarliestStart = new Map<string, string | null>();

    for (const program of programs) {
      const parent =
        program.parent_id != null
          ? parentMap.get(toKey(program.parent_id)) ?? null
          : null;

      const displayProgram = parent ?? program;
      const displayKey = toKey(displayProgram.id);
      rolledUp.set(displayKey, displayProgram);

      const sessionKey = toKey(program.id);
      const earliestForSessionProgram =
        earliestSessionStartByProgramId.get(sessionKey) ?? null;
      const existingForDisplay = rolledUpEarliestStart.get(displayKey) ?? null;
      rolledUpEarliestStart.set(
        displayKey,
        minIsoDate(existingForDisplay, earliestForSessionProgram)
      );
    }

    return {
      programs: Array.from(rolledUp.values()),
      earliestStartByProgramId: rolledUpEarliestStart,
    };
  })();

  const sessionPrograms = programsFromSessions.programs;
  const earliestStartByProgramId = programsFromSessions.earliestStartByProgramId;

  const sessionProgramsWithDate: Program[] = [];
  const sessionProgramsWithoutDate: Program[] = [];

  for (const program of sessionPrograms) {
    const earliestStart = earliestStartByProgramId.get(toKey(program.id)) ?? null;
    if (earliestStart) {
      sessionProgramsWithDate.push(program);
    } else {
      sessionProgramsWithoutDate.push(program);
    }
  }

  sessionProgramsWithDate.sort((a, b) => {
    const aStart = earliestStartByProgramId.get(toKey(a.id)) ?? null;
    const bStart = earliestStartByProgramId.get(toKey(b.id)) ?? null;
    if (aStart && bStart) {
      const cmp = aStart.localeCompare(bStart);
      if (cmp !== 0) return cmp;
    } else if (aStart && !bStart) {
      return -1;
    } else if (!aStart && bStart) {
      return 1;
    }
    return a.name.localeCompare(b.name);
  });

  sessionProgramsWithoutDate.sort((a, b) => a.name.localeCompare(b.name));

  const externalProgramsSorted = [...externalPrograms].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const ordered: Program[] = [];
  const seen = new Set<string>();

  for (const program of [...sessionProgramsWithDate, ...sessionProgramsWithoutDate]) {
    const key = toKey(program.id);
    if (seen.has(key)) continue;
    seen.add(key);
    ordered.push(program);
  }

  for (const program of externalProgramsSorted) {
    const key = toKey(program.id);
    if (seen.has(key)) continue;
    seen.add(key);
    ordered.push(program);
  }

  const page = ordered.slice(offset, offset + limit);
  const hasMore = offset + limit < ordered.length;

  return { programs: page, hasMore };
}


