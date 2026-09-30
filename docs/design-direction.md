# Design direction (v2)

Reference points: BlackRock and Vanguard for calm finance layouts, Harvard for type and
centred rhythm, Bloomberg for dense data presented cleanly. We take the principles, not
the look.

## Principles

1. White page, one accent. Pure #FFFFFF background. Navy #1C3A5E is the brand and the
   primary action colour. Red #A62822 appears in the wordmark and for falling prices only.
   No tan, no dotted paper, no highlighter marks.
2. Headings say the thing. No small uppercase labels above headings ("eyebrows"). A
   section starts with its heading and, where needed, one sentence under it.
3. Type does the work. Inter throughout, tight tracking on large sizes, weight 600 to
   700 for headings. The serif is kept only for the wordmark.
4. Numbers are the product. Prices and rates use tabular figures, a clear unit, and a
   date and source next to them. Up is green, down is red, flat is grey.
5. Quiet surfaces. Cards are white with a 1px #E5E7EB border and 12px radius. Hover
   lifts the border to navy and adds a soft shadow; nothing jumps more than 2px.
   Alternate sections use #F7F8FA bands, as Vanguard does.
6. Centre the page frame. Hero copy, section headings and the footer brand block are
   centred on the homepage and hub pages; long reading content stays left-aligned at a
   readable width (about 70 characters).
7. Trust in plain view. Every data surface says where the number came from and when.
   Every page that asks for data says what we do with it.
8. Accessible by default. Text contrast at least 4.5:1, visible focus rings, 44px
   touch targets, reduced motion respected.

## Tokens

| Token | Value | Use |
|---|---|---|
| paper | #FFFFFF | page background |
| paper-2 | #F7F8FA | section bands, table heads |
| paper-3 | #EEF1F5 | pressed and selected states |
| ink | #111827 | body text |
| muted | #4B5563 | secondary text (7.6:1 on white) |
| muted-2 | #6B7280 | captions (4.8:1 on white) |
| line | #E5E7EB | borders |
| line-soft | #F0F2F5 | inner dividers |
| navy | #1C3A5E | brand, primary buttons, links |
| brand-red | #A62822 | wordmark, price down |
| green-700 | #15803D | price up |
