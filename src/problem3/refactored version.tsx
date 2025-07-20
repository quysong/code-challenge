interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: Blockchain; // added missing blockchain field for priority logic
}

interface FormattedWalletBalance extends WalletBalance {
  formatted: string; // added formatted string to avoid recalculating on each render
}

type Blockchain = 'Osmosis' | 'Ethereum' | 'Arbitrum' | 'Zilliqa' | 'Neo' | string; // used union type instead of `any`

const WalletPage: React.FC<Props> = (props) => {
  const { children, ...rest } = props;
  const balances = useWalletBalances(); // clear separation of data fetching
  const prices = usePrices();

  // Memoized getPriority to avoid redefining on every render
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

  // Filter and sort are memoized together — improves perf and avoids redundant processing
  const sortedBalances = useMemo(() => {
    return balances
      .filter((b) => getPriority(b.blockchain) > -99 && b.amount > 0) // clean logic: remove zero/irrelevant balances
      .sort((a, b) => getPriority(b.blockchain) - getPriority(a.blockchain)); // priority-based sort
  }, [balances, getPriority]);

  // Memoize derived display values for better readability and future perf
  const formattedBalances = useMemo((): FormattedWalletBalance[] => {
    return sortedBalances.map((b) => ({
      ...b,
      formatted: b.amount.toFixed() // formatting extracted into a display field
    }));
  }, [sortedBalances]);

  // Memoize final JSX rows and safely use `currency` as key (not index)
  const rows = useMemo(() => {
    return formattedBalances.map((b) => {
      const usdValue = prices[b.currency] * b.amount; // efficient lookup, could guard with fallback (e.g. ?? 0)
      return (
        <WalletRow
          key={b.currency} // replaced index key with stable unique key
          className={classes.row}
          amount={b.amount}
          usdValue={usdValue}
          formattedAmount={b.formatted}
        />
      );
    });
  }, [formattedBalances, prices]);

  return <div {...rest}>{rows}</div>; // render only what's needed, clean structure
};
