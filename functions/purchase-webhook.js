// functions/plan-purchase-webhook.js

const functions = require("firebase-functions");
// const admin = require("firebase-admin");
const express = require("express");
const bodyParser = require("body-parser");
const stripe = require("stripe")(
    "sk_test_51PqDNEHfaXGRtSlVaDTEQEHr3LU6sM0eiOy9PGykHpxT9f9CBEpl5wE" +
    "8yntoYClMZtZSX5sxNbKeyNkra4wjE7G300wpLgmGnU",
);
const admin = require("./firebase-admin.js"); // Import the initialized admin

const app = express();

app.use(
    bodyParser.json({
      verify: function(req, res, buf) {
        req.rawBody = buf;
        console.log("req.rawBody constructed successfully:");
      },
    }),
);


// app.use(bodyParser.raw({type: "application/json"}));

app.post(
    "/",
    express.raw({type: "application/json"}),
    async (req, res) => {
      let event;
      const endpointSecret = "whsec_FIPY5vipzZQdVdA7fHqaOPjmv7jQABhy";

      const sig = req.headers["stripe-signature"];
      console.log("Signature imported successfully:");


      try {
        event = stripe.webhooks.constructEvent(
            req.rawBody,
            sig,
            endpointSecret,
        );
        console.log("Event constructed successfully:");
      } catch (err) {
        console.log(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        console.log("Checkout session completed:");

        const userId = session.client_reference_id;


        if (session.metadata.purchase_type === "subscription") {
        // Extract user ID and plan

          const plan = session.metadata.plan;

          console.log("User ID:", userId, "Plan:", plan);


          // Update Firestore

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
        // Handle material purchase
          const materialIds = session.metadata.material_ids.split(",");
          console.log("Mat Purchase -> UID:", userId, "MIDs:", materialIds);

          try {
            const db = admin.firestore();
            const userRef = db.collection("users").doc(userId);

            // Fetch current purchased materials
            const userDoc = await userRef.get();
            const userData = userDoc.data();

            const currentPurchased = (
              userData.restricted &&
            userData.restricted.purchased
            ) || {};

            // Add new material IDs to the purchased map
            materialIds.forEach((id) => {
              currentPurchased[id] = true;
            });

            // Update Firestore document
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

app.use(express.json());

exports.purchaseWebhook = functions.https.onRequest(app);

