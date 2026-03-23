

# Add Focus-Visible Accessibility Style

## Summary
Append a global `*:focus-visible` rule to `src/index.css` to improve keyboard navigation accessibility across the entire app.

## Changes — `src/index.css`
Add at the end of the file:
```css
*:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px hsl(var(--background)), 0 0 0 4px hsl(var(--primary));
  border-radius: 4px;
}
```

No other files modified.

