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
        const stripe = Stripe("pk_live_51PqDNEHfaXGRtSlV5zENSUHECvyzD7WYp8zd6E5U6RrYYLOhoSXJ9iTDj4XVl8JNOOvaT7o1WnrJ47YqEN9wBNtr00a6jdbGWP"); // Replace with your actual Stripe publishable key
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

    const userId = auth.currentUser.uid; // Get the current user's UID from Firebase Auth

    try {
        // Call the Cloud Function to create a checkout session
        console.log("Awaiting for createCheckoutSession...");
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



// Function to setup the checkout button
const setupCheckoutButton = (msg) => {
    /* console.log("Setting up checkout button"); */

    console.log("setupCheckout Initiated from ", msg)

    const checkoutButton = document.querySelector('.checkout-button');
    if (checkoutButton) {
        console.log("Checkout button is detected");
        checkoutButton.addEventListener('click', (event) => {
            const type = event.target.dataset.type;
            if (type === "cart") {
                handleCartCheckout();
            } else if (type === "subscription") {
                const plan = document.querySelector('.select-plan-btn.selected')?.dataset.plan;
                if (plan) {
                    handleSubscriptionCheckout(plan);
                } else {
                    alert("Please select a plan before proceeding.");
                }
            }
        });
    } else {
        console.log("Checkout Button is NOT detected, something is wrong");
    }

    //TODO A FASZOM CHATBOT NEM AKARJA: GYAKORLATILAG A CART MELLE EGY SUBOS DATA TYPE IS KELL: A MAT LIBBÖL KELL KÜLÖN UTASITAST ADNI MELYIK AZ INPUT ES ARRA KET KÜLÖN OBSERVERT FELALLITANI

    // Observe changes to the checkout button
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'disabled') {
                const checkoutButton = document.querySelector('.checkout-button[data-type="cart"]');
                if (checkoutButton && !checkoutButton.disabled) {
                    console.log("Checkout button is now enabled");
                    checkoutButton.addEventListener('click', (event) => {
                        const type = event.target.dataset.type;
                        if (type === "cart") {
                            handleCartCheckout();
                        } else if (type === "subscription") {
                            const plan = document.querySelector('.select-plan-btn.selected')?.dataset.plan;
                            if (plan) {
                                handleSubscriptionCheckout(plan);
                            } else {
                                alert("Please select a plan before proceeding.");
                            }
                        }
                    });
                }
            }
        });
    });

    if (checkoutButton) {
        observer.observe(checkoutButton, {
            attributes: true
        });
    }

    // Hide the dimmer when Stripe checkout is completed
    window.addEventListener("popstate", () => {
        const loadingDimmer = document.getElementById("loading-dimmer-checkout");
        if (loadingDimmer) {
            loadingDimmer.style.display = "none";
            console.log("Loading dimmer hidden");
        } else {
            console.log("Loading dimmer element not found");
        }
    });
};

document.addEventListener('DOMContentLoaded', () => {
    /* console.log("DOMContentLoaded event fired"); */
    setupCheckoutButton("base run");
});

// Export the setupCheckoutButton function if needed
export { setupCheckoutButton };

