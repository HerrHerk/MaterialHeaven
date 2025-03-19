import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-functions.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { 
  getFirestore,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js"
import app from "./firebase-sdk.js";

// Initialize Firebase Functions and Auth
const functions = getFunctions(app); // Pass the app instance
const auth = getAuth(app); // Pass the app instance
const db = getFirestore();


//------------------------------------------------------------
// HANDLE SUBSCRIPTION
//------------------------------------------------------------

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
    const stripe = Stripe("pk_live_51PqDNEHfaXGRtSlV5zENSUHECvyzD7WYp8zd6E5U6RrYYLOhoSXJ9iTDj4XVl8JNOOvaT7o1WnrJ47YqEN9wBNtr00a6jdbGWP"); // Replace with your actual Stripe publishable key
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

const highlightCurrentPlan = async (userId) => {
  const userTier = await getUserTier(userId); // Fetch the user's tier from Firestore
  

  if (userTier) {
      console.log("Current user tier: ", userTier);

      const planCard = document.querySelector(`.${userTier}-plan`);
      console.log("Plan card found: ", planCard);

      if (planCard) {
          // Highlight the user's current plan
          planCard.classList.add('current-plan'); // Add the highlight class
          
          // Disable the button for the current plan
          const button = planCard.querySelector('.select-plan-btn');
          button.textContent = "Your Current Plan"; // Update the button text
          button.disabled = true; // Disable the button
          button.classList.add('disabled'); // Optionally add a disabled class
      }
  }
};




// Function to get user tier in client-side using Firestore v9+
const getUserTier = async (userId) => {
  try {
    // Get a reference to the user's document
    const docRef = doc(db, "users", userId);

    // Fetch the document
    const userDoc = await getDoc(docRef);

    // Check if the document exists and return the tier if it does
    if (userDoc.exists()) {
      return userDoc.data().restricted.tier; // Adjust this path to your Firestore structure
    } else {
      console.log("No such user document!");
      return null;
    }
  } catch (error) {
    console.error("Error fetching user data: ", error);
    return null;
  }
};



console.log("Auth initialized:", auth);
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User is signed in:", user);
    const userId = user.uid; // Get the user ID
    highlightCurrentPlan(userId); // Highlight the current plan
  } else {
    console.log('No user is signed in.');
  }
});

//------------------------------------------------------------
// HANDLE SHOPPING CART
//------------------------------------------------------------

// payment.js
import { shoppingCart } from './app.js'; // Adjust the path if necessary

// Get the Cloud Function for creating a checkout session
const createSCCheckout = httpsCallable(functions, "createSCCheckout");


// Function to handle shopping cart checkout
const handleCartCheckout = async () => {
  if (!auth.currentUser) {
    alert("Please log in to proceed with payment.");
    return;
  }

  const userId = auth.currentUser.uid; // Get the current user's UID from Firebase Auth
  const materialIds = shoppingCart.map(item => item.id);
  const loadingDimmer = document.getElementById("loading-dimmer-checkout");

  try {
      
    loadingDimmer.style.display = "flex"; // Make it visible
    // Call the Cloud Function to create a checkout session
    console.log("Awaiting for createCheckoutSession...");
    console.log("Material IDs:", materialIds);
    
    let result;
    try {
      result = await createSCCheckout({ materialIds, userId });
      console.log("Checkout session result:", result); // Add this line for debugging
    } catch (error) {
      console.error("Error during createCheckoutSession:", error);
      loadingDimmer.style.display = "none"; // Hide dimmer on error
      return; // Exit if there's an error, so you don't try to use undefined `result`
    }

    const { id } = result.data; // Safely access result.data here

    // Redirect to Stripe Checkout
    const stripe = Stripe("pk_live_51PqDNEHfaXGRtSlV5zENSUHECvyzD7WYp8zd6E5U6RrYYLOhoSXJ9iTDj4XVl8JNOOvaT7o1WnrJ47YqEN9wBNtr00a6jdbGWP"); // Replace with your actual Stripe publishable key
    const { error } = await stripe.redirectToCheckout({ sessionId: id });

    if (error) {
      console.error("Error during checkout:", error);
      loadingDimmer.style.display = "none"; // Hide dimmer on error
    }
  } catch (error) {
    console.error("Error during checkout:", error);
  }
};



// Add event listener to the checkout button
const checkoutButton = document.getElementById('checkout-cart-btn');
if (checkoutButton) {
  checkoutButton.addEventListener('click', handleCartCheckout);
}

// Hide the dimmer when Stripe checkout is completed
window.addEventListener("popstate", () => {
  const loadingDimmer = document.getElementById("loading-dimmer-checkout");
  loadingDimmer.style.display = "none";
});