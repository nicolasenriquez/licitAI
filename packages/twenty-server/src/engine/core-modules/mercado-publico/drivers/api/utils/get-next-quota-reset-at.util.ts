type ZonedWallTime = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const getZonedWallTime = (instant: Date, timeZone: string): ZonedWallTime => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const parts = formatter.formatToParts(instant);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second,
  };
};

const getTimezoneOffsetMs = (instant: Date, timeZone: string): number => {
  const wall = getZonedWallTime(instant, timeZone);
  const wallAsUtc = Date.UTC(
    wall.year,
    wall.month - 1,
    wall.day,
    wall.hour,
    wall.minute,
    wall.second,
  );

  return wallAsUtc - instant.getTime();
};

export const getNextQuotaResetAt = (
  timeZone: string,
  now: Date = new Date(),
): Date => {
  const wall = getZonedWallTime(now, timeZone);
  const nextMidnightZoned = Date.UTC(
    wall.year,
    wall.month - 1,
    wall.day + 1,
    0,
    0,
    0,
  );
  let candidate = new Date(nextMidnightZoned);

  for (let iteration = 0; iteration < 3; iteration += 1) {
    candidate = new Date(
      nextMidnightZoned - getTimezoneOffsetMs(candidate, timeZone),
    );
  }

  return candidate;
};
