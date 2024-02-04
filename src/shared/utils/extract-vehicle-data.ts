// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getEnumKeyByValue(object: any, value: any): string {
  return Object.keys(object).find((key) => object[key] === value);
}

export function getMileage(mileage: string): number {
  const match = RegExp(/(\d{1,3}(?:,\d{3})*|\d+)/).exec(mileage);
  if (match) {
    const numberString = match[1].replace(/,/g, '');
    return parseInt(numberString, 10);
  } else {
    return undefined;
  }
}

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
