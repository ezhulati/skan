const https = require('https');

// Albanian Lek menu data for Beach Bar Durrës
const beachBarMenuData = {
  venue: {
    id: "beach-bar-durres",
    name: "Beach Bar Durrës",
    slug: "beach-bar-durres",
    address: "Rruga e Plazhit, Durrës 2001, Albania",
    phone: "+355 52 222 333",
    description: "A beautiful beachfront bar and restaurant in Durrës offering fresh seafood, refreshing drinks, and stunning sea views. Perfect for sunset dining and relaxed beach atmosphere.",
    settings: {
      currency: "ALL", // Albanian Lek
      orderingEnabled: true,
      estimatedPreparationTime: 15
    }
  },
  categories: [
    {
      id: "appetizers",
      name: "Appetizers", 
      nameAlbanian: "Antipasta",
      sortOrder: 1,
      items: [
        {
          id: "greek-salad",
          name: "Greek salad",
          nameAlbanian: "Sallatë Greke", 
          description: "Fresh tomatoes, cucumbers, olives, feta cheese with olive oil dressing",
          descriptionAlbanian: "Domate të freskëta, kastravec, ullinj, djathë feta me vaj ulliri",
          price: 900, // Albanian Lek
          allergens: ["dairy"],
          preparationTime: 10,
          sortOrder: 1
        },
        {
          id: "fried-calamari",
          name: "Fried Calamari",
          nameAlbanian: "Kallamar i Skuqur",
          description: "Fresh Mediterranean calamari rings, lightly breaded and fried to perfection",
          descriptionAlbanian: "Unaza kallmari të freskëta mesdhetare, të lehta me bukë dhe të skuqura në perfeksion",
          price: 1200, // Albanian Lek
          allergens: ["gluten", "seafood"],
          preparationTime: 15,
          sortOrder: 2
        }
      ]
    },
    {
      id: "main-courses",
      name: "Main Courses",
      nameAlbanian: "Pjata Kryesore", 
      sortOrder: 2,
      items: [
        {
          id: "seafood-risotto",
          name: "Seafood Risotto",
          nameAlbanian: "Rizoto me Fruta Deti",
          description: "Creamy Arborio rice with fresh mussels, shrimp, and calamari in white wine sauce",
          descriptionAlbanian: "Oriz kremoz Arborio me midhje të freskëta, karkalec dhe kallamar në salcë vere të bardhë",
          price: 1800, // Albanian Lek
          allergens: ["seafood", "dairy"],
          preparationTime: 25,
          sortOrder: 1
        },
        {
          id: "grilled-lamb-chops",
          name: "Grilled Lamb Chops", 
          nameAlbanian: "Copë Qengji në Skarë",
          description: "Tender lamb chops marinated in Albanian herbs, grilled to perfection",
          descriptionAlbanian: "Copë qengji të njoma të marinuara me barna shqiptare, në skarë në perfeksion",
          price: 2200, // Albanian Lek
          allergens: [],
          preparationTime: 20,
          sortOrder: 2
        },
        {
          id: "grilled-sea-bass",
          name: "Grilled Sea Bass",
          nameAlbanian: "Levrek në Skarë",
          description: "Fresh Adriatic sea bass grilled with lemon, garlic and Mediterranean herbs",
          descriptionAlbanian: "Levrek i freskët nga Adriatiku në skarë me limon, hudhra dhe barna mesdhetare",
          price: 2500, // Albanian Lek
          allergens: ["seafood"],
          preparationTime: 18,
          sortOrder: 3
        }
      ]
    },
    {
      id: "drinks",
      name: "Drinks",
      nameAlbanian: "Pije",
      sortOrder: 3,
      items: [
        {
          id: "albanian-beer",
          name: "Albanian Beer",
          nameAlbanian: "Birrë Shqiptare",
          description: "Local Tirana beer, crisp and refreshing",
          descriptionAlbanian: "Birrë lokale e Tiranës, e freskët dhe rifreskim",
          price: 350, // Albanian Lek
          allergens: ["gluten"],
          preparationTime: 2,
          sortOrder: 1
        },
        {
          id: "albanian-raki",
          name: "Albanian Raki",
          nameAlbanian: "Raki Shqiptare",
          description: "Traditional Albanian grape brandy, strong and smooth",
          descriptionAlbanian: "Raki tradicional shqiptar nga rrushi, i fortë dhe i butë",
          price: 400, // Albanian Lek
          allergens: [],
          preparationTime: 2,
          sortOrder: 2
        },
        {
          id: "mojito",
          name: "Mojito",
          nameAlbanian: "Mojito",
          description: "Classic Cuban cocktail with mint, lime, and white rum",
          descriptionAlbanian: "Koktej klasik kuba me xhenxhefil, limon dhe rum të bardhë",
          price: 750, // Albanian Lek
          allergens: [],
          preparationTime: 5,
          sortOrder: 3
        }
      ]
    },
    {
      id: "desserts",
      name: "Desserts", 
      nameAlbanian: "Ëmbëlsira",
      sortOrder: 4,
      items: [
        {
          id: "tiramisu",
          name: "Tiramisu",
          nameAlbanian: "Tiramisu",
          description: "Classic Italian dessert with coffee-soaked ladyfingers and mascarpone",
          descriptionAlbanian: "Ëmbëlsirë klasike italiane me kafe dhe mascarpone",
          price: 650, // Albanian Lek
          allergens: ["dairy", "eggs"],
          preparationTime: 5,
          sortOrder: 1
        },
        {
          id: "baklava",
          name: "Baklava",
          nameAlbanian: "Bakllava",
          description: "Traditional Balkan pastry with nuts and honey syrup",
          descriptionAlbanian: "Ëmbëlsirë tradicionale ballkanike me arra dhe mjaltë",
          price: 550, // Albanian Lek
          allergens: ["nuts", "gluten"],
          preparationTime: 5,
          sortOrder: 2
        }
      ]
    }
  ]
};

