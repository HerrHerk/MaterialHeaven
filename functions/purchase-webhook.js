// functions/plan-purchase-webhook.js

const functions = require("firebase-functions");
// const admin = require("firebase-admin");


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


const admin = require("./firebase-admin.js"); // Import the initialized admin

const express = require("express");
// const bodyParser = require("body-parser");
const app = express();


// This is crucial for Stripe webhooks
app.use("/api/subs/stripe-webhook", express.raw({type: "*/*"}));

app.post("/", async (req, res) => {
  const endpointSecret = "whsec_N7TzRMsiL377OAHLbT3UOUIs8jhSibSw";

  // Key change: use req.rawBody directly
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    // Construct event using rawBody
    event = stripe.webhooks.constructEvent(
        req.rawBody, // Use rawBody instead of body
        sig,
        endpointSecret,
    );
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Rest of your existing webhook logic remains the same
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    console.log("Checkout session completed:");

    const userId = session.client_reference_id;

    if (session.metadata.purchase_type === "subscription") {
      const plan = session.metadata.plan;
      console.log("User ID:", userId, "Plan:", plan);

      try {
        const db = admin.firestore();
        await db.collection("users").doc(userId).update({
          "restricted.purchased": {
            [plan]: true,
          },
          "restricted.tier": plan,
        });
        console.log("User plan updated in Firestore");
      } catch (error) {
        console.error("Firestore update error:", error);
      }
    } else if (session.metadata.purchase_type === "materials") {
      const materialIds = session.metadata.material_ids.split(",");
      console.log("Mat Purchase -> UID:", userId, "MIDs:", materialIds);

      try {
        const db = admin.firestore();
        const userRef = db.collection("users").doc(userId);

        const userDoc = await userRef.get();
        const userData = userDoc.data();

        const currentPurchased = (
          userData.restricted &&
          userData.restricted.purchased
        ) || {};

        materialIds.forEach((id) => {
          currentPurchased[id] = true;
        });

        await userRef.update({
          "restricted.purchased": currentPurchased,
        });

        console.log("Materials updated in Firestore:", materialIds);
      } catch (error) {
        console.error("Firestore update error (materials):", error);
      }
    }
  }

  res.json({received: true});
});

exports.purchaseWebhook = functions.https.onRequest(app);

