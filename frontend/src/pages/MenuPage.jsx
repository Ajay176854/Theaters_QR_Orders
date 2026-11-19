import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Header from '../components/Header';
import MenuItem from '../components/MenuItem';
import Loader from '../components/Loader';
import { useCart } from '../context/CartContext';
import '../styles/MenuPage.css';

export default function MenuPage() {
  const { theaterId } = useParams();
  const navigate = useNavigate();
  const { totalItems, totalPrice } = useCart();

  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchMenu() {
      try {
        setLoading(true);
        const { data } = await api.get(`/api/menu/${theaterId}`);
        const items = data.menu || data.items || data;
        setMenuItems(Array.isArray(items) ? items : []);
      } catch (err) {
        setError(err.message || 'Failed to load menu');
      } finally {
        setLoading(false);
      }
    }
    fetchMenu();
  }, [theaterId]);

  // Derive unique categories from items
  const categories = useMemo(() => {
    const cats = new Set(menuItems.map((item) => item.category?.toLowerCase() || 'other'));
    return ['all', ...Array.from(cats)];
  }, [menuItems]);

  // Filter items by category and search
  const filteredItems = useMemo(() => {
    let items = menuItems;

    if (activeCategory !== 'all') {
      items = items.filter(
        (item) => (item.category?.toLowerCase() || 'other') === activeCategory
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q))
      );
    }

    return items;
  }, [menuItems, activeCategory, searchQuery]);

  const handleViewCart = () => navigate('/cart');

  if (loading) return <Loader text="Loading concession menu..." />;

  return (
    <div className="menu-page">
      <Header />

      {/* Search bar */}
      <div className="menu-page__search-wrapper">
        <div className="menu-page__search">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: '18px', height: '18px', flexShrink: 0 }}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search popcorn, beverages, combos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="menu-page__search-input"
          />
          {searchQuery && (
            <button
              className="menu-page__search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Category tabs */}
      <div className="menu-page__categories">
        <div className="menu-page__categories-scroll">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`menu-page__cat-tab ${
                activeCategory === cat ? 'active' : ''
              }`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat === 'all' ? 'All Concessions' : formatCategoryLabel(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="menu-page__error">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      {/* Menu grid */}
      <div className="menu-page__grid">
        {filteredItems.length === 0 && !error ? (
          <div className="menu-page__empty">
            <div className="menu-page__empty-badge">GRANDÉ MUTHURAM CONCESSIONS</div>
            <p className="menu-page__empty-title">No menu items found</p>
            <p className="menu-page__empty-desc">Try selecting another category or clear your search.</p>
          </div>
        ) : (
          filteredItems.map((item, index) => (
            <div
              key={item._id || index}
              className="menu-page__item-wrapper"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <MenuItem item={item} />
            </div>
          ))
        )}
      </div>

      {/* Floating cart bar */}
      {totalItems > 0 && (
        <div className="menu-page__cart-bar" onClick={handleViewCart}>
          <div className="menu-page__cart-bar-left">
            <span className="menu-page__cart-bar-count">{totalItems} Item{totalItems > 1 ? 's' : ''} Added</span>
            <span className="menu-page__cart-bar-total">₹{totalPrice}</span>
          </div>
          <div className="menu-page__cart-bar-right">
            <span>Review Cart</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '18px', height: '18px' }}>
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}

function formatCategoryLabel(str) {
  if (!str) return '';
  if (str === 'main course' || str === 'main_course') return 'Main Course';
  if (str === 'ice_cream') return 'Ice Creams';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
