import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { processImageForUpload, validateImage, MENU_ITEM_RULES } from '../utils/imageValidation';

interface MenuItem {
  id: string;
  name: string;
  nameAlbanian: string;
  description?: string;
  descriptionAlbanian?: string;
  price: number;
  isActive: boolean;
  categoryId: string;
  imageUrl?: string;
}

interface MenuCategory {
  id: string;
  name: string;
  nameAlbanian: string;
  items: MenuItem[];
}

const MenuManagementPage: React.FC = () => {
  const { auth } = useAuth();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryNameAlbanian, setNewCategoryNameAlbanian] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddItem, setShowAddItem] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({
    name: '',
    nameAlbanian: '',
    price: '',
    isActive: true,
    imageUrl: ''
  });
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [translating, setTranslating] = useState<string | null>(null);
  const [hasLocalChanges, setHasLocalChanges] = useState(false); // Track if we have local changes
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const baseUrl = process.env.REACT_APP_API_URL || 'https://api-mkazmlu7ta-ew.a.run.app/v1';

  // Reset demo function
  const resetDemo = async () => {
    setHasLocalChanges(false);
    setMessage('Duke rifreskuar nga API...');
    await loadMenu();
    setMessage('Demo u rifreskua me sukses!');
    setTimeout(() => setMessage(null), 500);
  };


  const handleImageUpload = async (file: File, itemId?: string): Promise<string> => {
    setUploadingImage(itemId || 'new');
    setError(null);
    
    try {
      // Quick validation - only check if it's actually an image
      const validation = await validateImage(file, MENU_ITEM_RULES);
      
      if (!validation.isValid) {
        throw new Error(validation.errors.join('\n'));
      }
      
      // Show positive feedback
      setMessage('✨ Processing and optimizing image...');
      
      // Automatically process the image to perfect size and quality
      const optimizedImageUrl = await processImageForUpload(file);
      
      setMessage('✅ Image optimized successfully!');
      return optimizedImageUrl;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to process image');
      throw error;
    } finally {
      setUploadingImage(null);
    }
  };

  // Translation service function
  const translateText = async (text: string, context: string = 'item'): Promise<string> => {
    if (!text?.trim()) {
      throw new Error('Teksti është i zbrazët');
    }

    try {
      setTranslating(context);

      const response = await fetch(`${baseUrl}/translate/menu-item`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({
          text: text.trim(),
          fromLang: 'sq',
          toLang: 'en'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Përkthimi dështoi');
      }

      const data = await response.json();
      return data.translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      throw error;
    } finally {
      setTranslating(null);
    }
  };

  const loadMenu = useCallback(async () => {
    try {
      setError(null);
      
      // Use venue slug from authenticated user, fallback to demo venue
      // Force use beach-bar-durres since demo venues don't exist in API
      const venueSlug = (auth.venue?.slug && 
                        auth.venue.slug !== 'demo-restaurant' && 
                        auth.venue.slug !== 'demo-venue-1') 
        ? auth.venue.slug 
        : 'beach-bar-durres';
      
      // Use venue slug from authenticated user
      const response = await fetch(`${baseUrl}/venue/${venueSlug}/menu`);
      
      if (!response.ok) {
        throw new Error('Dështoi të ngarkoj menunë');
      }
      
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Error loading menu:', err);
      setError('Dështoi të ngarkoj menunë');
    } finally {
      setLoading(false);
    }
  }, [baseUrl, auth.venue]);

  useEffect(() => {
    // Only load menu on first visit, not when auth changes if we have local changes
    if (!hasLocalChanges) {
      loadMenu();
    }
  }, [loadMenu, auth, hasLocalChanges]);

  const addCategory = async () => {
    if (!newCategoryName.trim() || !newCategoryNameAlbanian.trim()) return;

    try {
      // Use the same venue that we're displaying the menu from
      // For demo, this needs to match beach-bar-durres venue ID
      const venueId = 'beach-bar-durres'; // TODO: Get actual venue ID from slug
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
          nameAlbanian: newCategoryNameAlbanian
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to add category: ${response.status} - ${errorText}`);
      }

      await loadMenu();
      setNewCategoryName('');
      setNewCategoryNameAlbanian('');
      setShowAddCategory(false);
    } catch (err) {
      console.error('Error adding category:', err);
      alert('Dështoi të shtoj kategorinë');
    }
  };

  const updateCategory = async (categoryId: string, name: string, nameAlbanian: string) => {
    try {
      const venueId = auth.venue?.id || 'demo-venue-1';
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      }
      
      const response = await fetch(`${baseUrl}/venue/${venueId}/categories/${categoryId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ name, nameAlbanian })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Dështoi të përditësoj kategorinë');
      }

      await loadMenu();
      setEditingCategory(null);
      setMessage('✅ Kategoria u përditësua me sukses!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error updating category:', err);
      setError(err instanceof Error ? err.message : 'Dështoi të përditësoj kategorinë');
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
      
      const response = await fetch(`${baseUrl}/venue/${'beach-bar-durres'}/categories/${categoryId}`, {
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
    if (!newItem.name.trim() || !newItem.nameAlbanian.trim() || !newItem.price) return;

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      }
      
      const response = await fetch(`${baseUrl}/venue/${'beach-bar-durres'}/categories/${categoryId}/items`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: newItem.nameAlbanian,
          nameEn: newItem.name,
          price: parseFloat(newItem.price),
          isActive: newItem.isActive,
          imageUrl: newItem.imageUrl || undefined
        })
      });

      if (!response.ok) throw new Error('Dështoi të shtoj artikullin');

      await loadMenu();
      setNewItem({ name: '', nameAlbanian: '', price: '', isActive: true, imageUrl: '' });
      setShowAddItem(null);
    } catch (err) {
      console.error('Error adding item:', err);
      alert('Dështoi të shtoj artikullin');
    }
  };

  const updateItem = async (categoryId: string, itemId: string, updates: Partial<MenuItem>) => {
    try {
      // Update local state for demo purposes
      setCategories(prevCategories => 
        prevCategories.map(category => 
          category.id === categoryId 
            ? {
                ...category,
                items: category.items.map(item => 
                  item.id === itemId 
                    ? { ...item, ...updates }
                    : item
                )
              }
            : category
        )
      );
      
      setEditingItem(null);
      setHasLocalChanges(true); // Mark that we have local changes
      setMessage('Artikulli u përditësua me sukses!');
      setTimeout(() => setMessage(null), 500);
      
      // Enable API endpoint for live database updates:
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      }
      
      const response = await fetch(`${baseUrl}/venue/${'beach-bar-durres'}/categories/${categoryId}/items/${itemId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error('Dështoi të përditësoj artikullin');
      await loadMenu();
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
      
      const response = await fetch(`${baseUrl}/venue/${'beach-bar-durres'}/categories/${categoryId}/items/${itemId}`, {
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

      {/* Demo Mode Banner */}
      {hasLocalChanges && (
        <div className="demo-banner">
          <div className="demo-banner-content">
            <div className="demo-info">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4M12 8h.01"/>
              </svg>
              <div>
                <strong>Demo Mode</strong>
                <p>Ju keni bërë ndryshime lokale. Ato ruhen deri sa të rifreskoni nga API.</p>
              </div>
            </div>
            <button onClick={resetDemo} className="reset-demo-button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                <path d="M3 21v-5h5"/>
              </svg>
              Rifresko
            </button>
          </div>
        </div>
      )}

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

      {message && (
        <div className="success-message">
          {message}
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
                value={newCategoryNameAlbanian}
                onChange={(e) => setNewCategoryNameAlbanian(e.target.value)}
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
                    onSave={(name, nameAlbanian) => updateCategory(category.id, name, nameAlbanian)}
                    onCancel={() => setEditingCategory(null)}
                  />
                ) : (
                  <>
                    <div className="category-info">
                      <h2>{category.name}</h2>
                      <p className="category-subtitle">{category.nameAlbanian}</p>
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
                      placeholder="Emri i artikullit (Shqip)"
                      value={newItem.nameAlbanian}
                      onChange={(e) => setNewItem({...newItem, nameAlbanian: e.target.value})}
                    />
                    <div className="name-input-with-translate">
                      <input
                        type="text"
                        placeholder="Emri i artikullit (Anglisht)"
                        value={newItem.name}
                        onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                      />
                      <button
                        type="button"
                        className="translate-button"
                        onClick={async () => {
                          if (!newItem.nameAlbanian.trim()) {
                            alert('Shkruani emrin në shqip së pari');
                            return;
                          }
                          try {
                            const translated = await translateText(newItem.nameAlbanian, 'new-item');
                            setNewItem({...newItem, name: translated});
                            setMessage('Përkthimi u bë me sukses!');
                            setTimeout(() => setMessage(null), 500);
                          } catch (error) {
                            alert(error instanceof Error ? error.message : 'Përkthimi dështoi');
                          }
                        }}
                        disabled={translating === 'new-item' || !newItem.nameAlbanian.trim()}
                        title="Përkthe automatikisht nga shqip në anglisht"
                      >
                        {translating === 'new-item' ? (
                          <svg className="spinner" viewBox="0 0 24 24" width="16" height="16">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="32" strokeDashoffset="32">
                              <animate attributeName="stroke-dashoffset" dur="1s" values="32;0;32" repeatCount="indefinite"/>
                            </circle>
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M2 12h20M9 5l7 7-7 7"/>
                          </svg>
                        )}
                        AI Përkthe
                      </button>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Çmimi"
                      value={newItem.price}
                      onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                    />
                    <div className="form-group">
                      <label>Imazhi i Artikullit (Opsional)</label>
                      <p style={{ fontSize: '14px', color: '#6c757d', margin: '4px 0 8px 0' }}>
                        📸 Just upload any image - we'll automatically optimize it for you!
                      </p>
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
                          <div className="item-display">
                            {item.imageUrl && (
                              <div className="item-image">
                                <img 
                                  src={item.imageUrl} 
                                  alt={item.nameAlbanian || item.name}
                                  style={{
                                    width: '80px',
                                    height: '60px',
                                    objectFit: 'cover',
                                    borderRadius: '8px',
                                    border: '1px solid #e0e0e0',
                                    flexShrink: 0
                                  }}
                                  onClick={() => setViewingImage(item.imageUrl!)}
                                  onError={(e) => {
                                    // Hide image if it fails to load
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                            <div className="item-info">
                              <div className="item-header">
                                <h4>{item.nameAlbanian || item.name}</h4>
                                {item.imageUrl && (
                                  <span className="image-indicator" title="Ka imazh" style={{ color: '#28a745' }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                      <circle cx="8.5" cy="8.5" r="1.5"/>
                                      <polyline points="21,15 16,10 5,21"/>
                                    </svg>
                                  </span>
                                )}
                              </div>
                              <p className="item-subtitle">{item.name}</p>
                              <p className="item-price">{item.price} Lek</p>
                            </div>
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

      {/* Image Viewer Modal */}
      {viewingImage && (
        <div 
          className="image-viewer-modal"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setViewingImage(null)}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img 
              src={viewingImage} 
              alt="Menu item preview"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setViewingImage(null)}
              style={{
                position: 'absolute',
                top: '-10px',
                right: '-10px',
                background: 'rgba(255, 255, 255, 0.9)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#333'
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

const CategoryEditor: React.FC<{
  category: MenuCategory;
  onSave: (name: string, nameAlbanian: string) => void;
  onCancel: () => void;
}> = ({ category, onSave, onCancel }) => {
  const [name, setName] = useState(category.name);
  const [nameAlbanian, setNameAlbanian] = useState(category.nameAlbanian);

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
          value={nameAlbanian}
          onChange={(e) => setNameAlbanian(e.target.value)}
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
        <button onClick={() => onSave(name, nameAlbanian)} className="save-button">
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
  const { auth } = useAuth();
  const baseUrl = process.env.REACT_APP_API_URL || 'https://api-mkazmlu7ta-ew.a.run.app/v1';
  const [name, setName] = useState(item.name);
  const [nameAlbanian, setNameAlbanian] = useState(item.nameAlbanian);
  const [price, setPrice] = useState(item.price.toString());
  const [imageUrl, setImageUrl] = useState(item.imageUrl || '');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [translating, setTranslating] = useState<string | null>(null);

  const translateText = async (text: string, context: string = 'edit-item'): Promise<string> => {
    if (!text?.trim()) {
      throw new Error('Teksti është i zbrazët');
    }

    try {
      setTranslating(context);

      const response = await fetch(`${baseUrl}/translate/menu-item`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({
          text: text.trim(),
          fromLang: 'sq',
          toLang: 'en'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Përkthimi dështoi');
      }

      const data = await response.json();
      return data.translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      throw error;
    } finally {
      setTranslating(null);
    }
  };

  const handleImageUpload = async (file: File): Promise<void> => {
    setIsUploadingImage(true);
    
    try {
      // Quick validation - only check if it's actually an image
      const validation = await validateImage(file, MENU_ITEM_RULES);
      
      if (!validation.isValid) {
        throw new Error(validation.errors.join('\n'));
      }
      
      // Automatically process the image to perfect size and quality
      const optimizedImageUrl = await processImageForUpload(file);
      setImageUrl(optimizedImageUrl);
      
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to process image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <div className="item-editor">
      <div className="editor-inputs">
        <input
          type="text"
          value={nameAlbanian}
          onChange={(e) => setNameAlbanian(e.target.value)}
          placeholder="Emri i artikullit (Shqip)"
        />
        <div className="name-input-with-translate">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Emri i artikullit (Anglisht)"
          />
          <button
            type="button"
            className="translate-button"
            onClick={async () => {
              if (!nameAlbanian.trim()) {
                alert('Ju lutem shkruani emrin shqip fillimisht');
                return;
              }
              
              try {
                const translated = await translateText(nameAlbanian, 'edit-item');
                setName(translated);
              } catch (error) {
                alert(error instanceof Error ? error.message : 'Përkthimi dështoi');
              }
            }}
            disabled={translating === 'edit-item' || !nameAlbanian.trim()}
            title="Përkthe nga shqipja në anglisht"
          >
            {translating === 'edit-item' ? (
              <svg className="spin" width="16" height="16" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="31.416" strokeDashoffset="31.416">
                  <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                  <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                </circle>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 12h20M9 5l7 7-7 7"/>
              </svg>
            )}
            AI Përkthe
          </button>
        </div>
        <input
          type="number"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Çmimi"
        />
        <div className="form-group">
          <label>Imazhi i Artikullit (Opsional)</label>
          <p style={{ fontSize: '14px', color: '#6c757d', margin: '4px 0 8px 0' }}>
            📸 Just upload any image - we'll automatically optimize it for you!
          </p>
          
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
            nameAlbanian, 
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

// Translation feature styles
const translationStyles = document.createElement("style");
translationStyles.innerHTML = `
  .name-input-with-translate {
    display: flex;
    gap: 8px;
    align-items: center;
    width: 100%;
  }

  .name-input-with-translate input {
    flex: 1;
  }

  .translate-button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    min-height: 36px;
  }

  .translate-button:hover:not(:disabled) {
    background: linear-gradient(135deg, #4338CA 0%, #6D28D9 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
  }

  .translate-button:disabled {
    background: #94A3B8;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .translate-button svg {
    stroke-width: 2;
  }

  .spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .item-form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    align-items: start;
  }

  .item-form-grid > .name-input-with-translate {
    grid-column: span 1;
  }

  @media (max-width: 768px) {
    .item-form-grid {
      grid-template-columns: 1fr;
    }
    
    .name-input-with-translate {
      flex-direction: column;
      align-items: stretch;
    }
    
    .translate-button {
      margin-top: 8px;
    }
  }
`;

// Inject styles into document head
if (typeof document !== 'undefined' && !document.head.querySelector('#translation-styles')) {
  translationStyles.id = 'translation-styles';
  document.head.appendChild(translationStyles);
}