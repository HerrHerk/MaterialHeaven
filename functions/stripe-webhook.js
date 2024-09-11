// functions/stripe-webhook.js

const functions = require("firebase-functions");
// const admin = require("firebase-admin");
const express = require("express");
const bodyParser = require("body-parser");
const stripe = require("stripe")(
    "sk_test_51PqDNEHfaXGRtSlVaDTEQEHr3LU6sM0eiOy9PGykHpxT9f9CBEpl5wE" +
    "8yntoYClMZtZSX5sxNbKeyNkra4wjE7G300wpLgmGnU",
);
const admin = require("./firebase-admin.js"); // Import the initialized admin


// admin.initializeApp();

console.log("webhook function called");

const endpointSecret = "whsec_FIPY5vipzZQdVdA7fHqaOPjmv7jQABhy";

const app = express();

app.use(bodyParser.raw({type: "application/json"}));

app.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    console.log("webhook checkout.session.completed true");
    const session = event.data.object;

    // Extract user ID and plan
    const userId = session.client_reference_id;
    const plan = session.metadata.plan;

    // Update Firestore
    const db = admin.firestore();
    await db.collection("users").doc(userId).update({
      "restricted.purchased": {
        [plan]: true, // Update plan status
      },
      "restricted.tier": plan, // Update the user tier
    });
  }

  res.json({received: true});
});

exports.stripeWebhook = functions.https.onRequest(app);

