export const ML_VEHICLES_BY_PAGE = 48;

export function getMultiplesOfFortyEight(totalPages: number): number[] {
  const multiples = [1];
  let totalVehicles = 1;
  for (let currentPage = 1; currentPage < totalPages; currentPage++) {
    totalVehicles += ML_VEHICLES_BY_PAGE;
    multiples.push(totalVehicles);
  }

  return multiples;
}
