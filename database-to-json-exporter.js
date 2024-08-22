const admin = require('firebase-admin');
const fs = require('fs');

// Load your service account key JSON file
const serviceAccount = require('C:/Users/HERKda/Documents/Programing/Firebase/contacts-e0803-firebase-adminsdk-1kb9a-c8f34d33fa.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function exportFirestoreToJson() {
    const collectionName = 'materials';  // Replace with your collection name
    const collectionRef = db.collection(collectionName);
    
    const snapshot = await collectionRef.get();
    const allDocuments = {};
  
    snapshot.forEach(doc => {
      allDocuments[doc.id] = doc.data();
    });
  
    // Convert to JSON and write to a file
    const jsonContent = JSON.stringify(allDocuments, null, 2);
    fs.writeFileSync('firestoreData.json', jsonContent);
  
    console.log('Firestore data has been exported to firestoreData.json');
  }
  
  exportFirestoreToJson();
  