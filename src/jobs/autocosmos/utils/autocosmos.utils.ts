export function formatLocation(texto: string): string {
  try {
    const regex = new RegExp(/^\s+|\s+$|[^a-zA-Z\s]/g);
    const indexComma = texto.indexOf(',');
    const formatedLocation =
      texto.slice(0, indexComma).replace(regex, '').trim() +
      ', ' +
      texto
        .slice(indexComma + 1)
        .replace(regex, '')
        .trim();

    return formatedLocation;
  } catch (error) {
    return null;
  }
}

export function getExternalId(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1];
}

export function getPages(vehicles: number, elementsPerPage = 48) {
  const pages = Math.ceil(vehicles / elementsPerPage);

  return pages;
}
