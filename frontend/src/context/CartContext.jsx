import { createContext, useContext, useReducer, useCallback, useMemo } from 'react';

const CartContext = createContext(null);

const ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QTY: 'UPDATE_QTY',
  CLEAR_CART: 'CLEAR_CART',
};

function cartReducer(state, action) {
  switch (action.type) {
    case ACTIONS.ADD_ITEM: {
      const existing = state.items.find(
        (item) => item._id === action.payload._id
      );
      if (existing) {
        return {
          ...state,
          items: state.items.map((item) =>
            item._id === action.payload._id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: 1 }],
      };
    }

    case ACTIONS.REMOVE_ITEM:
      return {
        ...state,
        items: state.items.filter((item) => item._id !== action.payload),
      };

    case ACTIONS.UPDATE_QTY: {
      const { id, quantity } = action.payload;
      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((item) => item._id !== id),
        };
      }
      return {
        ...state,
        items: state.items.map((item) =>
          item._id === id ? { ...item, quantity } : item
        ),
      };
    }

    case ACTIONS.CLEAR_CART:
      return { ...state, items: [] };

    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  const addItem = useCallback((item) => {
    dispatch({ type: ACTIONS.ADD_ITEM, payload: item });
  }, []);

  const removeItem = useCallback((id) => {
    dispatch({ type: ACTIONS.REMOVE_ITEM, payload: id });
  }, []);

  const updateQty = useCallback((id, quantity) => {
    dispatch({ type: ACTIONS.UPDATE_QTY, payload: { id, quantity } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_CART });
  }, []);

  const totalItems = useMemo(
    () => state.items.reduce((sum, item) => sum + item.quantity, 0),
    [state.items]
  );

  const totalPrice = useMemo(
    () => state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [state.items]
  );

  const value = useMemo(
    () => ({
      items: state.items,
      addItem,
      removeItem,
      updateQty,
      clearCart,
      totalItems,
      totalPrice,
    }),
    [state.items, addItem, removeItem, updateQty, clearCart, totalItems, totalPrice]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
