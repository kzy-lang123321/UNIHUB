import { Material } from "../../types";
export function matchMaterial(material: Material, query: string, context = "") {
  const searchable =
    `${material.title} ${material.filename} ${material.creditLine} ${context}`
      .normalize("NFKC")
      .toLocaleLowerCase();
  return query
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase()
    .split(/\s+/)
    .every((word) => searchable.includes(word));
}
export function orderMaterials<T extends Material>(
  materials: T[],
  filename = false,
): T[] {
  return [...materials].sort((a, b) =>
    filename
      ? a.filename.localeCompare(b.filename, undefined, { numeric: true }) ||
        a.id.localeCompare(b.id)
      : a.sequence - b.sequence ||
        a.filename.localeCompare(b.filename, undefined, { numeric: true }),
  );
}
