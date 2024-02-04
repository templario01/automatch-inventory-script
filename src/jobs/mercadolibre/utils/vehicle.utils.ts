export function parsePrice(strPrice: string): number {
  try {
    const price = strPrice.replace('.', '').trim();

    return parseFloat(price);
  } catch (error) {
    return undefined;
  }
}

export function convertToNumber(textNumber: string) {
  try {
    const numberString = textNumber.replace(/[^0-9]/g, '');

    return +numberString;
  } catch (error) {
    return undefined;
  }
}

export function getVehicleName(text: string) {
  const words = text.split(' ');
  if (words.length <= 5) {
    return text;
  } else {
    return words.slice(0, 5).join(' ');
  }
}
