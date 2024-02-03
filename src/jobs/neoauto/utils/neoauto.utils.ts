import { VehicleBrandAndModel } from '../types/neoauto.types';

export function includesAll(text: string, words: string[]): boolean {
  return words.every((word) => text.includes(word));
}

export function cleanSearchName(word: string): string {
  try {
    const caracteresValidos = /[^a-zA-Z0-9]+/g;
    word = word.replace(caracteresValidos, ' ');
    word = word.trim().toLowerCase();

    return word;
  } catch (error) {
    return undefined;
  }
}

export function getWordsAndYear(searchName: string) {
  const search = cleanSearchName(searchName);

  if (search) {
    const yearPattern = new RegExp(/\b\d{4}\b/g);
    const cleanSearch = search.replace(yearPattern, '');
    const year = +RegExp(yearPattern).exec(search)?.[0];
    const keywords = cleanSearch?.split(' ').filter((word) => word !== '');

    return {
      year,
      keywords,
    };
  }

  return { keywords: [], year: undefined };
}

export function parsePrice(price: string): number {
  try {
    const usdPrice = price.split('$')[1].trim().replace(',', '');

    return +usdPrice;
  } catch (error) {
    return undefined;
  }
}

export function getVehicleInfoByNeoauto(
  vehicleURL: string,
): VehicleBrandAndModel {
  const parts = vehicleURL.split('/');
  const lastPart = parts[parts.length - 1];
  const regex = /^([a-z]+)-(.+)-(\d+)$/i;
  const [, brand, modelWithYear, id] = RegExp(regex).exec(lastPart) || [];

  return {
    brand,
    modelWithYear,
    id,
  };
}

export function getModelAndYearFromUrl(vehicleURL: string): {
  model: string;
  year: string;
} {
  const regex = /^([\w-]+)-(\d{4})$/i;
  const match = RegExp(regex).exec(vehicleURL);

  if (match) {
    return { model: match[1], year: match[2] };
  } else {
    return {
      model: vehicleURL,
      year: new Date().getFullYear().toString(),
    };
  }
}
