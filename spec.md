# Specification

## Summary
**Goal:** Upgrade Trading Journal Pro with glassmorphism UI styling, interactive P&L chart, live risk-reward calculator, conviction meter, and enhanced trade log filters.

**Planned changes:**
- Apply glassmorphism styling (semi-transparent backgrounds, backdrop-blur, subtle border highlights) to all card components, modals, and sidebar panels across all pages, preserving the deep navy dark theme
- Restyle Buy/Sell direction buttons and badges to use soft neon borders (green for Buy, red for Sell) with glowing box-shadow on hover/click instead of solid fills
- Increase sidebar navigation icon sizes to at least 22–24px using minimalistic lucide-react icons alongside each nav label
- Add an interactive P&L line/area chart at the top of the Dashboard showing net profit/loss for the last 7 calendar days, with green/red visual distinction for positive/negative days
- Add a live Risk-Reward Calculator block in the New Trade form that auto-calculates Risk per Share, Risk Amount, and Risk:Reward Ratio as the user types Entry Price, Stop Loss, Target, and Quantity
- Add a 1–5 star Trade Conviction Meter selector in the New Trade form (Psychology section), save the conviction value to the trade record, and display it in the Trade Log table
- Extend the backend trade data type with an optional conviction field
- Add Strategy and Mistake Type dropdown filters to the Trade Log filter bar that compose with existing filters and update the trade list in real time

**User-visible outcome:** Users see a premium frosted-glass interface with glowing Buy/Sell indicators, can view a 7-day P&L chart on the dashboard, get instant risk-reward feedback while entering trades, record their trade conviction with a star rating, and filter their trade log by strategy or mistake type.
