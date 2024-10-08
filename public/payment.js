import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-functions.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

import app from "./firebase-sdk.js";

// Initialize Firebase Functions and Auth
const functions = getFunctions(app); // Pass the app instance
const auth = getAuth(app); // Pass the app instance

// Get the Cloud Function for creating a checkout session
const createCheckoutSession = httpsCallable(functions, "createCheckoutSession");

// Function to handle plan selection
const handlePlanSelection = async (plan) => {
  if (!auth.currentUser) {
    alert("Please log in to proceed with payment.");
    return;
  }

  const userId = auth.currentUser.uid; // Get the current user's UID from Firebase Auth

  try {
    // Call the Cloud Function to create a checkout session
    console.log("awaiting for createCheckoutSession...");
    console.log("Selected plan:", plan);
    
    let result;
    try {
      result = await createCheckoutSession({ plan, userId });
      console.log("Checkout session result:", result); // Add this line for debugging
    } catch (error) {
      console.error("Error during createCheckoutSession:", error);
      return; // Exit if there's an error, so you don't try to use undefined `result`
    }

    const { id } = result.data; // Safely access result.data here

    // Redirect to Stripe Checkout
    const stripe = Stripe("pk_test_51PqDNEHfaXGRtSlVGqOOcDqIgYGSME9GKUZFAsdx1oJZk1XjrWxmdlunFeAZgHyoJgPT08RDprptLse6KdAk01QJ00l7ERpnMA"); // Replace with your actual Stripe publishable key
    const { error } = await stripe.redirectToCheckout({ sessionId: id });

    if (error) {
      console.error("Error during checkout:", error);
    }
  } catch (error) {
    console.error("Error during checkout:", error);
  }
};


// Add event listeners to all plan buttons
document.querySelectorAll('.select-plan-btn').forEach(button => {
  button.addEventListener('click', (event) => {
    const plan = event.target.dataset.plan; // Get the plan from the button's data attribute
    console.log("Button with the following plan pressed and recognized: ", plan); // Debug log
    handlePlanSelection(plan); // Call the function with the selected plan
  });
});
