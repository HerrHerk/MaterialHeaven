/* console.log("payment.js script loaded"); */

import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-functions.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import app from "../js/firebase-sdk.js";
import { getCartItems } from "../js/material-library.js"; // Import the utility function


// Initialize Firebase Functions and Auth
const functions = getFunctions(app); // Pass the app instance
const auth = getAuth(app); // Pass the app instance
const db = getFirestore();

// Get the Cloud Function for creating a checkout session
const createSCCheckout = httpsCallable(functions, "createSCCheckout");
const createCheckoutSession = httpsCallable(functions, "createCheckoutSession");

const livekey = Stripe("pk_live_51PqDNEHfaXGRtSlV5zENSUHECvyzD7WYp8zd6E5U6RrYYLOhoSXJ9iTDj4XVl8JNOOvaT7o1WnrJ47YqEN9wBNtr00a6jdbGWP");

const testkey = Stripe("pk_test_51PqDNEHfaXGRtSlVGqOOcDqIgYGSME9GKUZFAsdx1oJZk1XjrWxmdlunFeAZgHyoJgPT08RDprptLse6KdAk01QJ00l7ERpnMA");

const off = null;

const stripekey = testkey;


/* console.log("Firebase and Stripe initialized"); */

// Function to handle shopping cart checkout
const handleCartCheckout = async () => {
    console.log("handleCartCheckout function called");
    if (!auth.currentUser) {
        alert("Please log in to proceed with payment.");
        return;
    }

    const userId = auth.currentUser.uid; // Get the current user's UID from Firebase Auth
    const cartItems = getCartItems(); // Get the cart items from cookies
    const loadingDimmer = document.getElementById("loading-dimmer-checkout");

    if (loadingDimmer) {
        loadingDimmer.style.display = "flex"; // Make it visible
        console.log("Loading dimmer displayed");
    } else {
        console.log("Loading dimmer element not found");
    }

    try {
        console.log("Awaiting for createSCCheckout...");
        console.log("Material IDs:", cartItems);

        let result;
        try {
            result = await createSCCheckout({ materialIds: cartItems, userId });
            console.log("Checkout session result:", result); // Add this line for debugging
        } catch (error) {
            console.error("Error during createSCCheckout:", error);
            if (loadingDimmer) {
                loadingDimmer.style.display = "none"; // Hide dimmer on error
                console.log("Loading dimmer hidden due to error");
            }
            return; // Exit if there's an error, so you don't try to use undefined `result`
        }

        const { id } = result.data; // Safely access result.data here

        // Redirect to Stripe Checkout
        const stripe = stripekey; // Replace with your actual Stripe publishable key
        const { error } = await stripe.redirectToCheckout({ sessionId: id });

        if (error) {
            console.error("Error during checkout:", error);
            if (loadingDimmer) {
                loadingDimmer.style.display = "none"; // Hide dimmer on error
                console.log("Loading dimmer hidden due to error");
            }
        }
    } catch (error) {
        console.error("Error during checkout:", error);
    }
};


