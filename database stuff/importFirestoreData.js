const admin = require('firebase-admin');
const fs = require('fs');

// Initialize the Firebase Admin SDK
const serviceAccount = require('C:/Users/HERKda/Documents/Programing/Firebase/contacts-e0803-firebase-adminsdk-1kb9a-b7e73efc41.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Load your restructured JSON file
const data = require('./restructuredFirestoreData.json');

// Function to import data into Firestore
async function importData() {
  try {
    for (const docId in data) {
      const materialData = data[docId];
      
      // Reference to the collection and document
      const docRef = db.collection('materialCollection').doc(docId);
      
      // Import the material data into Firestore
      await docRef.set(materialData);
      
      console.log(`Document ${docId} successfully written!`);
    }
    console.log('All documents have been successfully imported!');
  } catch (error) {
    console.error('Error writing documents to Firestore:', error);
  }
}

// Call the import function
importData();
