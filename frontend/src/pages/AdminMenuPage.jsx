import { useState, useEffect } from 'react';
import api from '../api/axios';

const CATEGORIES = ['Snacks', 'Drinks', 'Combos', 'Desserts', 'Main Course'];

export default function AdminMenuPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState('All');
  const [search, setSearch] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Snacks',
    isVeg: true,
    available: true,
    image: '',
  });

  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/menu');
      const list = data.items || data;
      setItems(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load menu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setForm({
      name: '',
      description: '',
      price: '',
      category: 'Snacks',
      isVeg: true,
      available: true,
      image: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setForm({
      name: item.name || '',
      description: item.description || '',
      price: item.price || '',
      category: item.category || 'Snacks',
      isVeg: item.isVeg !== false,
      available: item.available !== false,
      image: item.image || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        price: Number(form.price),
      };

      if (editingItem) {
        await api.put(`/api/menu/${editingItem._id}`, payload);
      } else {
        await api.post('/api/menu', payload);
      }

      setIsModalOpen(false);
      fetchItems();
    } catch (err) {
      alert(err.message || 'Failed to save menu item');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item from the cinema menu?')) return;
    try {
      await api.delete(`/api/menu/${id}`);
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete item');
    }
  };

  const handleToggle = async (item) => {
    try {
      const newStatus = !item.available;
      await api.put(`/api/menu/${item._id}`, { available: newStatus });
      setItems((prev) =>
        prev.map((i) => (i._id === item._id ? { ...i, available: newStatus } : i))
      );
    } catch {
      alert('Failed to update status');
    }
  };

  const filtered = items.filter((it) => {
    const matchesCat = selectedCat === 'All' || it.category?.toLowerCase() === selectedCat.toLowerCase();
    const matchesSearch = it.name?.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            Concessions &amp; Menu Catalog
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Manage food &amp; beverage items, images, live pricing, and stock availability
          </p>
        </div>

        <button
          onClick={openAddModal}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 800,
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          ＋ Add Concession Item
        </button>
      </div>

      {/* Filter and search bar */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['All', ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '20px',
                border: '1px solid var(--border)',
                background: selectedCat === cat ? 'var(--accent)' : 'transparent',
                color: selectedCat === cat ? '#fff' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '0.5rem 0.85rem',
            background: 'var(--bg-input)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            color: '#fff',
            fontSize: '0.85rem',
            minWidth: 220,
          }}
        />
      </div>

      {/* Menu items table */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading items...</p>
        ) : filtered.length === 0 ? (
          <p style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No items found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', background: 'var(--bg-secondary)' }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Item</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Category</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Price</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Availability</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <img
                          src={item.image || 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=100&q=80'}
                          alt={item.name}
                          style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', background: '#334155' }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ color: item.isVeg ? '#22c55e' : '#ef4444' }}>●</span>
                            <span>{item.name}</span>
                          </div>
                          {item.description && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-secondary)' }}>
                      {item.category}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', fontWeight: 800, color: 'var(--accent)' }}>
                      ₹{item.price}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={item.available !== false}
                          onChange={() => handleToggle(item)}
                          style={{ width: 16, height: 16, cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '0.8rem', color: item.available !== false ? 'var(--success)' : 'var(--danger)' }}>
                          {item.available !== false ? 'Active' : 'Sold Out'}
                        </span>
                      </label>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => openEditModal(item)}
                          style={{
                            padding: '0.35rem 0.75rem',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            color: '#fff',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          style={{
                            padding: '0.35rem 0.75rem',
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid var(--danger)',
                            color: '#fca5a5',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              maxWidth: 520,
              width: '100%',
              padding: '1.75rem',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                {editingItem ? 'Edit Concession Item' : 'Add New Concession Item'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.1rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600 }}>Item Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Cheese Nachos"
                  style={{ width: '100%', padding: '0.65rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px', color: '#fff', marginTop: '0.25rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600 }}>Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Short description of the item"
                  style={{ width: '100%', padding: '0.65rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px', color: '#fff', marginTop: '0.25rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600 }}>Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="250"
                    style={{ width: '100%', padding: '0.65rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px', color: '#fff', marginTop: '0.25rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600 }}>Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px', color: '#fff', marginTop: '0.25rem' }}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600 }}>Image URL</label>
                <input
                  type="url"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  style={{ width: '100%', padding: '0.65rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px', color: '#fff', marginTop: '0.25rem' }}
                />
                {form.image && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Preview:</span>
                    <img src={form.image} alt="Preview" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '2rem', margin: '0.5rem 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: '#cbd5e1' }}>
                  <input
                    type="checkbox"
                    checked={form.isVeg}
                    onChange={(e) => setForm({ ...form, isVeg: e.target.checked })}
                  />
                  <span>Pure Vegetarian (Green)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: '#cbd5e1' }}>
                  <input
                    type="checkbox"
                    checked={form.available}
                    onChange={(e) => setForm({ ...form, available: e.target.checked })}
                  />
                  <span>In Stock</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '0.65rem 1.25rem', background: 'transparent', border: '1px solid var(--border)', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.65rem 1.5rem', background: 'var(--accent)', border: 'none', color: '#000', borderRadius: '6px', fontWeight: 800, cursor: 'pointer' }}
                >
                  {editingItem ? 'Update Item' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