async function createBeachBarLekMenu() {
  console.log('🇦🇱 Beach Bar Durrës - Albanian Lek Menu Configuration');
  console.log('====================================================\n');
  
  console.log('🏖️ Venue Details:');
  console.log(`Name: ${beachBarMenuData.venue.name}`);
  console.log(`Address: ${beachBarMenuData.venue.address}`);
  console.log(`Phone: ${beachBarMenuData.venue.phone}`);
  console.log(`Currency: ${beachBarMenuData.venue.settings.currency} (Albanian Lek)`);
  
  console.log('\n📋 Complete Menu with Albanian Lek Prices:');
  console.log('===========================================');
  
  beachBarMenuData.categories.forEach(category => {
    console.log(`\n📁 ${category.name} (${category.nameAlbanian})`);
    console.log('─'.repeat(40));
    
    category.items.forEach(item => {
      console.log(`🍽️  ${item.name} (${item.nameAlbanian})`);
      console.log(`    💰 ${item.price} Lek`);
      console.log(`    📝 ${item.description}`);
      console.log(`    📝 ${item.descriptionAlbanian}`);
      if (item.allergens.length > 0) {
        console.log(`    ⚠️  Allergens: ${item.allergens.join(', ')}`);
      }
      console.log(`    ⏱️  Prep time: ${item.preparationTime} minutes`);
      console.log('');
    });
  });
  
  console.log('\n💰 Price Summary in Albanian Lek:');
  console.log('=================================');
  console.log('🥗 Appetizers: 900-1200 Lek');
  console.log('🍽️  Main Courses: 1800-2500 Lek');
  console.log('🍺 Drinks: 350-750 Lek'); 
  console.log('🍰 Desserts: 550-650 Lek');
  
  console.log('\n🎯 Pricing Strategy:');
  console.log('• Competitive for Durrës beachfront location');
  console.log('• Affordable for both locals and tourists');
  console.log('• Reflects premium quality and seaside dining experience');
  console.log('• Albanian Beer at 350 Lek = excellent value for tourists');
  
  console.log('\n✅ Menu Configuration Complete');
  console.log('This menu data can be used to update the Firebase database');
  console.log('All prices are now in Albanian Lek (ALL) instead of EUR');
  
  return beachBarMenuData;
}

// Export menu data and run display
if (require.main === module) {
  createBeachBarLekMenu().catch(console.error);
}

module.exports = { beachBarMenuData, createBeachBarLekMenu };