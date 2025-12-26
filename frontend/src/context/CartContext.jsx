import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

const STORAGE_KEY = 'cart'

const safeParse = (value, fallback) => {
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([])
  const { isAuthenticated, loading } = useAuth()

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) setItems(safeParse(raw, []))
  }, [])

  useEffect(() => {
    // Requirement: cart must be empty after logout and next login.
    // Only enforce after auth has finished hydrating from localStorage.
    if (!loading && !isAuthenticated) {
      setItems([])
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [isAuthenticated, loading])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addToCart = (isbn, quantity = 1) => {
    if (!isbn) return

    setItems((prev) => {
      const existing = prev.find((i) => i.isbn === isbn)
      if (existing) {
        return prev.map((i) => (i.isbn === isbn ? { ...i, quantity: i.quantity + quantity } : i))
      }
      return [...prev, { isbn, quantity }]
    })

    toast.success('Added to cart')
  }

  const removeFromCart = (isbn) => {
    setItems((prev) => prev.filter((i) => i.isbn !== isbn))
  }

  const setQuantity = (isbn, quantity) => {
    const q = Number.isFinite(quantity) ? quantity : parseInt(quantity)
    if (!isbn) return
    if (!q || q < 1) return

    setItems((prev) => prev.map((i) => (i.isbn === isbn ? { ...i, quantity: q } : i)))
  }

  const clearCart = () => setItems([])

  const count = useMemo(() => items.reduce((acc, i) => acc + (i.quantity || 0), 0), [items])

  const value = {
    items,
    count,
    addToCart,
    removeFromCart,
    setQuantity,
    clearCart
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
