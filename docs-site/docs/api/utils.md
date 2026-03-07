# Utils

## Helper Functions

### formatAmount

Format a token amount for display.

```typescript
function formatAmount(amount: bigint, decimals: number): string
```

**Example:**

```typescript
import { formatAmount } from '@sorosave/sdk';

const display = formatAmount(1000000000n, 7);
// "100.0000000"
```

### parseAmount

Parse a string amount to bigint.

```typescript
function parseAmount(amount: string, decimals: number): bigint
```

**Example:**

```typescript
import { parseAmount } from '@sorosave/sdk';

const raw = parseAmount("100", 7);
// 1000000000n
```

### validateAddress

Validate a Stellar address.

```typescript
function validateAddress(address: string): boolean
```

**Example:**

```typescript
import { validateAddress } from '@sorosave/sdk';

const isValid = validateAddress('G...');
// true or false
```

### calculateRoundDates

Calculate the dates for each round.

```typescript
function calculateRoundDates(
  startDate: Date,
  cycleLength: number,
  maxMembers: number
): Date[]
```

**Example:**

```typescript
const dates = calculateRoundDates(
  new Date(),
  86400, // 1 day
  5      // 5 members
);
// [Date, Date, Date, Date, Date]
```
