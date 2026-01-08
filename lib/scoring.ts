// Scoring calculation based on NFL stats
// Supports both Sleeper API and ESPN API stat formats

export interface PlayerStats {
  // Passing (Sleeper format)
  pass_yd?: number;
  pass_td?: number;
  pass_int?: number;
  pass_sack?: number;
  pass_sack_yds?: number;
  
  // Passing (ESPN format)
  passingYards?: number;
  passingTouchdowns?: number;
  interceptions?: number;
  sacks?: number;
  
  // Rushing (Sleeper format)
  rush_yd?: number;
  rush_td?: number;
  rush_td_40p?: number;
  rush_td_50p?: number;
  
  // Rushing (ESPN format)
  rushingYards?: number;
  rushingTouchdowns?: number;
  
  // Receiving (Sleeper format)
  rec_yd?: number;
  rec_td?: number;
  rec?: number;
  rec_td_40p?: number;
  rec_td_50p?: number;
  
  // Receiving (ESPN format)
  receivingYards?: number;
  receivingTouchdowns?: number;
  receivingReceptions?: number;
  
  // Misc (Sleeper format)
  fum?: number;
  fum_lost?: number;
  fum_rec_td?: number;
  pass_2pt?: number;
  rec_2pt?: number;
  rush_2pt?: number;
  
  // Misc (ESPN format)
  fumblesRecovered?: number;
  fumblesLost?: number;
  defensiveTouchdowns?: number;
}

export function calculatePlayerScore(stats: PlayerStats): number {
  let score = 0;

  // Helper to handle both API formats
  const getPassYards = () => stats.pass_yd ?? stats.passingYards ?? 0;
  const getPassTD = () => stats.pass_td ?? stats.passingTouchdowns ?? 0;
  const getPassInt = () => stats.pass_int ?? stats.interceptions ?? 0;
  const getPassSack = () => {
    if (stats.pass_sack !== undefined) return stats.pass_sack;
    if (stats.sacks !== undefined) return stats.sacks;
    if (stats.pass_sack_yds) return Math.round(stats.pass_sack_yds / 5.5);
    return 0;
  };
  
  const getRushYards = () => stats.rush_yd ?? stats.rushingYards ?? 0;
  const getRushTD = () => stats.rush_td ?? stats.rushingTouchdowns ?? 0;
  
  const getRecYards = () => stats.rec_yd ?? stats.receivingYards ?? 0;
  const getRecTD = () => stats.rec_td ?? stats.receivingTouchdowns ?? 0;
  const getRec = () => stats.rec ?? stats.receivingReceptions ?? 0;
  
  const getFum = () => stats.fum ?? 0;
  const getFumLost = () => stats.fum_lost ?? stats.fumblesLost ?? 0;
  const getFumRecTD = () => stats.fum_rec_td ?? stats.defensiveTouchdowns ?? 0;

  // PASSING
  const passYards = getPassYards();
  if (passYards) {
    score += Math.floor(passYards / 25); // 1pt per 25 yards
    
    // Passing yardage bonuses
    if (passYards >= 400) {
      score += 4;
    } else if (passYards >= 300) {
      score += 2;
    }
  }
  
  const passTD = getPassTD();
  if (passTD) {
    score += passTD * 4; // 4pts per passing TD
  }
  
  const passInt = getPassInt();
  if (passInt) {
    score -= passInt * 2; // -2pts per interception
  }
  
  const passSack = getPassSack();
  if (passSack) {
    score -= passSack * 0.5; // -0.5pts per sack
  }
  
  // Passing TD distance bonuses (if available)
  if (stats.pass_td_50p) {
    score += stats.pass_td_50p * 2; // 2pt bonus for 50+ yard TD
  }
  if (stats.pass_td_40p) {
    const fortyPlus = stats.pass_td_40p - (stats.pass_td_50p || 0);
    score += fortyPlus * 1; // 1pt bonus for 40-49 yard TD
  }

  // RUSHING
  const rushYards = getRushYards();
  if (rushYards) {
    score += Math.floor(rushYards / 10); // 1pt per 10 yards
    
    // Rushing yardage bonuses
    if (rushYards >= 200) {
      score += 2;
    } else if (rushYards >= 100) {
      score += 1;
    }
  }
  
  const rushTD = getRushTD();
  if (rushTD) {
    score += rushTD * 6; // 6pts per rushing TD
  }
  
  // Rushing TD distance bonuses (if available)
  if (stats.rush_td_50p) {
    score += stats.rush_td_50p * 2; // 2pt bonus for 50+ yard TD
  }
  if (stats.rush_td_40p) {
    const fortyPlus = stats.rush_td_40p - (stats.rush_td_50p || 0);
    score += fortyPlus * 1; // 1pt bonus for 40-49 yard TD
  }

  // RECEIVING
  const rec = getRec();
  if (rec) {
    score += rec * 0.5; // 0.5pts per reception
  }
  
  const recYards = getRecYards();
  if (recYards) {
    score += Math.floor(recYards / 10); // 1pt per 10 yards
    
    // Receiving yardage bonuses
    if (recYards >= 200) {
      score += 2;
    } else if (recYards >= 100) {
      score += 1;
    }
  }
  
  const recTD = getRecTD();
  if (recTD) {
    score += recTD * 6; // 6pts per receiving TD
  }
  
  // Receiving TD distance bonuses (if available)
  if (stats.rec_td_50p) {
    score += stats.rec_td_50p * 2; // 2pt bonus for 50+ yard TD
  }
  if (stats.rec_td_40p) {
    const fortyPlus = stats.rec_td_40p - (stats.rec_td_50p || 0);
    score += fortyPlus * 1; // 1pt bonus for 40-49 yard TD
  }

  // MISC
  const fum = getFum();
  if (fum) {
    score -= fum; // -1pt per fumble
  }
  
  const fumLost = getFumLost();
  if (fumLost) {
    score -= fumLost; // -1pt per fumble lost
  }
  
  const fumRecTD = getFumRecTD();
  if (fumRecTD) {
    score += fumRecTD * 6; // 6pts for fumble recovery TD
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
