import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const ASYNCSTORAGE_KEY = '@GM:products';

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storedProducts = await AsyncStorage.getItem(ASYNCSTORAGE_KEY);

      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const newProducts = products.map(prod => {
        if (prod.id !== id) {
          return prod;
        }
        return { ...prod, quantity: 1 + prod.quantity };
      });

      setProducts(newProducts);
      await AsyncStorage.setItem(ASYNCSTORAGE_KEY, JSON.stringify(newProducts));
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const inCartProduct = products.find(prod => prod.id === product.id);

      if (inCartProduct) {
        increment(inCartProduct.id);
        return;
      }

      const { id, title, image_url, price } = product;

      const newProducts = [
        ...products,
        { quantity: 1, id, title, image_url, price },
      ];
      setProducts(newProducts);
      await AsyncStorage.setItem(ASYNCSTORAGE_KEY, JSON.stringify(newProducts));
    },
    [products, increment],
  );

  const decrement = useCallback(
    async id => {
      const newProducts = products
        .map(prod => {
          if (prod.id !== id) {
            return prod;
          }
          return prod.quantity === 1
            ? null
            : { ...prod, quantity: prod.quantity - 1 };
        })
        .filter(prod => prod !== null);

      setProducts(newProducts);
      await AsyncStorage.setItem(ASYNCSTORAGE_KEY, JSON.stringify(newProducts));
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
