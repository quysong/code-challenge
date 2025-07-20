import CurrencySwapForm from "@/components/currency-swap-form"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="container mx-auto max-w-md pt-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Currency Swap</h1>
          <p className="text-gray-600">Exchange your tokens instantly</p>
        </div>
        <CurrencySwapForm />
      </div>
    </main>
  )
}
