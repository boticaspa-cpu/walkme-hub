

# Add delete client option for admins

## Change

Single file: `src/pages/Clientes.tsx`

- Add a delete confirmation dialog (using `AlertDialog`) triggered by a trash icon button next to the edit button in the actions column.
- Add a `deleteMutation` that calls `supabase.from("clients").delete().eq("id", id)`.
- Only visible when `isAdmin` is true (same guard as edit).

No database changes needed — the RLS policy `Admins can delete clients` already exists.

