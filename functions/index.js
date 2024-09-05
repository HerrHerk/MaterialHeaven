// Import required modules
const functions = require('firebase-functions');

const {onCreate} = require("firebase-functions/v2/auth");
const admin = require("firebase-admin");

const stripe = require('stripe')('YOUR_STRIPE_SECRET_KEY'); // Replace with your actual Stripe secret key


// Initialize Firebase Admin SDK
admin.initializeApp();

// Example of the default function
// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// Your new function to set restricted data on user creation
exports.setRestrictedData = onCreate((user) => {
  const userId = user.uid;
  const db = admin.firestore();

  // Set default restricted data for new users
  return db.collection("users").doc(userId).set({
    restricted: {
      purchased: {}, // Initialize as empty map
      tier: "free", // Default tier for new users
    },
  }, {merge: true}); // Merge ensures we don't overwrite other data
});


exports.createCheckoutSession = functions.https.onRequest(async (req, res) => {
    const { plan } = req.body;

    const prices = {
        'free': 0,
        'basic': 15000,
        'standard': 25000,
        'premium': 40000,
    };

    if (!prices.hasOwnProperty(plan)) {
        return res.status(400).send('Invalid plan');
    }

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
                    },
                    unit_amount: prices[plan],
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: 'https://your-domain.com/success',
            cancel_url: 'https://your-domain.com/cancel',
            metadata: {
                plan: plan, // Store the plan type
            },
            client_reference_id: 'USER_ID' // Replace with the logged-in user's ID
        });

        res.json({ id: session.id });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).send('Internal Server Error');
    }
});