"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowUpDown, Loader2, AlertCircle, TrendingUp } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

interface TokenPrice {
  currency: string
  date: string
  price: number
}

interface Token {
  currency: string
  price: number
  iconUrl: string
}

export default function CurrencySwapForm() {
  const [tokens, setTokens] = useState<Token[]>([])
  const [fromToken, setFromToken] = useState<string>("")
  const [toToken, setToToken] = useState<string>("")
  const [fromAmount, setFromAmount] = useState<string>("")
  const [toAmount, setToAmount] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPrices, setIsLoadingPrices] = useState(true)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [exchangeRate, setExchangeRate] = useState<number>(0)
  const [fromSearchTerm, setFromSearchTerm] = useState<string>("")
  const [toSearchTerm, setToSearchTerm] = useState<string>("")

  // Fetch token prices from the API
  useEffect(() => {
    const fetchTokenPrices = async () => {
      try {
        setIsLoadingPrices(true)
        const response = await fetch("https://interview.switcheo.com/prices.json")
        const data: TokenPrice[] = await response.json()

        // Get the latest price for each currency
        const latestPrices = new Map<string, number>()
        data.forEach((item) => {
          const existing = latestPrices.get(item.currency)
          if (!existing || new Date(item.date) > new Date(existing.toString())) {
            latestPrices.set(item.currency, item.price)
          }
        })

        // Create tokens array with icons
        const tokensWithPrices: Token[] = Array.from(latestPrices.entries())
          .filter(([currency, price]) => price > 0) // Only include tokens with prices
          .map(([currency, price]) => ({
            currency,
            price,
            iconUrl: `https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/${currency}.svg`,
          }))
          .sort((a, b) => a.currency.localeCompare(b.currency))

        setTokens(tokensWithPrices)

        // Set default tokens if available
        if (tokensWithPrices.length > 0) {
          setFromToken(tokensWithPrices[0].currency)
          if (tokensWithPrices.length > 1) {
            setToToken(tokensWithPrices[1].currency)
          }
        }
      } catch (error) {
        console.error("Failed to fetch token prices:", error)
        setErrors({ api: "Failed to load token prices. Please try again later." })
      } finally {
        setIsLoadingPrices(false)
      }
    }

    fetchTokenPrices()
  }, [])

  // Calculate exchange rate when tokens change
  useEffect(() => {
    if (fromToken && toToken && tokens.length > 0) {
      const fromPrice = tokens.find((t) => t.currency === fromToken)?.price || 0
      const toPrice = tokens.find((t) => t.currency === toToken)?.price || 0

      if (fromPrice > 0 && toPrice > 0) {
        const rate = fromPrice / toPrice
        setExchangeRate(rate)

        // Update toAmount if fromAmount exists
        if (fromAmount && !isNaN(Number(fromAmount))) {
          setToAmount((Number(fromAmount) * rate).toFixed(8))
        }
      }
    }
  }, [fromToken, toToken, fromAmount, tokens])

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!fromAmount || fromAmount === "0") {
      newErrors.fromAmount = "Please enter an amount to swap"
    } else if (isNaN(Number(fromAmount)) || Number(fromAmount) <= 0) {
      newErrors.fromAmount = "Please enter a valid positive number"
    } else if (Number(fromAmount) > 1000000) {
      newErrors.fromAmount = "Amount too large for this demo"
    }

    if (fromToken === toToken) {
      newErrors.currency = "Please select different tokens"
    }

    if (!fromToken || !toToken) {
      newErrors.currency = "Please select both tokens"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value)
    if (value && !isNaN(Number(value)) && exchangeRate) {
      setToAmount((Number(value) * exchangeRate).toFixed(8))
    } else {
      setToAmount("")
    }
    // Clear errors when user starts typing
    if (errors.fromAmount) {
      setErrors((prev) => ({ ...prev, fromAmount: "" }))
    }
  }

  const handleSwapTokens = () => {
    const tempToken = fromToken
    setFromToken(toToken)
    setToToken(tempToken)

    const tempAmount = fromAmount
    setFromAmount(toAmount)
    setToAmount(tempAmount)

    // Clear search terms when swapping
    setFromSearchTerm("")
    setToSearchTerm("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    // Simulate API call with timeout (as suggested in requirements)
    try {
      await new Promise((resolve) => setTimeout(resolve, 2500))

      // Simulate success
      alert(`Successfully swapped ${fromAmount} ${fromToken} for ${toAmount} ${toToken}!`)

      // Reset form
      setFromAmount("")
      setToAmount("")
    } catch (error) {
      setErrors({ submit: "Swap failed. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const fromTokenData = tokens.find((t) => t.currency === fromToken)
  const toTokenData = tokens.find((t) => t.currency === toToken)

  if (isLoadingPrices) {
    return (
      <Card className="w-full shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading token prices...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="text-center pb-4">
        <CardTitle className="flex items-center justify-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Token Swap
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {errors.api && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.api}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* From Token Section */}
          <div className="space-y-2">
            <Label htmlFor="from-amount">From</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  id="from-amount"
                  type="number"
                  placeholder="0.00000000"
                  value={fromAmount}
                  onChange={(e) => handleFromAmountChange(e.target.value)}
                  className={`text-lg ${errors.fromAmount ? "border-red-500" : ""}`}
                  step="any"
                />
                {errors.fromAmount && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.fromAmount}
                  </p>
                )}
              </div>
              <Select
                value={fromToken}
                onValueChange={(value) => {
                  setFromToken(value)
                  setFromSearchTerm("")
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select token" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      placeholder="Search tokens..."
                      value={fromSearchTerm}
                      onChange={(e) => setFromSearchTerm(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {tokens
                      .filter((token) => token.currency.toLowerCase().includes(fromSearchTerm.toLowerCase()))
                      .map((token) => (
                        <SelectItem key={token.currency} value={token.currency}>
                          <div className="flex items-center gap-2">
                            <img
                              src={token.iconUrl || "/placeholder.svg"}
                              alt={token.currency}
                              className="w-5 h-5"
                              onError={(e) => {
                                e.currentTarget.style.display = "none"
                              }}
                            />
                            <span>{token.currency}</span>
                          </div>
                        </SelectItem>
                      ))}
                    {tokens.filter((token) => token.currency.toLowerCase().includes(fromSearchTerm.toLowerCase()))
                      .length === 0 &&
                      fromSearchTerm && <div className="p-2 text-sm text-gray-500 text-center">No tokens found</div>}
                  </div>
                </SelectContent>
              </Select>
            </div>
            {fromTokenData && (
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Price: ${fromTokenData.price.toFixed(8)}</span>
                <Badge variant="outline" className="text-xs">
                  {fromTokenData.currency}
                </Badge>
              </div>
            )}
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleSwapTokens}
              className="rounded-full border-2 hover:bg-blue-50 hover:border-blue-300 transition-colors bg-transparent"
              disabled={!fromToken || !toToken}
            >
              <ArrowUpDown className="w-4 h-4" />
            </Button>
          </div>

          {/* To Token Section */}
          <div className="space-y-2">
            <Label htmlFor="to-amount">To</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  id="to-amount"
                  type="number"
                  placeholder="0.00000000"
                  value={toAmount}
                  readOnly
                  className="text-lg bg-gray-50"
                />
              </div>
              <Select
                value={toToken}
                onValueChange={(value) => {
                  setToToken(value)
                  setToSearchTerm("")
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select token" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      placeholder="Search tokens..."
                      value={toSearchTerm}
                      onChange={(e) => setToSearchTerm(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {tokens
                      .filter((token) => token.currency.toLowerCase().includes(toSearchTerm.toLowerCase()))
                      .map((token) => (
                        <SelectItem key={token.currency} value={token.currency}>
                          <div className="flex items-center gap-2">
                            <img
                              src={token.iconUrl || "/placeholder.svg"}
                              alt={token.currency}
                              className="w-5 h-5"
                              onError={(e) => {
                                e.currentTarget.style.display = "none"
                              }}
                            />
                            <span>{token.currency}</span>
                          </div>
                        </SelectItem>
                      ))}
                    {tokens.filter((token) => token.currency.toLowerCase().includes(toSearchTerm.toLowerCase()))
                      .length === 0 &&
                      toSearchTerm && <div className="p-2 text-sm text-gray-500 text-center">No tokens found</div>}
                  </div>
                </SelectContent>
              </Select>
            </div>
            {toTokenData && (
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Price: ${toTokenData.price.toFixed(8)}</span>
                <Badge variant="outline" className="text-xs">
                  {toTokenData.currency}
                </Badge>
              </div>
            )}
          </div>

          {/* Exchange Rate */}
          {exchangeRate > 0 && fromToken && toToken && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                1 {fromToken} = {exchangeRate.toFixed(8)} {toToken}
              </p>
            </div>
          )}

          {/* Error Messages */}
          {errors.currency && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.currency}</AlertDescription>
            </Alert>
          )}

          {errors.submit && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
            disabled={isLoading || !fromToken || !toToken}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing Swap...
              </>
            ) : (
              "Swap Tokens"
            )}
          </Button>
        </form>

        {/* Additional Info */}
        <div className="text-center text-xs text-gray-500 space-y-1">
          <p>• Prices fetched from Switcheo API</p>
          <p>• This is a demo - no real transactions</p>
          <p>• {tokens.length} tokens available for swap</p>
        </div>
      </CardContent>
    </Card>
  )
}
