
# 🧨 Issues, Anti-patterns, and Inefficiencies in `WalletPage`

## 1. ❌ Incorrect or Inconsistent Filtering Logic

```ts
const balancePriority = getPriority(balance.blockchain);
if (lhsPriority > -99) {
  if (balance.amount <= 0) {
    return true;
  }
}
```

- `lhsPriority` is **undefined** — it should be `balancePriority`.
- Logic implies _“if amount ≤ 0, include it”_ which is likely wrong — you usually **exclude zero balances**.
- Nested conditionals reduce clarity and readability.

---

## 2. ❌ `getPriority` Not Memoized

```ts
const getPriority = (blockchain: any): number => { ... }
```

- Re-created on **every render**, which can lead to inefficiencies especially when used in `useMemo`.
- Should be wrapped with `useCallback` for stability and performance.

---

## 3. ❌ Weak Typing with `any`

```ts
(blockchain: any)
```

- Using `any` defeats TypeScript's purpose.
- Should use a strict union type like:

```ts
type Blockchain = 'Osmosis' | 'Ethereum' | 'Arbitrum' | 'Zilliqa' | 'Neo' | string;
```

---

## 4. ❌ Bad Key in `.map()`

```tsx
key={index}
```

- Using array `index` as a key is discouraged — can cause subtle bugs in re-rendering and diffing.
- Use a stable unique key like `balance.currency`.

---

## 5. ❌ `formattedBalances` Not Memoized

```ts
const formattedBalances = sortedBalances.map(...)
```

- Recomputed on every render — low cost, but unnecessary.
- Should be wrapped in `useMemo`.

---

## 6. ❌ Type Assumptions in `rows.map()`

```tsx
sortedBalances.map((balance: FormattedWalletBalance, index) => ...
```

- `sortedBalances` is of type `WalletBalance[]`, not `FormattedWalletBalance[]`.
- `balance.formatted` will be **undefined**, leading to rendering errors.

---

# ✅ Refactored Version

```tsx
interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: Blockchain;
}

interface FormattedWalletBalance extends WalletBalance {
  formatted: string;
}

type Blockchain = 'Osmosis' | 'Ethereum' | 'Arbitrum' | 'Zilliqa' | 'Neo' | string;

const WalletPage: React.FC<Props> = (props) => {
  const { children, ...rest } = props;
  const balances = useWalletBalances();
  const prices = usePrices();

  const getPriority = useCallback((blockchain: Blockchain): number => {
    switch (blockchain) {
      case 'Osmosis': return 100;
      case 'Ethereum': return 50;
      case 'Arbitrum': return 30;
      case 'Zilliqa':
      case 'Neo': return 20;
      default: return -99;
    }
  }, []);

  const sortedBalances = useMemo(() => {
    return balances
      .filter((b) => getPriority(b.blockchain) > -99 && b.amount > 0)
      .sort((a, b) => getPriority(b.blockchain) - getPriority(a.blockchain));
  }, [balances, getPriority]);

  const formattedBalances = useMemo((): FormattedWalletBalance[] => {
    return sortedBalances.map((b) => ({
      ...b,
      formatted: b.amount.toFixed()
    }));
  }, [sortedBalances]);

  const rows = useMemo(() => {
    return formattedBalances.map((b) => {
      const usdValue = prices[b.currency] * b.amount;
      return (
        <WalletRow
          key={b.currency}
          className={classes.row}
          amount={b.amount}
          usdValue={usdValue}
          formattedAmount={b.formatted}
        />
      );
    });
  }, [formattedBalances, prices]);

  return <div {...rest}>{rows}</div>;
};
```

---

# ✅ Summary of Fixes

| Problem | Fix |
|--------|-----|
| `lhsPriority` bug | Replaced with `balancePriority` |
| Unstable `getPriority` | Wrapped in `useCallback` |
| Weak `any` type | Replaced with `Blockchain` union type |
| Filtering logic | Use `amount > 0` |
| `formattedBalances` re-run | Memoized with `useMemo` |
| Bad list key | Changed from `index` to `currency` |
| Wrong type assumption | Use correct `FormattedWalletBalance[]` |
