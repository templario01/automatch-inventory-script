export function getDurationTime(startTime: Date, endTime: Date): string {
  const timeDiffInMs = endTime.getTime() - startTime.getTime();
  const timeDiffInSec = Math.round(timeDiffInMs / 1000);
  const hours = Math.floor(timeDiffInSec / 3600);
  const minutes = Math.floor((timeDiffInSec % 3600) / 60);
  const seconds = timeDiffInSec % 60;

  const durationString = `${hours}h ${minutes}m ${seconds}s`;

  return durationString;
}
