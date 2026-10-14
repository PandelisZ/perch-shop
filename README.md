# Perch shop

A small demo shop for benchmarking browser-testing tools. It reproduces the setup
from GitTested's review of tester-army/e2e
(https://gittested.com/reviews/tester-army-e2e/): a shop with sign-in, a plan
upgrade, a cart and a checkout, no test ids, ten regression tests, five product
changes and six planted bugs.

Every build is served from one GitHub Pages deployment at an opaque path, so a
tester cannot tell a planted bug from the address. `variants.json` maps build
names to paths; `site/app.js` (`BUILDS`) says what each build changes.

| Build | What differs |
| --- | --- |
| base | Unchanged shop |
| move | Upgrade to Pro and Remove buttons moved within their panels |
| rename | Those buttons renamed to Review Pro upgrade / Delete … |
| menu | Upgrade to Pro moved into a Plan options menu |
| postcode | Checkout requires a delivery postcode (page says to use A1A1A1) |
| copy | Payment confirmation headline reworded |
| bug-preview | Invoice preview shows a $12.00 prorated amount instead of $10.00 |
| bug-total | Cart total ignores quantities |
| bug-count | Items in cart never decreases |
| bug-declined | A declined card is shown as paid |
| bug-charge | The charged amount covers only the first cart line |
| bug-confirm | Confirm upgrade does nothing useful; a second Complete upgrade button works |
| all-bugs | All six bugs at once, for exploratory runs |

Demo account: robin@perch.test / perch-demo. Test cards: 4242 4242 4242 4242
succeeds, 4000 0000 0000 0002 is declined.

```bash
npm install
npx playwright install chromium
npm test          # Playwright suite against the base build (serves locally)
npm run matrix    # Playwright suite against every build
```

`scenarios/` holds the same ten tests as Composal Verify Scenarios.
