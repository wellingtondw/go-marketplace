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

      if (!!productsList) {
        setProducts(JSON.parse(productsList));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const product = products.find(
        product => product.id === id && (product.quantity += 1),
      );

      const productsList = products.map(productItem => {
        if (productItem.id === id) {
          return product;
        }

        return productItem;
      });

      setProducts(productsList);
      await AsyncStorage.setItem('@products', JSON.stringify(products));
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const product = products.find(product => {
        if (product.id === id) {
          product.quantity -= 1;

          return product;
        }
      });

      const productsList = products.map(productItem => {
        if (productItem.id === id) {
          return product;
        }

        return productItem;
      });

      const index = productsList.indexOf(product);

      if (index > -1 && product?.quantity < 1) {
        productsList.splice(index, 1);
      }

      setProducts(productsList);
      await AsyncStorage.setItem('@products', JSON.stringify(productsList));
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const productAlreadyExists = products.find(
        productItem => productItem.id === product.id,
      );

      if (!!productAlreadyExists) {
        increment(product.id);
        return;
      }

      setProducts(oldProducts => [...oldProducts, { ...product, quantity: 1 }]);

      await AsyncStorage.setItem(
        '@products',
        JSON.stringify([...products, product]),
      );
    },
    [increment, products],
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
