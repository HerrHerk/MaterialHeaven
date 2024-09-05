import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';

// Initialize Firebase Functions and Auth
const functions = getFunctions();
const auth = getAuth();

// Get the Cloud Function for creating a checkout session
const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');

// Function to handle plan selection
const handlePlanSelection = async (plan) => {
  if (!auth.currentUser) {
    alert('Please log in to proceed with payment.');
    return;
  }

  try {
    // Call the Cloud Function to create a checkout session
    const result = await createCheckoutSession({ plan });
    const { id } = result.data;

    // Redirect to Stripe Checkout
    const stripe = Stripe('YOUR_PUBLISHABLE_STRIPE_KEY'); // Replace with your actual Stripe publishable key
    const { error } = await stripe.redirectToCheckout({ sessionId: id });

    if (error) {
      console.error('Error during checkout:', error);
    }
  } catch (error) {
    console.error('Error during checkout:', error);
  }
};

// Add event listeners to all plan buttons
document.querySelectorAll('.select-plan-btn').forEach(button => {
  button.addEventListener('click', (event) => {
    const plan = event.target.dataset.plan; // Get the plan from the button's data attribute
    handlePlanSelection(plan); // Call the function with the selected plan
  });
});
