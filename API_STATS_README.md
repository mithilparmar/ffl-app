# API Stats Fetching - ESPN Integration

## What Works Now ✅

The app now uses **ESPN API** which provides complete stats including:
- ✅ Passing yards, TDs, **Interceptions**
- ✅ Rushing yards, TDs
- ✅ Receiving yards, TDs, Receptions
- ✅ **Fumbles and Fumbles Lost**
- ✅ **Defensive/Fumble Recovery TDs**
- ✅ Sacks
- ✅ 2-point Conversions

All your custom scoring rules are now fully supported!

## How to Use

1. **On Admin Scores Page** → Click "🔄 Auto-Fetch Stats from API"
2. Scores will auto-populate with all stats including:
   - Interceptions (-2pts each)
   - Fumbles (-1pt each)
   - All other custom scoring rules
3. Review and click "Save Scores"

## API Details

- **Source**: ESPN Official API
- **Data**: Real-time NFL game stats
- **No Key Required**: Free and unlimited
- **Accuracy**: Official ESPN data

## Testing

Run this to test the connection:
```bash
curl http://localhost:3000/api/admin/test-stats | jq .
```

Expected output:
- Player name and stats fetched
- Calculated score based on all rules
- Includes INT, fumbles, etc.

## Limitations

ESPN API requires games to be completed to provide stats. Stats update automatically as games progress during playoff weeks.
