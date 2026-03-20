const seasonalLookup = {
    winter: 'D',
    spring: 'H',
    summer: 'S',
    autumn: 'C',
};

type season = keyof typeof seasonalLookup;

// for now a simple fixed-date approx is close enough
const starts = {
    spring: {month: 3, day: 20},
    summer: {month: 6, day: 21},
    autumn: {month: 9, day: 22},
    winter: {month: 12, day: 21},
}

function makeSeasonStartDate(year: number, season: season) {
    const start = starts[season];
    return new Date(year, start.month - 1, start.day);
}

function getSeason(date: Date): season {
    // this is probable good enough for us, if inelegant
    const year = date.getFullYear();
    const springStart = makeSeasonStartDate(year, 'spring');
    const summerStart = makeSeasonStartDate(year, 'summer');
    const autumnStart = makeSeasonStartDate(year, 'autumn');
    const winterStart = makeSeasonStartDate(year, 'winter');
    if (date < springStart) {
        return "winter";
    }
    if (date < summerStart) {
        return "spring";
    }
    if (date < autumnStart) {
        return "summer";
    }
    if (date < winterStart) {
        return "autumn";
    }
    return "winter";
}

export function getSeasonalSuitShort(date: Date): string {
    return seasonalLookup[getSeason(date)];
}
