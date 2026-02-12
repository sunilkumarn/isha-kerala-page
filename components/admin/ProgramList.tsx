type Program = {
  id: string | number;
  name: string;
  parent_id: string | number | null;
  image_url?: string | null;
  colour?: string | null;
};

export type ProgramRowItem = {
  program: Program;
  indent: boolean;
};

type ProgramListProps = {
  programs: Program[];
  onEdit: (program: Program) => void;
  onDelete: (program: Program) => void;
  page?: number;
  pageSize?: number;
};

const sortByName = (items: Program[]) =>
  [...items].sort((a, b) => a.name.localeCompare(b.name));

export function buildProgramRows(programs: Program[]): ProgramRowItem[] {
  const programMap = new Map(programs.map((program) => [program.id, program]));
  const roots: Program[] = [];
  const childrenMap = new Map<Program["id"], Program[]>();

  programs.forEach((program) => {
    if (program.parent_id && programMap.has(program.parent_id)) {
      const existing = childrenMap.get(program.parent_id) ?? [];
      childrenMap.set(program.parent_id, [...existing, program]);
    } else {
      roots.push(program);
    }
  });

  const rows: ProgramRowItem[] = [];
  sortByName(roots).forEach((root) => {
    rows.push({ program: root, indent: false });
    sortByName(childrenMap.get(root.id) ?? []).forEach((child) => {
      rows.push({ program: child, indent: true });
    });
  });

  return rows;
}

export default function ProgramList({
  programs,
  onEdit,
  onDelete,
  page = 1,
  pageSize,
}: ProgramListProps) {
  const rows = buildProgramRows(programs);
  const safePage = Math.max(1, Math.floor(page));
  const start = pageSize ? (safePage - 1) * pageSize : 0;
  const end = pageSize ? start + pageSize : rows.length;
  const visibleRows = rows.slice(start, end);

  return (
    <ul className="space-y-3">
      {visibleRows.map(({ program, indent }) => (
        <li key={program.id}>
          <ProgramRow
            program={program}
            indent={indent}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </li>
      ))}
    </ul>
  );
}

function ProgramRow({
  program,
  indent = false,
  onEdit,
  onDelete,
}: {
  program: Program;
  indent?: boolean;
  onEdit: (program: Program) => void;
  onDelete: (program: Program) => void;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-md border border-[#E2DED3] bg-[#F6F4EF] px-4 py-3 ${
        indent ? "ml-8" : ""
      }`}
    >
      <div className="flex items-center gap-4">
        {program.image_url ? (
          <img
            src={program.image_url}
            alt={program.name}
            className="h-10 w-10 rounded-md border border-[#E2DED3] object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[#E2DED3] bg-white text-xs font-medium text-[#8C7A5B]">
            {program.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full border border-[#E2DED3]"
              style={{ backgroundColor: program.colour ?? "#EAE6DC" }}
            />
            <p className="text-sm font-medium text-[#2B2B2B]">
              {program.name}
            </p>
          </div>
          {indent ? (
            <p className="text-xs text-[#8C7A5B]">Child Program</p>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <button
          type="button"
          onClick={() => onEdit(program)}
          className="text-[#6B5E4A] hover:text-[#2B2B2B]"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(program)}
          className="text-[#8C7A5B] hover:text-[#2B2B2B]"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

