// Import required modules
const functions = require("firebase-functions");
const admin = require("./firebase-admin.js"); // Import the initialized admin
const stripe = require("stripe")(
    "sk_live_51PqDNEHfaXGRtSlVPUoCi1qqXv1eaSIrsq4DOA80HV" +
  "nX8TthdptKJPvp93RHNfEvfeAVuGcW6ARX5Dt6fy4WfhQG00aISNFSHC",
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
          purchased: {}, // Initialize as empty map
          tier: "free", // Default tier for new users
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

    const {plan, userId} = req.body.data;

    console.log("Plan received:", plan);
    console.log("userId received:", userId);

    if (!plan) {
      return res.status(400).send({error: "Plan is required"});
    }

    if (!userId) {
      return res.status(400).send({error: "User ID is required"});
    }


    const prices = {
      free: 0,
      basic: 15000,
      standard: 25000,
      premium: 40000,
    };

    if (!Object.prototype.hasOwnProperty.call(prices, plan)) {
      return res.status(400).send({error: "Invalid plan"});
    }

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
              },
              unit_amount: prices[plan],
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: "https://xplicitmaterials.com/success.html",
        cancel_url: "https://xplicitmaterials.com/cancel.html",
        client_reference_id: userId, // Use the actual user ID here
        metadata: {
          purchase_type: "subscription", // Add this metadata to ident as a sub
          plan: plan,
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
            unit_amount: materialInfo.price * 100,
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
        success_url: "https://xplicitmaterials.com/success.html",
        cancel_url: "https://xplicitmaterials.com/cancel.html",
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

