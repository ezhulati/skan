import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface MenuItem {
  id: string;
  name: string;
  nameEn: string;
  price: number;
  isActive: boolean;
  categoryId: string;
  imageUrl?: string;
}

interface MenuCategory {
  id: string;
  name: string;
  nameEn: string;
  items: MenuItem[];
}

const MenuManagementPage: React.FC = () => {
  const { auth } = useAuth();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryNameEn, setNewCategoryNameEn] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddItem, setShowAddItem] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({
    name: '',
    nameEn: '',
    price: '',
    isActive: true,
    imageUrl: ''
  });
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);

  const baseUrl = process.env.REACT_APP_API_URL || 'https://api-mkazmlu7ta-ew.a.run.app/v1';

  // Image upload helper function
  const uploadImage = async (file: File): Promise<string> => {
    // For now, we'll use a simple base64 approach or placeholder
    // In production, this would upload to Firebase Storage or similar
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (file: File, itemId?: string): Promise<string> => {
    setUploadingImage(itemId || 'new');
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Ju mund të ngarkoni vetëm imazhe');
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Imazhi duhet të jetë më i vogël se 5MB');
      }
      
      const imageUrl = await uploadImage(file);
      return imageUrl;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Dështoi ngarkimi i imazhit');
      throw error;
    } finally {
      setUploadingImage(null);
    }
  };

  const loadMenu = useCallback(async () => {
    try {
      setError(null);
      
      // Use venue slug from authenticated user, fallback to demo venue
      const venueSlug = auth.venue?.slug || 'beach-bar-durres';
      console.log('Loading menu for venue:', venueSlug);
      console.log('Auth venue:', auth.venue);
      console.log('API URL:', `${baseUrl}/venue/${venueSlug}/menu`);
      
      // Use venue slug from authenticated user
      const response = await fetch(`${baseUrl}/venue/${venueSlug}/menu`);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error('Dështoi të ngarkoj menunë');
      }
      
      const data = await response.json();
      console.log('Menu data:', data);
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Error loading menu:', err);
      setError('Dështoi të ngarkoj menunë');
    } finally {
      setLoading(false);
    }
  }, [baseUrl, auth.venue]);

  useEffect(() => {
    console.log('MenuManagementPage: Auth state changed:', auth);
    loadMenu();
  }, [loadMenu, auth]);

  const addCategory = async () => {
    if (!newCategoryName.trim() || !newCategoryNameEn.trim()) return;

    try {
      // Use demo venue ID for now - should match what user is logged in as
      const venueId = auth.user?.venueId || 'demo-venue-1';
      const url = `${baseUrl}/venue/${venueId}/categories`;
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: newCategoryName,
          nameEn: newCategoryNameEn
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to add category: ${response.status} - ${errorText}`);
      }

      await loadMenu();
      setNewCategoryName('');
      setNewCategoryNameEn('');
      setShowAddCategory(false);
    } catch (err) {
      console.error('Error adding category:', err);
      alert('Dështoi të shtoj kategorinë');
    }
  };

  const updateCategory = async (categoryId: string, name: string, nameEn: string) => {
    try {
      const response = await fetch(`${baseUrl}/venue/${auth.user?.venueId}/categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, nameEn })
      });

      if (!response.ok) throw new Error('Dështoi të përditësoj kategorinë');

      await loadMenu();
      setEditingCategory(null);
    } catch (err) {
      console.error('Error updating category:', err);
      alert('Dështoi të përditësoj kategorinë');
    }
  };

  const deleteCategory = async (categoryId: string) => {
    // eslint-disable-next-line no-restricted-globals
    if (!window.confirm('A jeni të sigurt që doni të fshini këtë kategori dhe të gjitha artikujt e saj?')) return;

    try {
      const headers: HeadersInit = {};
      
      if (auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      }
      
      const response = await fetch(`${baseUrl}/venue/${auth.user?.venueId}/categories/${categoryId}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) throw new Error('Dështoi të fshij kategorinë');

      await loadMenu();
    } catch (err) {
      console.error('Error deleting category:', err);
      alert('Dështoi të fshij kategorinë');
    }
  };

  const addItem = async (categoryId: string) => {
    if (!newItem.name.trim() || !newItem.nameEn.trim() || !newItem.price) return;

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      }
      
      const response = await fetch(`${baseUrl}/venue/${auth.user?.venueId}/categories/${categoryId}/items`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: newItem.name,
          nameEn: newItem.nameEn,
          price: parseFloat(newItem.price),
          isActive: newItem.isActive,
          imageUrl: newItem.imageUrl || undefined
        })
      });

      if (!response.ok) throw new Error('Dështoi të shtoj artikullin');

      await loadMenu();
      setNewItem({ name: '', nameEn: '', price: '', isActive: true, imageUrl: '' });
      setShowAddItem(null);
    } catch (err) {
      console.error('Error adding item:', err);
      alert('Dështoi të shtoj artikullin');
    }
  };

  const updateItem = async (categoryId: string, itemId: string, updates: Partial<MenuItem>) => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      }
      
      const response = await fetch(`${baseUrl}/venue/${auth.user?.venueId}/categories/${categoryId}/items/${itemId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error('Dështoi të përditësoj artikullin');

      await loadMenu();
      setEditingItem(null);
    } catch (err) {
      console.error('Error updating item:', err);
      alert('Dështoi të përditësoj artikullin');
    }
  };

  const deleteItem = async (categoryId: string, itemId: string) => {
    // eslint-disable-next-line no-restricted-globals
    if (!window.confirm('A jeni të sigurt që doni të fshini këtë artikull menuje?')) return;

    try {
      const headers: HeadersInit = {};
      
      if (auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      }
      
      const response = await fetch(`${baseUrl}/venue/${auth.user?.venueId}/categories/${categoryId}/items/${itemId}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) throw new Error('Dështoi të fshij artikullin');

      await loadMenu();
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('Dështoi të fshij artikullin');
    }
  };

  const toggleItemActive = async (categoryId: string, itemId: string, isActive: boolean) => {
    await updateItem(categoryId, itemId, { isActive });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Duke ngarkuar menunë...</p>
      </div>
    );
  }

  return (
    <div className="menu-management-page">
      <header className="page-header">
        <div className="header-left">
          <h1>Menaxhimi i Menusë</h1>
          <p>Menaxhoni kategoritë dhe artikujt e menusë së restorantit tuaj</p>
        </div>
        <div className="header-right">
          <button 
            onClick={() => setShowAddCategory(true)}
            className="add-category-button"
          >
            <svg className="button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Shto Kategori
          </button>
        </div>
      </header>

      {error && (
        <div className="error-message">
          <svg className="error-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
            <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
          </svg>
          {error}
        </div>
      )}

      {showAddCategory && (
        <div className="modal-overlay" onClick={() => setShowAddCategory(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <svg className="modal-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Shto Kategori të Re
              </h3>
            </div>
            <div className="form-group">
              <label>Emri i Kategorisë</label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="p.sh., Pije"
              />
            </div>
            <div className="form-group">
              <label>Emri i Kategorisë (Anglisht)</label>
              <input
                type="text"
                value={newCategoryNameEn}
                onChange={(e) => setNewCategoryNameEn(e.target.value)}
                placeholder="p.sh., Drinks"
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowAddCategory(false)} className="cancel-button">
                <svg className="button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2"/>
                  <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Anulo
              </button>
              <button onClick={addCategory} className="save-button">
                <svg className="button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="categories-container">
        {categories.length === 0 ? (
          <div className="empty-state">
            <p>Nuk ka kategori menuje ende. Shtoni kategorinë tuaj të parë për të filluar!</p>
          </div>
        ) : (
          categories.map((category) => (
            <div key={category.id} className="category-card">
              <div className="category-header">
                {editingCategory === category.id ? (
                  <CategoryEditor
                    category={category}
                    onSave={(name, nameEn) => updateCategory(category.id, name, nameEn)}
                    onCancel={() => setEditingCategory(null)}
                  />
                ) : (
                  <>
                    <div className="category-info">
                      <h2>{category.name}</h2>
                      <p className="category-subtitle">{category.nameEn}</p>
                    </div>
                    <div className="category-actions">
                      <button 
                        onClick={() => setEditingCategory(category.id)}
                        className="edit-button"
                      >
                        <svg className="button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Ndrysho
                      </button>
                      <button 
                        onClick={() => setShowAddItem(category.id)}
                        className="add-item-button"
                      >
                        <svg className="button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                          <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        Shto Artikull
                      </button>
                      <button 
                        onClick={() => deleteCategory(category.id)}
                        className="delete-button"
                      >
                        <svg className="button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="2"/>
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" stroke="currentColor" strokeWidth="2"/>
                          <line x1="10" y1="11" x2="10" y2="17" stroke="currentColor" strokeWidth="2"/>
                          <line x1="14" y1="11" x2="14" y2="17" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        Fshij
                      </button>
                    </div>
                  </>
                )}
              </div>

              {showAddItem === category.id && (
                <div className="add-item-form">
                  <h4>Shto Artikull të Ri</h4>
                  <div className="item-form-grid">
                    <input
                      type="text"
                      placeholder="Emri i artikullit"
                      value={newItem.name}
                      onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    />
                    <input
                      type="text"
                      placeholder="Emri i artikullit (Anglisht)"
                      value={newItem.nameEn}
                      onChange={(e) => setNewItem({...newItem, nameEn: e.target.value})}
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Çmimi"
                      value={newItem.price}
                      onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                    />
                    <div className="form-group">
                      <label>Imazhi i Artikullit (Opsional)</label>
                      <div className="image-upload-container">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const imageUrl = await handleImageUpload(file);
                                setNewItem({...newItem, imageUrl});
                              } catch (error) {
                                // Error already handled in handleImageUpload
                              }
                            }
                          }}
                          disabled={uploadingImage === 'new'}
                          className="image-input"
                        />
                        {uploadingImage === 'new' && (
                          <div className="upload-progress">
                            <svg className="spinner" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="32" strokeDashoffset="32">
                                <animate attributeName="stroke-dashoffset" dur="1s" values="32;0;32" repeatCount="indefinite"/>
                              </circle>
                            </svg>
                            Duke ngarkuar...
                          </div>
                        )}
                        {newItem.imageUrl && (
                          <div className="image-preview">
                            <img src={newItem.imageUrl} alt="Preview" />
                            <button 
                              type="button"
                              onClick={() => setNewItem({...newItem, imageUrl: ''})}
                              className="remove-image-button"
                            >
                              <svg viewBox="0 0 24 24" fill="none">
                                <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2"/>
                                <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2"/>
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={newItem.isActive}
                          onChange={(e) => setNewItem({...newItem, isActive: e.target.checked})}
                        />
                        Aktiv
                      </label>
                    </div>
                  </div>
                  <div className="form-actions">
                    <button onClick={() => setShowAddItem(null)} className="cancel-button">
                      <svg className="button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2"/>
                        <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      Anulo
                    </button>
                    <button onClick={() => addItem(category.id)} className="save-button">
                      <svg className="button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Shto Artikullin
                    </button>
                  </div>
                </div>
              )}

              <div className="items-list">
                {category.items.length === 0 ? (
                  <p className="no-items">Nuk ka artikuj në këtë kategori ende.</p>
                ) : (
                  category.items.map((item) => (
                    <div key={item.id} className={`menu-item-card ${!item.isActive ? 'inactive' : ''}`}>
                      {editingItem === item.id ? (
                        <ItemEditor
                          item={item}
                          onSave={(updates) => updateItem(category.id, item.id, updates)}
                          onCancel={() => setEditingItem(null)}
                        />
                      ) : (
                        <>
                          <div className="item-info">
                            <div className="item-header">
                              <h4>{item.name}</h4>
                              {item.imageUrl && (
                                <span className="image-indicator" title="Ka imazh">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                    <circle cx="8.5" cy="8.5" r="1.5"/>
                                    <polyline points="21,15 16,10 5,21"/>
                                  </svg>
                                </span>
                              )}
                            </div>
                            <p className="item-subtitle">{item.nameEn}</p>
                            <p className="item-price">{Math.round(item.price * 97)} Lek</p>
                          </div>
                          <div className="item-status">
                            <label className="toggle-switch">
                              <input
                                type="checkbox"
                                checked={item.isActive}
                                onChange={(e) => toggleItemActive(category.id, item.id, e.target.checked)}
                              />
                              <span className="slider"></span>
                            </label>
                            <span className={`status-text ${item.isActive ? 'active' : 'inactive'}`}>
                              {item.isActive ? 'Aktiv' : 'Joaktiv'}
                            </span>
                          </div>
                          <div className="item-actions">
                            <button 
                              onClick={() => setEditingItem(item.id)}
                              className="edit-button"
                            >
                              <svg className="button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Ndrysho
                            </button>
                            <button 
                              onClick={() => deleteItem(category.id, item.id)}
                              className="delete-button"
                            >
                              <svg className="button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="2"/>
                                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" stroke="currentColor" strokeWidth="2"/>
                                <line x1="10" y1="11" x2="10" y2="17" stroke="currentColor" strokeWidth="2"/>
                                <line x1="14" y1="11" x2="14" y2="17" stroke="currentColor" strokeWidth="2"/>
                              </svg>
                              Fshij
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

const CategoryEditor: React.FC<{
  category: MenuCategory;
  onSave: (name: string, nameEn: string) => void;
  onCancel: () => void;
}> = ({ category, onSave, onCancel }) => {
  const [name, setName] = useState(category.name);
  const [nameEn, setNameEn] = useState(category.nameEn);

  return (
    <div className="category-editor">
      <div className="editor-inputs">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Emri i kategorisë"
        />
        <input
          type="text"
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
          placeholder="Emri i kategorisë (Anglisht)"
        />
      </div>
      <div className="editor-actions">
        <button onClick={onCancel} className="cancel-button">
          <svg className="button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2"/>
            <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2"/>
          </svg>
          Cancel
        </button>
        <button onClick={() => onSave(name, nameEn)} className="save-button">
          <svg className="button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Ruaj
        </button>
      </div>
    </div>
  );
};

const ItemEditor: React.FC<{
  item: MenuItem;
  onSave: (updates: Partial<MenuItem>) => void;
  onCancel: () => void;
}> = ({ item, onSave, onCancel }) => {
  const [name, setName] = useState(item.name);
  const [nameEn, setNameEn] = useState(item.nameEn);
  const [price, setPrice] = useState(item.price.toString());
  const [imageUrl, setImageUrl] = useState(item.imageUrl || '');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImageUpload = async (file: File): Promise<void> => {
    setIsUploadingImage(true);
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Ju mund të ngarkoni vetëm imazhe');
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Imazhi duhet të jetë më i vogël se 5MB');
      }
      
      // Convert to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Dështoi ngarkimi i imazhit');
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <div className="item-editor">
      <div className="editor-inputs">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Emri i artikullit"
        />
        <input
          type="text"
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
          placeholder="Emri i artikullit (Anglisht)"
        />
        <input
          type="number"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Çmimi"
        />
        <div className="form-group">
          <label>Imazhi i Artikullit (Opsional)</label>
          <div className="image-upload-container">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleImageUpload(file);
                }
              }}
              disabled={isUploadingImage}
              className="image-input"
            />
            {isUploadingImage && (
              <div className="upload-progress">
                <svg className="spinner" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="32" strokeDashoffset="32">
                    <animate attributeName="stroke-dashoffset" dur="1s" values="32;0;32" repeatCount="indefinite"/>
                  </circle>
                </svg>
                Duke ngarkuar...
              </div>
            )}
            {imageUrl && (
              <div className="image-preview">
                <img src={imageUrl} alt="Preview" />
                <button 
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="remove-image-button"
                >
                  <svg viewBox="0 0 24 24" fill="none">
                    <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2"/>
                    <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="editor-actions">
        <button onClick={onCancel} className="cancel-button">
          <svg className="button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2"/>
            <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2"/>
          </svg>
          Cancel
        </button>
        <button 
          onClick={() => onSave({ 
            name, 
            nameEn, 
            price: parseFloat(price),
            imageUrl: imageUrl || undefined
          })} 
          className="save-button"
        >
          <svg className="button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Ruaj
        </button>
      </div>
    </div>
  );
};

export default MenuManagementPage;