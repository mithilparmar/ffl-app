export interface PlayerStats {
  // Passing
  pass_yd?: number; // Passing yards
  pass_td?: number; // Passing touchdowns
  pass_int?: number; // Interceptions thrown
  pass_sack?: number; // Times sacked
  pass_td_40p?: number; // 40+ yard passing TDs
  pass_td_50p?: number; // 50+ yard passing TDs

  // Rushing
  rush_yd?: number; // Rushing yards
  rush_td?: number; // Rushing touchdowns
  rush_td_40p?: number; // 40+ yard rushing TDs
  rush_td_50p?: number; // 50+ yard rushing TDs

  // Receiving
  rec_yd?: number; // Receiving yards
  rec_td?: number; // Receiving touchdowns
  rec?: number; // Receptions
  rec_td_40p?: number; // 40+ yard receiving TDs
  rec_td_50p?: number; // 50+ yard receiving TDs

  // Misc
  fum?: number; // Fumbles
  fum_lost?: number; // Fumbles lost
  fum_rec_td?: number; // Fumble recovered for TD
  pass_2pt?: number; // Passing 2pt conversions (for QB)
  rec_2pt?: number; // Receiving 2pt conversions (for receiver)
  rush_2pt?: number; // Rushing 2pt conversions (for rusher)
}

export function calculatePlayerScore(stats: PlayerStats): number {
  let score = 0;

  const n = (v?: number) => (typeof v === 'number' ? v : 0);

  // PASSING
  const passYds = n(stats.pass_yd);
  const passTd = n(stats.pass_td);
  const passInt = n(stats.pass_int);
  const passSack = n(stats.pass_sack);
  const passTd40 = n(stats.pass_td_40p);
  const passTd50 = n(stats.pass_td_50p);

  if (passYds > 0) {
    score += passYds / 25; // 1pt per 25 yards (fractional)
    // Yardage bonus
    if (passYds >= 400) score += 4;
    else if (passYds >= 300) score += 2;
  }
  score += passTd * 4; // Passing TDs
  score -= passInt * 2; // Interceptions
  score -= passSack * 0.5; // Sacks
  score += passTd40 * 1; // 40+ yd passing TD bonus
  score += passTd50 * 2; // 50+ yd passing TD bonus

  // RUSHING
  const rushYds = n(stats.rush_yd);
  const rushTd = n(stats.rush_td);
  const rushTd40 = n(stats.rush_td_40p);
  const rushTd50 = n(stats.rush_td_50p);

  if (rushYds > 0) {
    score += rushYds / 10; // 1pt per 10 yards (fractional)
    // Yardage bonus
    if (rushYds >= 200) score += 2;
    else if (rushYds >= 100) score += 1;
  }
  score += rushTd * 6; // Rushing TDs
  score += rushTd40 * 1; // 40+ yd rushing TD bonus
  score += rushTd50 * 2; // 50+ yd rushing TD bonus

  // RECEIVING
  const recYds = n(stats.rec_yd);
  const recTd = n(stats.rec_td);
  const rec = n(stats.rec);
  const recTd40 = n(stats.rec_td_40p);
  const recTd50 = n(stats.rec_td_50p);

  if (recYds > 0) {
    score += recYds / 10; // 1pt per 10 yards (fractional)
    // Yardage bonus
    if (recYds >= 200) score += 2;
    else if (recYds >= 100) score += 1;
  }
  score += recTd * 6; // Receiving TDs
  score += rec * 0.5; // Receptions
  score += recTd40 * 1; // 40+ yd receiving TD bonus
  score += recTd50 * 2; // 50+ yd receiving TD bonus

  // MISC
  const fum = n(stats.fum);
  const fumLost = n(stats.fum_lost);
  const fumRecTd = n(stats.fum_rec_td);
  const pass2pt = n(stats.pass_2pt);
  const rec2pt = n(stats.rec_2pt);
  const rush2pt = n(stats.rush_2pt);

  score -= fum * 1; // Fumbles
  score -= fumLost * 1; // Fumbles lost
  score += fumRecTd * 6; // Fumble recovered for TD
  score += pass2pt * 2; // 2pt conversion (QB on pass)
  score += rec2pt * 2; // 2pt conversion (receiver on pass)
  score += rush2pt * 2; // 2pt conversion (rusher on run)

  return Number(score.toFixed(2));
}
