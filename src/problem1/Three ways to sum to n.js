// sum_to_n_a: Mathematical formula (O(1))
var sum_to_n_a = function(n) {
  return (n * (n + 1)) / 2;
};

// ------------------------------------------------------------

// sum_to_n_b: Iterative loop (O(n))
var sum_to_n_b = function(n) {
  let sum = 0;
  for (let i = 1; i <= n; i++) {
    sum += i;
  }
  return sum;
};

// sum_to_n_c: Recursive approach (O(n) stack)
var sum_to_n_c = function(n) {
  if (n <= 1) return n;
  return n + sum_to_n_c(n - 1);
};
