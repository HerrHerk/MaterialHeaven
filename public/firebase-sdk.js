// firebase-sdk.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";

const firebaseConfig = {
    apiKey: "AIzaSyC1UClD0vkqDkvmmFGdFoIvhanMHvPeVuk",
    authDomain: "contacts-e0803.firebaseapp.com",
    projectId: "contacts-e0803",
    storageBucket: "contacts-e0803.appspot.com",
    messagingSenderId: "30563347000",
    appId: "1:30563347000:web:bd9a5d7ee4fb3173acd4cd"
};

const app = initializeApp(firebaseConfig);

export default app;
