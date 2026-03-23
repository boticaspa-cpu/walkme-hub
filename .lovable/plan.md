

# Add Package Selection to Promotions

## Summary
Allow promotions to target specific tour packages instead of only whole tours. Add a `package_name` column to `promotion_tours` and update the UI to show package selection after choosing a tour.

## Database Change
Add nullable `package_name text` column to `promotion_tours`:
```sql
ALTER TABLE public.promotion_tours ADD COLUMN package_name text DEFAULT NULL;
```
- `NULL` means "all packages" (current behavior preserved)
- A value like `'Plus'` means the promo only applies to that specific package

## Changes — `src/pages/Promociones.tsx`

### 1. Fetch tour_packages
Add a query to load all active tour_packages (id, tour_id, name, price_adult_mxn). This populates the package dropdown per tour.

### 2. Track selected packages per tour
Change from `selectedTourIds: string[]` to a structure like `Map<tourId, packageNames[]>` where empty array means "all packages". Or simpler: store `selectedItems: { tour_id, package_name | null }[]`.

### 3. Tour selector UI update
After each tour checkbox is checked, show the available packages for that tour inline:
- "Todos los paquetes" checkbox (default, selected when no specific packages chosen)
- Individual package checkboxes with their MXN price
- When a specific package is selected, use its `price_adult_mxn` for subtotal calculation instead of the tour's base price

### 4. Subtotal calculation
Update the `subtotal` memo to sum prices from the selected packages (using `tour_packages.price_adult_mxn`) when specific packages are chosen, or the tour base price when "all packages" is selected.

### 5. Save mutation update
When inserting into `promotion_tours`, include the `package_name` field:
```ts
selectedItems.map(item => ({
  promotion_id: promoId,
  tour_id: item.tour_id,
  package_name: item.package_name // null = all packages
}))
```
Use `(supabase as any)` cast since the types won't have the new column yet.

### 6. Load existing package_name on edit
Update the promotions query to also select `package_name` from `promotion_tours`, and populate the form state when editing.

### 7. Display in table
Show package badges alongside tour badges in the promotions list (e.g. "Tour Xcaret → Plus").

## Changes — `src/pages/Cotizaciones.tsx` and `src/pages/Reservas.tsx`

### 8. Read package_name from promotion_tours
When loading a promotion's tours, also fetch `package_name` and pass it to the created quote/reservation items so the correct package is pre-selected.

## Files Modified
- `src/pages/Promociones.tsx` (main changes)
- `src/pages/Cotizaciones.tsx` (minor: read package_name when applying promo)
- `src/pages/Reservas.tsx` (minor: read package_name when applying promo)
- Migration: add `package_name` column to `promotion_tours`