// Function to handle subscription checkout
const handleSubscriptionCheckout = async (plan) => {
    console.log("SUB CHECKOUT INITIATED!");

    if (!auth.currentUser) {
        alert("Please log in to proceed with payment.");
        return;
    }

    const userId = auth.currentUser.uid;
    const loadingDimmer = document.getElementById("loading-dimmer-checkout");

    if (loadingDimmer) {
        loadingDimmer.style.display = "flex"; // Show loading indicator
    }

    // Check if this is a cancellation request
    if (plan === "cancel") {
        try {
            console.log("Initiating subscription cancellation");
            
            // First, we need to determine which subscription to cancel
            const userDoc = await getDoc(doc(db, "users", userId));
            if (!userDoc.exists()) {
                throw new Error("User data not found");
            }
            
            // Assuming the user data contains the active subscription information
            const userData = userDoc.data();
            const subscriptions = userData.restricted?.subscriptions || {};
            
            // Find the active subscription category
            let activeCategory = null;
            for (const [category, isActive] of Object.entries(subscriptions)) {
                if (isActive) {
                    activeCategory = category;
                    break;
                }
            }
            
            if (!activeCategory) {
                throw new Error("No active subscription found to cancel");
            }
            
            // Call the cancelSubscription Cloud Function
            const cancelSubscription = httpsCallable(functions, "cancelSubscription");
            const result = await cancelSubscription({
                category: activeCategory,
                userId: userId
            });
            
            console.log("Cancellation result:", result);
            alert("Your subscription has been successfully canceled.");
            
            // Reload the page or update UI to reflect cancellation
            window.location.reload();
            
        } catch (error) {
            console.error("Error during subscription cancellation:", error);
            alert("There was an error canceling your subscription. Please try again.");
        } finally {
            if (loadingDimmer) {
                loadingDimmer.style.display = "none"; // Hide loading indicator
            }
        }
        return;
    }

    // Regular subscription flow for new subscriptions
    const validPlans = ['material', 'cad', 'simulation', 'complete'];
    
    // Map your UI plan names to the backend categories if needed
    const planMapping = {
        'basic': 'material',
        'standard': 'cad',
        'premium': 'simulation',
        'admin': 'complete'
        // Add any other mappings if your UI uses different terms than your backend
    };

    // Get the actual plan to use with Stripe
    const stripePlan = planMapping[plan] || plan;
    
    if (!validPlans.includes(stripePlan)) {
        alert("Invalid subscription plan selected.");
        if (loadingDimmer) {
            loadingDimmer.style.display = "none";
        }
        return;
    }

    try {
        console.log("Creating checkout session for plan:", stripePlan);
        
        const result = await createCheckoutSession({ 
            category: stripePlan, // Change 'plan' to 'category'
            userId 
        });
        
        console.log("Checkout session result:", result);

        if (!result.data || !result.data.id) {
            throw new Error("Invalid checkout session response");
        }

        // Redirect to Stripe Checkout
        const stripe = stripekey;
        await stripe.redirectToCheckout({ sessionId: result.data.id });
        
    } catch (error) {
        console.error("Error during subscription checkout:", error);
        alert("There was an error processing your subscription. Please try again.");
        
        if (loadingDimmer) {
            loadingDimmer.style.display = "none"; // Hide loading indicator on error
        }
    }
};



const setupCheckoutButton = (msg) => {
    console.log("setupCheckout Initiated from ", msg);

    // Clear any existing event listeners by cloning and replacing elements
    const cartButton = document.querySelector('.checkout-button[data-type="cart"]');
    const subscriptionButton = document.querySelector('.checkout-button[data-type="subscription"]');
    
    // Setup cart checkout button
    if (cartButton) {
        const newCartButton = cartButton.cloneNode(true);
        cartButton.parentNode.replaceChild(newCartButton, cartButton);
        
        console.log("Cart checkout button is detected");
        newCartButton.addEventListener('click', () => {
            handleCartCheckout();
        });
        
        // Observe changes to the cart checkout button
        const cartObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'disabled' && !newCartButton.disabled) {
                    console.log("Cart checkout button is now enabled");
                }
            });
        });
        
        cartObserver.observe(newCartButton, {
            attributes: true
        });
    }
    
    // Setup subscription checkout button
    if (subscriptionButton) {
        const newSubscriptionButton = subscriptionButton.cloneNode(true);
        subscriptionButton.parentNode.replaceChild(newSubscriptionButton, subscriptionButton);
        
        console.log("Subscription checkout button is detected");
        newSubscriptionButton.addEventListener('click', () => {
            const selectedPlanButton = document.querySelector('.select-plan-btn.selected');
            console.log("Selected plan button:", selectedPlanButton);
            
            if (selectedPlanButton && selectedPlanButton.dataset.plan) {
                const plan = selectedPlanButton.dataset.plan;
                console.log("Selected plan:", plan);
                handleSubscriptionCheckout(plan);
            } else {
                alert("Please select a plan before proceeding.");
            }
        });
        
        // Observe changes to the subscription checkout button
        const subscriptionObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'disabled' && !newSubscriptionButton.disabled) {
                    console.log("Subscription checkout button is now enabled");
                }
            });
        });
        
        subscriptionObserver.observe(newSubscriptionButton, {
            attributes: true
        });
    }
    
    // If neither button was found, log an error
    if (!cartButton && !subscriptionButton) {
        console.log("No checkout buttons detected, something is wrong");
    }

    // Hide the dimmer when Stripe checkout is completed
    window.addEventListener("popstate", () => {
        const loadingDimmer = document.getElementById("loading-dimmer-checkout");
        if (loadingDimmer) {
            loadingDimmer.style.display = "none";
            console.log("Loading dimmer hidden");
        }
    });
};

document.addEventListener('DOMContentLoaded', () => {
    /* console.log("DOMContentLoaded event fired"); */
    setupCheckoutButton("base run");
});

// Export the setupCheckoutButton function if needed
export { setupCheckoutButton };

