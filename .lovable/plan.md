

# Plan: Phase 2 — Interface Updates, Multi-Image, AI Document Mapping & Cart Fix

## Summary
Update all three pages (Tours, Operadores, POS) for the new v2 schema, add multi-image upload (4 photos), create an AI-powered document parser edge function, and fix cart totals to use the new price matrix.

---

## Task 1: Update PriceVariantEditor for new schema

Rebuild `src/components/tours/PriceVariantEditor.tsx`:
- New `VariantForm` fields: `operator_id`, `zone`, `pax_type` (Adulto/Niño), `nationality` (Mexicano/Extranjero), `sale_price`, `net_cost`, `tax_fee`
- Remove old `is_mexican`, `price_adult_mxn`, `price_child_mxn`, `tour_package_id`
- Add operator selector dropdown (receives operators list as prop)
- Zone options: Cancun, Playa, Tulum, Riviera Maya
- Add "Generate All Combinations" button that creates 8 rows (4 zones × 2 nationalities) for both Adulto and Niño (16 total) for quick setup
- Only show `net_cost` column if user role is admin

## Task 2: Update VariantSelectDialog for new schema

Rebuild `src/components/pos/VariantSelectDialog.tsx`:
- New schema has separate rows per pax_type — one row = one price for one (zone, nationality, pax_type) combo
- Dialog flow: select Zone → select Nationality → system finds Adulto + Niño prices automatically
- Display adult `sale_price` and child `sale_price` from two separate variant rows
- Quantity selectors for adults and children
- Total = (adult_sale_price × qty_adults) + (child_sale_price × qty_children)
- Props receive operator_id from tour to filter variants

## Task 3: Update Tours.tsx

**Multi-image upload (up to 4 photos):**
- Replace single `imageFile`/`imagePreview` state with `imageFiles: File[]` and `imagePreviews: string[]`
- Grid of 4 image slots with upload/remove buttons
- On save, upload all new files to `media` bucket, build `image_urls` array
- Update `TourRow` interface: `image_url` → `image_urls: string[]`
- Tour card shows first image from array
- Showroom dialog shows image carousel

**Update save logic for variants:**
- `saveVariants()` now sends `operator_id`, `zone`, `pax_type`, `nationality`, `sale_price`, `net_cost`, `tax_fee`
- Remove old `tour_package_id`, `is_mexican`, `price_adult_mxn`, `price_child_mxn` references
- Pass operators list to PriceVariantEditor

**Remove `image_url` from payload** — use `image_urls` array instead

## Task 4: Update Operadores.tsx

Add three new fields to the form:
- `exchange_rate` (numeric input, label: "Tipo de Cambio")
- `base_currency` (select: USD/MXN/EUR)
- `payment_rules` (select: prepago/mensual)
- Add these to OperatorForm interface, emptyForm defaults, openEdit mapping, and save payload
- Show exchange_rate and base_currency columns in the table

## Task 5: Update POS.tsx — Role-based variant query & cart fix

**Role-based query:**
- Use `useAuth()` to get `role`
- If `role === "seller"`: query `tour_price_variants_seller` (excludes net_cost)
- If `role === "admin"`: query `tour_price_variants` (full data)

**Fix cart total calculation:**
- When a variant is selected, cart item stores `sale_price` from the matched adult variant and child variant
- `subtotal` = sum of (adult_sale_price × qty_adults + child_sale_price × qty_children) per item
- Remove old USD-based `totalAgencyMxn`/`totalBoardingMxn` calculation for variant items — those only apply to legacy non-variant items
- `grandTotal` properly combines variant-based and legacy items

**Update addVariantToCart:**
- Store adult variant's `sale_price` as `unitPrice`
- Store child variant's `sale_price` as `priceChildMxn`
- Remove old `price_adult_mxn`/`price_child_mxn` references

## Task 6: AI Document Mapping Edge Function

Create `supabase/functions/parse-tour-document/index.ts`:
- Accepts file upload (PDF or image) via multipart form data
- Uses Lovable AI (google/gemini-2.5-flash with vision) to analyze the document
- Extracts: tour name, description, itinerary, includes/excludes, and price matrix (zone × nationality × pax_type → sale_price)
- Returns structured JSON that the frontend can use to pre-fill the tour form and variant matrix

**Frontend integration in Tours.tsx:**
- Add "Mapear Documento" button in the tour create/edit dialog (admin only)
- Opens file picker for PDF/image
- Uploads to edge function, shows loading spinner
- On success, pre-fills form fields and variant matrix with extracted data
- User reviews and adjusts before saving

## Task 7: Update config.toml

Add the new edge function entry:
```toml
[functions.parse-tour-document]
verify_jwt = false
```

---

## Technical Notes

- The new `tour_price_variants` schema stores ONE price per row (not adult+child). The VariantSelectDialog must find TWO rows (adult + child) for a given (zone, nationality, operator) to display both prices.
- The `tour_price_variants_seller` VIEW excludes `net_cost` — this is enforced at DB level, not just UI.
- The AI document parser uses `google/gemini-2.5-flash` with vision capability via the Lovable AI gateway and tool calling for structured output.
- Files changed/created: ~7 files total.

