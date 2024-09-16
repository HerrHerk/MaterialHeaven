// material-tier-filter.js

const functions = require("firebase-functions");
const admin = require("./firebase-admin.js"); // Import the initialized admin

const tierValue = {
  "free": 0,
  "basic": 1,
  "standard": 2,
  "premium": 3,
  "admin": 4,
};

// Function to get user tier
const getUserTier = async (userId) => {
  const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(userId)
      .get();
  return userDoc.exists ? userDoc.data().restricted.tier : null;
};

// Function to filter material data based on user's tier
const filterMaterialData = (material, userTier) => {
  const materialTierValue = tierValue[material.materialInfo.tier] || -1;
  const userTierValue = tierValue[userTier] || -1;

  if (userTierValue >= materialTierValue) {
    return material; // User has access to all data
  } else {
    // Directly remove materialModels if user tier is lower
    const materialWithoutModels = {...material};
    delete materialWithoutModels.materialModels; // Re
    return materialWithoutModels; // Return material without
  }
};

const getFilteredMaterials = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauth.", "User must be auth");
  }

  const userId = context.auth.uid;
  const userTier = await getUserTier(userId);

  if (!userTier) {
    throw new functions.https.HttpsError("perm.-denied", "tier not found");
  }

  const materialCollection = admin.firestore().collection("materialCollection");
  const snapshot = await materialCollection.get();

  const materials = [];
  snapshot.forEach((doc) => {
    const material = doc.data();
    material.id = doc.id;
    const filteredMaterial = filterMaterialData(material, userTier);
    materials.push(filteredMaterial);
  });

  return {materials};
});

module.exports = {getFilteredMaterials};


