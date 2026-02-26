# Specification

## Summary
**Goal:** Add strategy analytics, trade editing, and smart strategy autocomplete to EmpireTradeX.

**Planned changes:**
- Add a `strategies` collection to the backend with `saveStrategy`, `getStrategies`, and `deleteStrategy` functions, all gated behind caller authentication
- Add an `updateTrade` backend function that allows the trade owner to update entry, stop loss, target, P&L, strategy, emotion, and notes fields with an `updatedAt` timestamp
- Automatically persist a strategy name to the strategies collection when a new trade is created with a non-empty strategy field
- Add React Query hooks: `useGetStrategies`, `useSaveStrategy`, `useDeleteStrategy`, and `useUpdateTrade` (invalidates trades cache on success)
- Add a "Strategy Performance" section to the Analytics page showing per-strategy metrics (Total Trades, Win Rate %, Total P&L, Avg R:R, Avg Risk) in a sortable table and a Recharts bar chart, with the best-performing strategy visually highlighted; trades without a strategy grouped as "Untagged"
- Add an Edit button to each trade card in the Trade Log page that opens a pre-filled modal for editing all seven fields; on success, refreshes trade list and analytics
- Replace the plain strategy text input in NewTradePage and the Edit Trade modal with a smart autocomplete component that filters suggestions case-insensitively, supports abbreviation/substring matching, and allows keyboard navigation
- Add a "Strategy Manager" section to the Settings page listing saved strategies with a Delete button for each, and an empty-state message when none exist
- Add a backend migration module that introduces the strategies stable data structure on canister upgrade without affecting existing trade records

**User-visible outcome:** Users can edit existing trades, view strategy-grouped performance analytics with charts, use smart autocomplete when entering strategies, and manage their saved strategies from the settings page.
