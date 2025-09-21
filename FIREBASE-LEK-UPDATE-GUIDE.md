# Firebase Database Update Guide: EUR to Albanian Lek

## Overview
This guide provides the exact steps to update Beach Bar Durrës pricing from EUR to Albanian Lek in the Firebase database.

## Firebase Console Access
1. **Go to**: https://console.firebase.google.com/project/qr-restaurant-api/firestore
2. **Login** with your Firebase account
3. **Select Project**: qr-restaurant-api

## Database Updates Required

### Step 1: Update Venue Currency
**Path**: `venue/beach-bar-durres`
**Field to Update**: `settings.currency`
**Change**: `"EUR"` → `"ALL"`

### Step 2: Update Menu Item Prices
**Path**: `venue/beach-bar-durres/menuItem/[ITEM_ID]`

#### Required Price Updates:

| Item ID | Item Name | Current Price | New Price (Lek) | Albanian Name |
|---------|-----------|---------------|-----------------|---------------|
| `greek-salad` | Greek Salad | 8.5 | **900** | Sallatë Greke |
| `fried-calamari` | Fried Calamari | 12 | **1200** | Kallamar i Skuqur |
| `seafood-risotto` | Seafood Risotto | 18.5 | **1800** | Rizoto me Fruta Deti |
| `grilled-lamb` | Grilled Lamb Chops | 22 | **2200** | Copë Qengji në Skarë |
| `grilled-branzino` | Grilled Sea Bass | 24 | **2500** | Levrek në Skarë |
| `albanian-beer` | Albanian Beer | 3.5 | **350** | Birrë Shqiptare |
| `raki` | Albanian Raki | 4 | **400** | Raki Shqiptare |
| `mojito` | Mojito | 7.5 | **750** | Mojito |
| `tiramisu` | Tiramisu | 6.5 | **650** | Tiramisu |
| `baklava` | Baklava | 5.5 | **550** | Bakllava |

## Detailed Steps

### Method 1: Firebase Console (Recommended)

1. **Navigate to Firestore Database**
   - Go to: https://console.firebase.google.com/project/qr-restaurant-api/firestore/data

2. **Update Venue Currency**
   - Click on `venue` collection
   - Click on `beach-bar-durres` document
   - Find `settings` field
   - Edit `currency` from `"EUR"` to `"ALL"`
   - Save changes

3. **Update Each Menu Item**
   - Navigate to `venue/beach-bar-durres/menuItem`
   - For each item ID listed above:
     - Click on the item document
     - Update the `price` field with the new Lek value
     - Update/add the `nameAlbanian` field
     - Save changes

### Method 2: Import JSON (Faster)

If the console allows bulk import, use this JSON structure:

```json
{
  "venue": {
    "beach-bar-durres": {
      "settings": {
        "currency": "ALL",
        "orderingEnabled": true,
        "estimatedPreparationTime": 15
      },
      "menuItem": {
        "greek-salad": {
          "price": 900,
          "nameAlbanian": "Sallatë Greke"
        },
        "fried-calamari": {
          "price": 1200,
          "nameAlbanian": "Kallamar i Skuqur"
        },
        "seafood-risotto": {
          "price": 1800,
          "nameAlbanian": "Rizoto me Fruta Deti"
        },
        "grilled-lamb": {
          "price": 2200,
          "nameAlbanian": "Copë Qengji në Skarë"
        },
        "grilled-branzino": {
          "price": 2500,
          "nameAlbanian": "Levrek në Skarë"
        },
        "albanian-beer": {
          "price": 350,
          "nameAlbanian": "Birrë Shqiptare"
        },
        "raki": {
          "price": 400,
          "nameAlbanian": "Raki Shqiptare"
        },
        "mojito": {
          "price": 750,
          "nameAlbanian": "Mojito"
        },
        "tiramisu": {
          "price": 650,
          "nameAlbanian": "Tiramisu"
        },
        "baklava": {
          "price": 550,
          "nameAlbanian": "Bakllava"
        }
      }
    }
  }
}
```

## Verification

After making the changes:

1. **Check API Response**:
   ```bash
   curl "https://api-mkazmlu7ta-ew.a.run.app/v1/venue/beach-bar-durres/menu"
   ```
   Should show:
   - `"currency": "ALL"`
   - Greek Salad price: `900` (not `8.5`)

2. **Test Customer App**:
   - Visit: https://order.skan.al/beach-bar-durres/a1/menu
   - Should display:
     - "Sallatë Greke: 900 Lek" (not "€8.50")
     - "Kallamar i Skuqur: 1200 Lek" (not "€12.00")

## Expected Result

✅ **Before**: Greek Salad shows "€8.50"
✅ **After**: Greek Salad shows "900 Lek"

✅ **Before**: Albanian Beer shows "€3.50"  
✅ **After**: Albanian Beer shows "350 Lek"

The customer ordering experience will then display authentic Albanian Lek pricing throughout the entire app.

## Notes

- **Database Collection**: Confirm you're updating the correct collection (`venue` vs `venues`)
- **Field Types**: Ensure prices are stored as integers (900) not strings ("900")
- **Backup**: Firebase Console allows viewing document history if rollback is needed
- **Real-time Updates**: Changes take effect immediately in the customer app

## Troubleshooting

If changes don't appear:
1. Check browser cache (hard refresh: Cmd+Shift+R)
2. Verify correct document path in Firestore
3. Confirm field names match exactly (case-sensitive)
4. Check Firebase project ID is `qr-restaurant-api`

---

**Project**: SKAN.AL QR Restaurant Ordering
**Database**: qr-restaurant-api
**Target**: Beach Bar Durrës currency conversion
**Impact**: Complete EUR → Albanian Lek pricing system