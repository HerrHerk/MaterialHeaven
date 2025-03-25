// Import required modules
const functions = require("firebase-functions");
const admin = require("./firebase-admin.js"); // Import the initialized admin

// live key
/* const stripe = require("stripe")(
    "sk_live_51PqDNEHfaXGRtSlVh1lxHAO0Q6ENMBEOiR" +
  "gAARkhfyZjGfiLghlMfV0bXSfP0Z6SUwEUyOgHH7QAcb5QmgyKU73600azh1UcNE",
); */

// test key
const stripe = require("stripe")(
    "sk_test_51PqDNEHfaXGRtSlVaDTEQEHr3LU6sM0eiOy9PGykHpx" +
"T9f9CBEpl5wE8yntoYClMZtZSX5sxNbKeyNkra4wjE7G300wpLgmGnU",
);


const cors = require("cors")({origin: true});

// Initialize Firebase Admin SDK
if (!admin.apps.length) { // Check if the app is already initialized
  admin.initializeApp();
}

// Import the purchaseWebhook function
const {purchaseWebhook} = require("./purchase-webhook.js");


// Function to set restricted data on user creation
exports.setRestrictedData = functions.auth.user().onCreate(async (user) => {
  const userId = user.uid;
  const db = admin.firestore();

  return db.collection("users").doc(userId).set(
      {
        restricted: {
          "purchased": {}, // Initialize as empty map
          "tier": "free", // Default tier for new users
          "subscriptions": {
            "material": false,
            "materialExpiration": null,
            "cad": false,
            "cadExpiration": null,
            "simulation": false,
            "simulationExpiration": null,
            "complete": false,
            "completeExpiration": null,
          },
        },
      },
      {merge: true},
  );
});

// Function to create a Stripe Checkout session
exports.createCheckoutSession = functions.https.onRequest((req, res) => {
  console.log("createCheckoutSession started");

  cors(req, res, async () => {
    console.log("Request method:", req.method);
    console.log("Request body:", req.body);

    if (req.method === "OPTIONS") {
      res.set("Access-Control-Allow-Methods", "GET, POST");
      res.set("Access-Control-Allow-Headers", "Content-Type");
      res.status(204).send("");
      return;
    }

    const {category, userId} = req.body.data;

    console.log("Plan received:", category);
    console.log("userId received:", userId);

    if (!category) {
      return res.status(400).send({error: "Plan is required"});
    }

    if (!userId) {
      return res.status(400).send({error: "User ID is required"});
    }


    // Subscription Prices (Stripe Product Prices IDs)

    const subscriptionPrices = {
      material: "price_1R6BHnHfaXGRtSlVApgNgEXP", // test ID
      /* material: "price_1R51S6HfaXGRtSlVTnP4Yhbj", */ //  Price ID
      cad: "price_1R51TOHfaXGRtSlV42KduAi4", // CAD Library Price ID
      simulation: "price_1R51UaHfaXGRtSlVjVnE9TnH", // Simulation Tools Price ID
      complete: "price_1R51VyHfaXGRtSlVvludmkqL", // Complete Package Price ID
    };

    if (!Object.prototype.hasOwnProperty.call(subscriptionPrices, category)) {
      return res.status(400).send({error: "Invalid plan"});
    }

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: subscriptionPrices[category],
            quantity: 1,
          },
        ],
        mode: "subscription", // Switch to subscription mode
        success_url: "https://xplicitmaterials.com/success/",
        cancel_url: "https://xplicitmaterials.com/cancel/",
        client_reference_id: userId,
        metadata: {
          purchase_type: "subscription",
          category: category,
        },
      });

      res.json({data: {id: session.id}});
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).send({error: "Internal Server Error"});
    }
  });
});

// Export the purchaseWebhook function
exports.purchaseWebhook = purchaseWebhook;


// Import the material-tier-filter function
const {getFilteredMaterials} = require("./material-tier-filter.js");

exports.getFilteredMaterials = getFilteredMaterials;


// Function to create a Stripe Checkout session for material purchases
exports.createSCCheckout = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    console.log("Request body:", req.body);

    if (req.method === "OPTIONS") {
      res.set("Access-Control-Allow-Methods", "GET, POST");
      res.set("Access-Control-Allow-Headers", "Content-Type");
      res.status(204).send("");
      return;
    }

    const {materialIds, userId} = req.body.data;

    console.log("Material IDs received:", materialIds);
    console.log("User ID received:", userId);

    if (!materialIds || materialIds.length === 0) {
      return res.status(400).send({error: "Items are required"});
    }

    if (!userId) {
      return res.status(400).send({error: "User ID is required"});
    }

    try {
      // Retrieve material data from Firestore
      const materialPromises = materialIds.map(async (id) => {
        const materialDoc = await admin
            .firestore()
            .collection("materialCollection")
            .doc(id)
            .get();
        if (!materialDoc.exists) {
          throw new Error(`Material with ID ${id} not found`);
        }
        const materialData = materialDoc.data();
        const materialInfo = materialData.materialInfo;
        return {
          price_data: {
            currency: "eur",
            product_data: {
              name: `${materialInfo.name} (Version ${materialInfo.version})`,
            },
            unit_amount: 10 * 100,
          },
          quantity: 1,
        };
      });

      const lineItems = await Promise.all(materialPromises);

      // Create a Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems, // Use the retrieved line items
        mode: "payment",
        success_url: "https://xplicitmaterials.com/success/",
        cancel_url: "https://xplicitmaterials.com/cancel/",
        client_reference_id: userId, // Use the actual user ID
        metadata: {
          purchase_type: "materials", // Add this metadata to identify as mat
          material_ids: materialIds.join(","),
        },
      });

      res.json({data: {id: session.id}});
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).send({error: "Internal Server Error"});
    }
  });
});

exports.checkExpiredSubscriptions = functions.pubsub
    .schedule("every 24 hours")
    .onRun(async () => {
      const db = admin.firestore();
      const usersRef = db.collection("users");
      const now = new Date().toISOString();

      const usersSnapshot = await usersRef.get();
      usersSnapshot.forEach(async (doc) => {
        const userData = doc.data();
        const subscriptions = userData.restricted.subscriptions || {};

        const updatedSubscriptions = {...subscriptions};

        for (const key of Object.keys(subscriptions)) {
          if (
            key.endsWith("Expiration") &&
                subscriptions[key] &&
                subscriptions[key] < now
          ) {
            const subName = key.replace("Expiration", "");
            updatedSubscriptions[subName] = false; // Deactivate
          }
        }

        await usersRef.doc(doc.id).update({
          "restricted.subscriptions": updatedSubscriptions,
        });
        console.log(`Checked & updated subscriptions for user: ${doc.id}`);
      });
    });
