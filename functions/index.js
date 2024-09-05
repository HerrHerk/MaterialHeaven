// Import required modules
const functions = require("firebase-functions");
const {onCreate} = require("firebase-functions/v2/auth");
const admin = require("firebase-admin");
const stripe = require("stripe")(
    "sk_test_51PqDNEHfaXGRtSlVaDTEQEHr3LU6sM0eiOy9PGykHpxT9f9CBEpl5wE" +
    "8yntoYClMZtZSX5sxNbKeyNkra4wjE7G300wpLgmGnU",
);

// Initialize Firebase Admin SDK
admin.initializeApp();

// Function to set restricted data on user creation
exports.setRestrictedData = onCreate((user) => {
  const userId = user.uid;
  const db = admin.firestore();

  return db.collection("users").doc(userId).set(
      {
        restricted: {
          purchased: {}, // Initialize as empty map
          tier: "free", // Default tier for new users
        },
      },
      {merge: true}, // No trailing comma
  );
});

// Function to create a Stripe Checkout session
exports.createCheckoutSession = functions.https.onRequest(async (req, res) => {
  const {plan} = req.body;

  const prices = {
    free: 0,
    basic: 15000,
    standard: 25000,
    premium: 40000,
  };

  if (!Object.prototype.hasOwnProperty.call(prices, plan)) {
    return res.status(400).send("Invalid plan");
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
      success_url: "http://127.0.0.1:5500/success.html",
      cancel_url: "http://127.0.0.1:5500/cancel.html",
      metadata: {
        plan: plan, // Store the plan type
      },
      client_reference_id: "USER_ID", // Replace with the logged-in user's ID
    });

    res.json({id: session.id});
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).send("Internal Server Error");
  }
});
