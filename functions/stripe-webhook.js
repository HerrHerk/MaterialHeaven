// functions/stripe-webhook.js

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const bodyParser = require('body-parser');
const stripe = require('stripe')('YOUR_STRIPE_SECRET_KEY'); // Replace with your Stripe secret key

admin.initializeApp();

const endpointSecret = 'YOUR_WEBHOOK_SECRET'; // Replace with your Stripe webhook secret

const app = express();

app.use(bodyParser.raw({ type: 'application/json' }));

app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Extract user ID and plan
    const userId = session.client_reference_id; // Ensure this is set correctly in your payment process
    const plan = session.metadata.plan; // Store the plan in metadata

    // Update Firestore
    const db = admin.firestore();
    await db.collection('users').doc(userId).update({
      'restricted.purchased': {
        [plan]: true, // Update plan status
      },
      'restricted.tier': plan, // Update the user tier
    });
  }

  res.json({ received: true });
});

exports.stripeWebhook = functions.https.onRequest(app);
