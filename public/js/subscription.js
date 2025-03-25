console.log("subscription.js script loaded");

import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-functions.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import app from "../js/firebase-sdk.js";

// Initialize Firebase Functions and Auth
const functions = getFunctions(app); // Pass the app instance
const auth = getAuth(app); // Pass the app instance
const db = getFirestore();

let selectedPlan = null; // Store the selected plan globally
let checkoutButtonListenerSetup = false;


// Get the Cloud Function for creating a checkout session
const createCheckoutSession = httpsCallable(functions, "createCheckoutSession");

console.log("Firebase and Stripe initialized");

// Function to handle plan selection
const handlePlanSelection = async (plan) => {
    if (!auth.currentUser) {
        alert("Please log in to proceed with payment.");
        return;
    }

    const userId = auth.currentUser.uid; // Get the current user's UID from Firebase Auth

    console.log("Plan selection in progress...");

    try {
        
        
        if (plan === "cancel") {
            // Confirm cancellation with the user
            const confirmCancel = window.confirm("Are you sure you want to cancel your subscription?");
            if (!confirmCancel) return; // Don't proceed if user cancels the confirmation

            // Call the backend function to cancel the subscription
            let result;
            try {
                result = await cancelSubscription({ plan, userId }); // Call your cancel subscription function here
                console.log("Cancel subscription result:", result);
            } catch (error) {
                console.error("Error during cancelSubscription:", error);
                return; // Exit if there's an error
            }

            alert("Your subscription has been canceled successfully.");
            return;
        } else {
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
        }
        
        
        
        

    } catch (error) {
        console.error("Error during checkout:", error);
    }
};

// Function to highlight the current plan
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

// Function to setup plan selection buttons
const setupPlanSelectionButtons = () => {
    console.log("Setting up plan selection buttons");

    // Add event listeners to all plan buttons
    document.querySelectorAll('.select-plan-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const plan = event.target.dataset.plan; // Get the plan from the button's data attribute
            console.log("Button with the following plan pressed and recognized: ", plan); // Debug log
            console.log("selected Plan:", selectedPlan );
            selectedPlan = plan; // Store the selected plan
            console.log("selected Plan:", selectedPlan );
            console.log("setup checkout Button function is being called");
            // After selecting a plan, setup the checkout button listener
            setupCheckoutButton();  // Call to setup checkout button listener
            console.log("setup checkout Button function called");
        });
    });
};



// Function to setup the checkout button event listener
const setupCheckoutButton = () => {
    // Prevent attaching the listener more than once
    if (checkoutButtonListenerSetup) return;

    const checkoutButtonSub = document.querySelector('.checkout-button[data-type="subscription"]'); // Use class selector

    if (checkoutButtonSub) {
        checkoutButtonSub.addEventListener('click', async () => {
            console.log("Checkout button pressed");

            // Check if a plan has been selected
            if (selectedPlan === null) {
                console.log("No plan selected, alerting user.");
                alert("Please select a plan before proceeding to checkout.");
                return; // Don't proceed if no plan is selected
            }

            console.log("Proceeding to checkout with selected plan:", selectedPlan);

            // Call the handlePlanSelection function with the stored plan
            try {
                await handlePlanSelection(selectedPlan); // Use the stored plan
            } catch (error) {
                console.error("Error during checkout process:", error);
            }
        });

        // Mark the listener as setup
        checkoutButtonListenerSetup = true;
    } else {
        console.error("Checkout button not found.");
    }
};




document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded event fired");
    setupPlanSelectionButtons();

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
});

// Export the setupPlanSelectionButtons function if needed
export { setupPlanSelectionButtons };
