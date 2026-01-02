# Excel Services Import Script

This script imports business/service data from an Excel file (`dataset.xlsx`) into Firebase Firestore `businesses` collection.

## Prerequisites

1. Ensure `dataset.xlsx` is located in the `public/` folder
2. Excel file should have the following columns:
   - **title** - Business name (required)
   - **phone** - Phone number
   - **categoryName** - Category/tag (e.g., "Dog trainer", "Veterinary")
   - **city** - City name
   - **countryCode** - Country code (e.g., "IL")
   - **website** - Website URL (used to generate email)
   - **url** - Google Maps URL
   - **totalScore** - Rating score (optional, 0-5)
   - **reviewsCount** - Number of reviews (optional)

## Usage

Run the import script:

```bash
npm run import:services
```

Or directly:

```bash
npx tsx scripts/import-services-from-excel.ts
```

## Excel File Format Example

| title | phone | categoryName | city | countryCode | website | totalScore | reviewsCount |
|-------|-------|--------------|------|-------------|---------|------------|--------------|
| Pet Clinic | +972-50-1234567 | Veterinary | Tel Aviv | IL | http://clinic.com | 4.8 | 45 |
| Dog Trainer | +972-50-7654321 | Dog trainer | Haifa | IL | http://trainer.com | 4.9 | 132 |

## What Gets Imported

Each row in the Excel file will be imported as a business document in Firebase with:

- **name**: From `title` column
- **description**: Auto-generated from category, city, and rating
- **imageUrl**: Defaults to `/upload_figure.svg` (placeholder image)
- **contactInfo**: 
  - **email**: Generated from website domain or placeholder
  - **phone**: From `phone` column
  - **address**: From `city` and `countryCode`
- **tags**: Array containing the `categoryName`
- **rating**: From `totalScore` (if available)
- **isActive**: Set to `true` by default
- **createdBy**: Set to `'excel-import'`
- **createdAt** / **updatedAt**: Timestamps

## Notes

- Rows without a name will be skipped
- If no tags are provided, a default tag `['general']` will be used
- If no email is provided, a placeholder email will be used
- The script will show a summary of successful imports, errors, and skipped rows

## Troubleshooting

1. **File not found**: Ensure `dataset.xlsx` is in the `public/` folder
2. **Column names**: The script tries multiple variations of column names (case-insensitive)
3. **Firebase connection**: Ensure Firebase credentials are properly configured in the script

