# API Stats Fetching - Current Limitations

## What Works
- ✅ Fetching player stats from Sleeper API
- ✅ Calculating scores based on available stats:
  - Passing yards
  - Passing TDs
  - Rushing yards
  - Rushing TDs
  - Receiving yards
  - Receiving TDs
  - Receptions
  - Sacks

## What Doesn't Work (Not Available in Sleeper API)
- ❌ Pass Interceptions (thrown)
- ❌ Fumbles
- ❌ Fumbles Lost
- ❌ Fumble Recovery TDs
- ❌ 2-point Conversions
- ❌ Detailed TD distance breakdowns (40+, 50+ yards)

## Recommendation

**Option 1: Manual Entry with Pre-filled Stats**
- Use the auto-fetch button to get base stats (yards, TDs)
- Manually add the missing stats (INT, fumbles, etc.)
- This saves time while keeping accuracy

**Option 2: Switch to NFL Official API or SportRadar**
- Provides complete stat breakdowns
- Costs $$ per month
- More reliable for advanced scoring

**Option 3: ESPN API**
- Unofficial but has more stats
- Rate limited and less reliable
- Free but no support

## Testing
Run: `curl http://localhost:3000/api/admin/test-stats` to verify connection works

## Stats Available from Sleeper
```
pass_yd, pass_td, pass_sack, pass_sack_yds
rush_yd, rush_td, rush_att
rec_yd, rec_td, rec
```
