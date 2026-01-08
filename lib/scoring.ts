// Scoring calculation based on NFL stats
interface PlayerStats {
  // Passing
  pass_yd?: number;
  pass_td?: number;
  pass_int?: number;
  pass_sack?: number;
  pass_td_40p?: number; // 40+ yard passing TDs
  pass_td_50p?: number; // 50+ yard passing TDs
  
  // Rushing
  rush_yd?: number;
  rush_td?: number;
  rush_td_40p?: number; // 40+ yard rushing TDs
  rush_td_50p?: number; // 50+ yard rushing TDs
  
  // Receiving
  rec_yd?: number;
  rec_td?: number;
  rec?: number; // Receptions
  rec_td_40p?: number; // 40+ yard receiving TDs
  rec_td_50p?: number; // 50+ yard receiving TDs
  
  // Misc
  fum?: number; // Fumbles
  fum_lost?: number; // Fumbles lost
  fum_rec_td?: number; // Fumble recovery TDs
  pass_2pt?: number; // Passing 2pt conversions
  rec_2pt?: number; // Receiving 2pt conversions
  rush_2pt?: number; // Rushing 2pt conversions
}

export function calculatePlayerScore(stats: PlayerStats): number {
  let score = 0;

  // PASSING
  if (stats.pass_yd) {
    score += Math.floor(stats.pass_yd / 25); // 1pt per 25 yards
    
    // Passing yardage bonuses
    if (stats.pass_yd >= 400) {
      score += 4;
    } else if (stats.pass_yd >= 300) {
      score += 2;
    }
  }
  
  if (stats.pass_td) {
    score += stats.pass_td * 4; // 4pts per passing TD
  }
  
  if (stats.pass_int) {
    score -= stats.pass_int * 2; // -2pts per interception
  }
  
  if (stats.pass_sack) {
    score -= stats.pass_sack * 0.5; // -0.5pts per sack
  }
  
  // Passing TD distance bonuses
  if (stats.pass_td_50p) {
    score += stats.pass_td_50p * 2; // 2pt bonus for 50+ yard TD
  }
  if (stats.pass_td_40p) {
    // 40+ includes 50+, so subtract 50+ to avoid double counting
    const fortyPlus = stats.pass_td_40p - (stats.pass_td_50p || 0);
    score += fortyPlus * 1; // 1pt bonus for 40-49 yard TD
  }

  // RUSHING
  if (stats.rush_yd) {
    score += Math.floor(stats.rush_yd / 10); // 1pt per 10 yards
    
    // Rushing yardage bonuses
    if (stats.rush_yd >= 200) {
      score += 2;
    } else if (stats.rush_yd >= 100) {
      score += 1;
    }
  }
  
  if (stats.rush_td) {
    score += stats.rush_td * 6; // 6pts per rushing TD
  }
  
  // Rushing TD distance bonuses
  if (stats.rush_td_50p) {
    score += stats.rush_td_50p * 2; // 2pt bonus for 50+ yard TD
  }
  if (stats.rush_td_40p) {
    const fortyPlus = stats.rush_td_40p - (stats.rush_td_50p || 0);
    score += fortyPlus * 1; // 1pt bonus for 40-49 yard TD
  }

  // RECEIVING
  if (stats.rec) {
    score += stats.rec * 0.5; // 0.5pts per reception
  }
  
  if (stats.rec_yd) {
    score += Math.floor(stats.rec_yd / 10); // 1pt per 10 yards
    
    // Receiving yardage bonuses
    if (stats.rec_yd >= 200) {
      score += 2;
    } else if (stats.rec_yd >= 100) {
      score += 1;
    }
  }
  
  if (stats.rec_td) {
    score += stats.rec_td * 6; // 6pts per receiving TD
  }
  
  // Receiving TD distance bonuses
  if (stats.rec_td_50p) {
    score += stats.rec_td_50p * 2; // 2pt bonus for 50+ yard TD
  }
  if (stats.rec_td_40p) {
    const fortyPlus = stats.rec_td_40p - (stats.rec_td_50p || 0);
    score += fortyPlus * 1; // 1pt bonus for 40-49 yard TD
  }

  // MISC
  if (stats.fum) {
    score -= stats.fum; // -1pt per fumble
  }
  
  if (stats.fum_lost) {
    score -= stats.fum_lost; // -1pt per fumble lost
  }
  
  if (stats.fum_rec_td) {
    score += stats.fum_rec_td * 6; // 6pts for fumble recovery TD
  }
  
  // 2-point conversions
  if (stats.pass_2pt) {
    score += stats.pass_2pt * 2; // 2pts for passing 2pt conversion
  }
  
  if (stats.rec_2pt) {
    score += stats.rec_2pt * 2; // 2pts for receiving 2pt conversion
  }
  
  if (stats.rush_2pt) {
    score += stats.rush_2pt * 2; // 2pts for rushing 2pt conversion
  }

  return Math.round(score * 100) / 100; // Round to 2 decimal places
}
