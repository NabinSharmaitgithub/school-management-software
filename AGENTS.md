# Defaults: Ponytail (full) + Stitch + Firebase

- **Ponytail full** — lazy senior dev: YAGNI first, reuse > stdlib > native > installed dep > one-liner > minimal code. No abstractions not requested. Deletion over addition. `ponytail:` comments for deliberate ceilings.
- **Stitch** — default for ALL UI: use `stitch_generate_screen_from_text` / `stitch_edit_screens` / `stitch_create_design_system`. Do not hand-code screens.
- **Firebase** — default for ALL backend/auth/hosting: Firestore + Auth + Hosting. Use `classes`, `students`, `subjects`, `marks` collections with `request.auth != null` rules. Prefer Firebase MCP over Supabase/Vercel.
