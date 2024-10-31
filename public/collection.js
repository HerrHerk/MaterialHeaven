//------------------------------------------------------------
// IMPORTS
//------------------------------------------------------------


import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDoc,
    getDocs,
    onSnapshot, 
    doc, 
    updateDoc, 
    deleteDoc,
    deleteField 
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js"

import { 
    getFunctions, httpsCallable 
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-functions.js";

const db = getFirestore();
const dbRef = collection(db, "materialCollection");
const functions = getFunctions();

import app from './firebase-sdk.js';
import { 
    getAuth,
    onAuthStateChanged, 
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

import { 
    signUpLogInBtnPressed,
    needAnAccountBtnPressed,
} from './auth.js';



const auth = getAuth(app);
const user = auth.currentUser;

const sortMaterialsByTierAndType = async () => {
    try {
        // Fetch all materials
        const querySnapshot = await getDocs(dbRef);

        // Material category lists
        const categorizedMaterials = {
            steel: {},
            aluminium: {},
            iron: {},
            "special metal": {},
            other: {}
        };

        // Iterate through the documents in materialCollection
        querySnapshot.forEach((doc) => {
            const materialData = doc.data();
            const materialId = doc.id;

            // Access materialInfo map and set defaults
            const materialInfo = materialData.materialInfo || {};
            const {
                name = "Unnamed Material",
                version = "0",
                material = "other",
                tier = "free",
                icon = "",
                description = []
            } = materialInfo;

            const materialType = material.toLowerCase();
            const descriptionArray = Array.isArray(description) ? description : [];

            // Initialize family group if not exists
            if (!categorizedMaterials[materialType]) {
                categorizedMaterials[materialType] = {};
            }

            // Initialize family block for the specific material name if it doesn't exist
            if (!categorizedMaterials[materialType][name]) {
                categorizedMaterials[materialType][name] = [];
            }

            // Push the material into its respective family block within the category
            categorizedMaterials[materialType][name].push({
                id: materialId,
                version,
                tier,
                icon,
                description: descriptionArray
            });
        });

        // Select the main container to hold all category divs
        const materialsContainer = document.getElementById('materials-list');
        materialsContainer.innerHTML = ''; // Clear previous content

        // Iterate through categorized materials and build HTML structure
        Object.entries(categorizedMaterials).forEach(([category, families]) => {
            if (Object.keys(families).length === 0) return;

            // Create a category div with an ID based on the category name
            const categoryDiv = document.createElement('div');
            categoryDiv.classList.add('category-block');
            categoryDiv.id = `category-${category.replace(/\s+/g, '-').toLowerCase()}`;

            // Create and append the header for the category
            const categoryHeader = document.createElement('h2');
            categoryHeader.classList.add('category-header');
            categoryHeader.innerText = `${category.charAt(0).toUpperCase() + category.slice(1)} - explicit material models for simulation`;
            categoryDiv.appendChild(categoryHeader);

            // Create a div to hold all family blocks under this category
            const categoryBody = document.createElement('div');
            categoryBody.classList.add('category-body');

            // Sort families alphabetically by family name
            const sortedFamilies = Object.entries(families).sort(([a], [b]) => a.localeCompare(b));

            // Populate category body with family blocks
            sortedFamilies.forEach(([familyName, materials]) => {
                // Create a family block with an ID based on the family name
                const familyBlock = document.createElement('div');
                familyBlock.classList.add('family-block');
                familyBlock.id = `family-${familyName.replace(/\s+/g, '-').toLowerCase()}`;

                // Family header for the material name
                const familyHeader = document.createElement('h3');
                familyHeader.classList.add('family-header');
                familyHeader.innerText = `${familyName} - Johnson and Cook models`;
                familyBlock.appendChild(familyHeader);

                // Sort materials by version within each family
                materials.sort((a, b) => a.version.localeCompare(b.version));

                // Populate family block with material blocks
                materials.forEach((material) => {
                    const { id, version, tier, icon, description } = material;

                    // Create a material block with an ID based on the material ID
                    const materialBlock = document.createElement('div');
                    materialBlock.classList.add('material-block');
                    materialBlock.id = `material-${id}`;

                    // Upper part for version only (no text "Version")
                    const versionHeader = document.createElement('h4');
                    versionHeader.classList.add('material-version');
                    versionHeader.innerText = version;
                    materialBlock.appendChild(versionHeader);

                    // Bottom part divided into four flex divs with rule 1:3:2:1
                    const bottomPart = document.createElement('div');
                    bottomPart.classList.add('bottom-part');
                    bottomPart.style.display = "flex";

                    // 1st div for the icon
                    const iconDiv = document.createElement('div');
                    iconDiv.classList.add('material-icon');
                    iconDiv.style.flex = "1";
                    iconDiv.innerHTML = icon || "";
                    bottomPart.appendChild(iconDiv);

                    // 2nd div for description list
                    const descriptionDiv = document.createElement('div');
                    descriptionDiv.classList.add('description-list');
                    descriptionDiv.style.flex = "3";
                    const descriptionList = document.createElement('ul');
                    if (description.length > 0) {
                        description.forEach(point => {
                            const listItem = document.createElement('li');
                            listItem.innerText = point;
                            descriptionList.appendChild(listItem);
                        });
                    } else {
                        const placeholder = document.createElement('li');
                        placeholder.innerText = "No description available.";
                        descriptionList.appendChild(placeholder);
                    }
                    descriptionDiv.appendChild(descriptionList);
                    bottomPart.appendChild(descriptionDiv);

                    // 3rd div empty for now
                    const emptyDiv = document.createElement('div');
                    emptyDiv.style.flex = "2";
                    bottomPart.appendChild(emptyDiv);

                    // 4th div for tier
                    const tierDiv = document.createElement('div');
                    tierDiv.classList.add('material-tier');
                    tierDiv.style.flex = "1";
                    tierDiv.innerText = tier;
                    bottomPart.appendChild(tierDiv);

                    // Append the bottom part to the material block
                    materialBlock.appendChild(bottomPart);

                    // Append the material block to the family block
                    familyBlock.appendChild(materialBlock);
                });

                // Append the family block to the category body
                categoryBody.appendChild(familyBlock);
            });

            // Append the category body to the category div
            categoryDiv.appendChild(categoryBody);

            // Append the category div to the main materials container
            materialsContainer.appendChild(categoryDiv);
        });

    } catch (error) {
        console.error("Error fetching materials:", error);
    }
};


sortMaterialsByTierAndType();