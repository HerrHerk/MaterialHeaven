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
const filterMaterialData = (material, userTier, purchasedMaterials) => {
  const materialTierValue = tierValue[material.materialInfo.tier] || -1;
  const userTierValue = tierValue[userTier] || -1;

  // Check if the material ID is in the purchased materials
  const isPurchased = purchasedMaterials[material.id] !== undefined;


  if (userTierValue >= materialTierValue || isPurchased) {
    console.log(`Returning full material data for tier ${userTier}`);
    return material; // User has access to all data
  } else {
    console.log(`Hiding materialModels for tier ${userTier}`);
    // Directly remove materialModels if user tier is lower
    const materialWithoutModels = {...material};
    delete materialWithoutModels.materialModels; // Re
    delete materialWithoutModels.additionalInfo;
    return materialWithoutModels; // Return material without
  }
};

const getFilteredMaterials = functions.https.onCall(async (data, context) => {
  console.log("getFilteredMaterials runs");
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated to access this data.",
    );
  }


  const userId = context.auth.uid;
  const userTier = await getUserTier(userId);

  console.log("userId:", userId);
  console.log("userTier:", userTier);

  if (!userTier) {
    throw new functions.https.HttpsError("perm.-denied", "tier not found");
  }

  // Fetch the user document to get purchased materials
  const userDoc = await admin.firestore()
      .collection("users")
      .doc(userId)
      .get();
  const purchasedMaterials = userDoc.data().restricted.purchased;


  const materialCollection = admin
      .firestore()
      .collection("materialCollection");
  const snapshot = await materialCollection.get();

  const materials = [];
  snapshot.forEach((doc) => {
    const material = doc.data();
    material.id = doc.id;
    const filteredMaterial = filterMaterialData(
        material,
        userTier,
        purchasedMaterials,
    );
    materials.push(filteredMaterial);
    // console.log("Filtered Material:", filteredMaterial); // Log filtered
  });

  return {materials};
});

module.exports = {getFilteredMaterials};


