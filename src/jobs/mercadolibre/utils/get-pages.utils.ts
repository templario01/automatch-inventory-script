export function getMultiplesOfFortyEight(totalPages: number): number[] {
  const vehiclesByPage = 48;
  const multiples = [1];
  let totalVehicles = 1;
  for (let currentPage = 1; currentPage < totalPages; currentPage++) {
    totalVehicles += vehiclesByPage;
    multiples.push(totalVehicles);
  }

  return multiples;
}
