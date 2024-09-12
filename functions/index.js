// Import required modules
const functions = require("firebase-functions");
const admin = require("./firebase-admin.js"); // Import the initialized admin
const stripe = require("stripe")(
    "sk_test_51PqDNEHfaXGRtSlVaDTEQEHr3LU6sM0eiOy9PGykHpxT9f9CBEpl5wE" +
    "8yntoYClMZtZSX5sxNbKeyNkra4wjE7G300wpLgmGnU",
);
const cors = require("cors")({origin: true});

// Initialize Firebase Admin SDK
if (!admin.apps.length) { // Check if the app is already initialized
  admin.initializeApp();
}

// Import the stripeWebhook function
const {stripeWebhook} = require("./stripe-webhook.js");

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
        success_url: "https://contacts-e0803.web.app/success.html",
        cancel_url: "https://contacts-e0803.web.app/cancel.html",
        metadata: {
          plan: plan,
        },
        client_reference_id: userId, // Use the actual user ID here
      });

      res.json({data: {id: session.id}});
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).send({error: "Internal Server Error"});
    }
  });
});

// Export the stripeWebhook function
exports.stripeWebhook = stripeWebhook;
