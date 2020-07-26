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

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsList = await AsyncStorage.getItem('@products');

      if (productsList) {
        setProducts(JSON.parse(productsList));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const newProducts = [...products];

      const index = newProducts.findIndex(product => product.id === id);
      newProducts[index].quantity += 1;

      setProducts(newProducts);

      await AsyncStorage.setItem('@products', JSON.stringify(newProducts));
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const newProducts = [...products];
      const index = newProducts.findIndex(product => product.id === id);

      if (newProducts[index].quantity === 1) {
        const productsFilter = newProducts.filter(product => product.id !== id);
        setProducts(productsFilter);
        await AsyncStorage.setItem('@products', JSON.stringify(productsFilter));
      } else {
        newProducts[index].quantity -= 1;
        setProducts(newProducts);
        await AsyncStorage.setItem('@products', JSON.stringify(newProducts));
      }
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const productExists = products.find(p => p.id === product.id);

      if (productExists) {
        increment(product.id);
      } else {
        const newProductsArr = [...products, { ...product, quantity: 1 }];
        setProducts(newProductsArr);

        await AsyncStorage.setItem('@products', JSON.stringify(newProductsArr));
      }
    },
    [products, increment],
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
