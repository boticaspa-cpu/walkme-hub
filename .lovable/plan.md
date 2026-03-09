

# Fix: CashSessionGuard blocking its own escape route

## Problem
`CashSessionGuard` shows a blocking modal when there's an open session from a previous day. The modal navigates to `/cierre-diario`, but the guard also renders on that page, creating an infinite loop where the user can never reach the close controls.

## Fix
In `CashSessionGuard`, check the current route. If the user is already on `/cierre-diario`, don't show the blocking modal — let them access the page to perform the close.

### File: `src/components/cash/CashSessionGuard.tsx`
- Import `useLocation` from `react-router-dom`
- Before showing the old-session modal, check `if (location.pathname === "/cierre-diario") return null`

This is a 3-line change that unblocks the user immediately.

