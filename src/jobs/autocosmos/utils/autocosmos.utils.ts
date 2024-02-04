export function getExternalId(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1];
}

export function getPages(vehicles: number, elementsPerPage = 48) {
  const pages = Math.ceil(vehicles / elementsPerPage);

  return pages;
}
