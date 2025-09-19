#!/usr/bin/env node

/**
 * Remove image from Sallatë Greke (Greek Salad) menu item
 * Direct Firebase Admin SDK approach
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK with service account
// Note: In production, this would use proper service account credentials
admin.initializeApp({
  projectId: 'qr-restaurant-api',
  // For this operation, we'll use Application Default Credentials
  // which should work if you're authenticated with Firebase CLI
});

const db = admin.firestore();

async function removeGreekSaladImage() {
  console.log('🔍 Searching for Sallatë Greke menu item...');
  
  try {
    // Get the venue document
    const venueRef = db.collection('venues').doc('beach-bar-durres');
    const menuItemsRef = venueRef.collection('menuItem');
    
    // Find the Greek Salad item
    const querySnapshot = await menuItemsRef.where('id', '==', 'greek-salad').get();
    
    if (querySnapshot.empty) {
      console.log('❌ Greek Salad item not found');
      return;
    }
    
    // Update the item to remove the image
    const doc = querySnapshot.docs[0];
    const itemData = doc.data();
    
    console.log('📄 Found item:', {
      id: itemData.id,
      name: itemData.name,
      nameAlbanian: itemData.nameAlbanian,
      hasImage: !!itemData.imageUrl
    });
    
    if (!itemData.imageUrl) {
      console.log('✅ Item already has no image');
      return;
    }
    
    // Remove the image by setting imageUrl to empty string
    await doc.ref.update({
      imageUrl: ''
    });
    
    console.log('✅ Successfully removed image from Sallatë Greke!');
    console.log('🎯 The menu item now has no image URL');
    
  } catch (error) {
    console.error('❌ Error removing image:', error);
  }
}

// Run the function
removeGreekSaladImage()
  .then(() => {
    console.log('🎉 Operation completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed:', error);
    process.exit(1);
  });