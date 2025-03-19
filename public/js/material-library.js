/* ==========================================
==========================================
==========================================
   MATERIAL-LIBRARY.JS
   ==========================================
   ==========================================
========================================== *///------------------------------------------------------------
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

import { setupCheckoutButton } from '../js/payment.js';
import { monitorCheckboxes } from '../js/modal.js';


const auth = getAuth(app);
let user = null; // Store user globally
let userData = null;
let userTier = null;


// Listen for authentication state changes
onAuthStateChanged(auth, async (authUser) => {
    user = authUser; // Update the global user variable
    if (user) {
        // Show the loader
        loader.classList.add('active');
        try {
            // Fetch user data from Firestore
            const userDocRef = doc(db, "users", user.uid); // "users" collection, document named after user ID
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                userData = userDocSnap.data(); // Extract user data
                console.log("User Data:", userData);

                // Call the function to check and apply the admin visibility
                checkAdminButtonVisibility();
            } else {
                console.error("No user document found for ID:", user.uid);
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }

        // User is authenticated, now we can call the cloud function
        await getmaterials(); // Wait for getmaterials to finish
        /* console.log(items); // Now materials will have the fetched data */
    } else {
        console.log("No user is logged in.");
    }
    
});

const initializeLibraryWithGrouping = () => {
    const tabs = document.querySelectorAll('.tab');
    const databankContent = document.querySelector('.databank-content');

    const renderMaterialsByCategory = async (selectedCategory) => {
        try {
            const querySnapshot = await getDocs(dbRef);

            const categorizedMaterials = {};

            querySnapshot.forEach((doc) => {
                const materialData = doc.data();
                const materialId = doc.id;

                const {
                    materialInfo: {
                        name = "Unnamed Material",
                        version = "0",
                        material = "other",
                        tier = "free",
                        icon = "default",
                        description = []
                    } = {}
                } = materialData;

                const materialType = material.toLowerCase();
                const normalizedMaterialType = materialType.replace(/\s+/g, '-').toLowerCase();
                const normalizedSelectedCategory = selectedCategory.replace(/\s+/g, '-').toLowerCase();

                if (normalizedMaterialType !== normalizedSelectedCategory) return;

                if (!categorizedMaterials[materialType]) {
                    categorizedMaterials[materialType] = {};
                }

                if (!categorizedMaterials[materialType][name]) {
                    categorizedMaterials[materialType][name] = {
                        icon: `../assets/images/Design/${icon}-icon.png`,
                        description: Array.isArray(description) ? description : [],
                        materials: []
                    };
                }

                categorizedMaterials[materialType][name].materials.push({
                    id: materialId,
                    version,
                    tier,
                    name
                });
            });

            databankContent.innerHTML = '';

            Object.entries(categorizedMaterials).forEach(([category, families]) => {
                if (Object.keys(families).length === 0) return;

                const categoryDiv = document.createElement('div');
                categoryDiv.classList.add('category-block');
                categoryDiv.id = `category-${category.replace(/\s+/g, '-').toLowerCase()}`;

/*                 const categoryHeader = document.createElement('h1');
                categoryHeader.classList.add('category-header');
                categoryHeader.innerText = `${category.charAt(0).toUpperCase() + category.slice(1)} - Materials`;
                categoryDiv.appendChild(categoryHeader); */

                const categoryBody = document.createElement('div');
                categoryBody.classList.add('category-body');

                Object.entries(families).sort(([a], [b]) => a.localeCompare(b)).forEach(([familyName, familyData]) => {
                    const { icon, description, materials } = familyData;

                    const familyBlock = document.createElement('div');
                    familyBlock.classList.add('family-block');
                    familyBlock.id = `family-${familyName.replace(/\s+/g, '-').toLowerCase()}`;

                    const familyHeader = document.createElement('div');
                    familyHeader.classList.add('family-header');

                    const familyNameHeader = document.createElement('h3');
                    familyNameHeader.classList.add('family-name');
                    familyNameHeader.innerText = familyName;
                    familyHeader.appendChild(familyNameHeader);

                    const dividerFull = document.createElement('div');
                    dividerFull.classList.add('divider-full');
                    familyHeader.appendChild(dividerFull);

                    const iconDescription = document.createElement('div');
                    iconDescription.classList.add('icon-description');

                    const iconImg = document.createElement('img');
                    iconImg.src = icon;
                    iconImg.alt = `${familyName} icon`;
                    iconImg.classList.add('family-icon');
                    iconDescription.appendChild(iconImg);

                    const descriptionList = document.createElement('ul');
                    descriptionList.classList.add('description-list');

                    description.forEach((point) => {
                        const listItem = document.createElement('li');
                        listItem.classList.add('description-item');
                        listItem.innerText = point;
                        descriptionList.appendChild(listItem);
                    });

                    iconDescription.appendChild(descriptionList);

                    familyHeader.appendChild(iconDescription);
                    familyBlock.appendChild(familyHeader);

                    const dividerFull2 = document.createElement('div');
                    dividerFull2.classList.add('divider-full');
                    familyHeader.appendChild(dividerFull2);

                    const materialsContainer = document.createElement('div');
                    materialsContainer.classList.add('materials-container');

                    materials.sort((a, b) => a.version.localeCompare(b.version)).forEach((material) => {
                        const { id, version, tier } = material;

                        const materialBlock = document.createElement('div');
                        materialBlock.classList.add('material-block');
                        materialBlock.id = `material-${id}`;
                        materialBlock.dataset.materialId = id; // Set a data attribute for easier lookup

                        materialBlock.innerHTML = `
                            <h4 class="material-version">${version}</h4>
                            <div class="material-tier">Quality: ${tier}</div>
                        `;
                        /* <div class="material-tier">Quality: ${tier}</div> */




                        // Event listener to open the material modal when a block is clicked
                        // Event listener to open the material modal when a block is clicked
                        materialBlock.addEventListener('click', () => {
                            if (user) { // Use the global 'user' variable
                                const modal = document.getElementById(`modal-${id}`);
                                console.log(id, "clicked");

                                if (modal) {
                                    modal.classList.remove('hidden-modal');
                                    modal.classList.add('visible-modal');

                                    // Populate the content of the modal dynamically when clicked
                                    populateModalContent(id);

                                    // Make sure the modal container is visible
                                    const modalContainer = document.getElementById('modal-container-material');
                                    if (modalContainer) {
                                        modalContainer.style.display = 'flex';
                                        document.body.classList.add('no-scroll');
                                    }
                                }
                            } else {
                                // Show an error message in the login form
                                const loginErrorMessage = document.getElementById('login-error-message');
                                if (loginErrorMessage) {
                                    loginErrorMessage.textContent = "You need to log in to access this content.";
                                    loginErrorMessage.style.display = 'block'; // Ensure it's visible
                                }
                        
                                // If no user is logged in, open the login modal
                                if (typeof window.loadModal === "function") {
                                    window.loadModal('modal-signup-login');
                                } else {
                                    console.error("loadModal function is not available. Ensure modal.js is loaded before material-library.js.");
                                }
                            }
                        });


                        materialsContainer.appendChild(materialBlock);
                    });

                    familyBlock.appendChild(materialsContainer);
                    categoryBody.appendChild(familyBlock);
                });

                categoryDiv.appendChild(categoryBody);
                databankContent.appendChild(categoryDiv);
            });
        } catch (error) {
            console.error("Error fetching materials:", error);
            databankContent.innerHTML = `<p>Error fetching materials. Please try again later.</p>`;
        }
    };

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            tabs.forEach((t) => t.classList.remove('active'));
            tab.classList.add('active');
            const selectedCategory = tab.getAttribute('data-target');
            renderMaterialsByCategory(selectedCategory);
        });
    });

    const firstTab = tabs[0];
    if (firstTab) {
        firstTab.classList.add('active');
        renderMaterialsByCategory(firstTab.getAttribute('data-target'));
    }

    
};

initializeLibraryWithGrouping();

let items = []
let activeItem = null; // This will hold the currently selected item



const getmaterials = async () => {
    try {
        const getFilteredMaterialsFn = httpsCallable(functions, 'getFilteredMaterials'); 
        const result = await getFilteredMaterialsFn();
        
        items = result.data.materials.map(material => {
            return {
                ...material, // Keep all existing properties
                materialModels: {
                    ...material.materialModels, // Keep existing materialModels
                    physicalProperties: {
                        ...material.materialModels?.physicalProperties, 
                        tensile_failure_stress: material.materialModels?.physicalProperties?.tensile_failure_stress ?? null,
                        isotropic_thermal_conductivity: material.materialModels?.physicalProperties?.isotropic_thermal_conductivity ?? null
                    },
                    shockEOS: {
                        ...material.materialModels?.shockEOS,
                        alpha: material.materialModels?.shockEOS?.alpha ?? null // New property
                    }
                }
            };
        });

        createMaterialModals();
    } catch (err) {
        console.log("getmaterials error: ", err);
    }
};



// Function to check the user tier and hide the admin button container
function checkAdminButtonVisibility(materialId) {
    userTier = userData.restricted && userData.restricted.tier;
    const adminButtonContainer = document.querySelector('.admin-button-container');
    const adminButtonContainerAlt = document.querySelector(`.admin-button-container-alt[data-id="${materialId}"]`);

    console.log("Checking admin button visibility for materialId:", materialId);
    console.log("Selected elements:", adminButtonContainer, adminButtonContainerAlt, "User tier:", userTier);

    if (adminButtonContainer) {
        if (userTier !== "admin") {
            adminButtonContainer.style.display = 'none';
            
        } else {
            adminButtonContainer.style.display = 'flex'; // Or any other visibility style you prefer
            
        }
    }
    if (adminButtonContainerAlt) {
        if (userTier !== "admin") {
            
            adminButtonContainerAlt.style.display = 'none';
        } else {
            
            adminButtonContainerAlt.style.display = 'flex';
        }
    }
}





const loader = document.getElementById('loader');



async function createMaterialModals() {
    const modalContainerMaterial = document.getElementById('modal-container-material');



    if (!modalContainerMaterial) {
        console.error("Modal container for materials not found!");
        return;
    }


    // Load the base modal structure
    try {
        const response = await fetch('/modal/modal-base.html');
        if (!response.ok) {
            throw new Error('Failed to load base modal structure');
        }
        const baseData = await response.text();

        // Modify the base modal structure to use `modal-inner-content-material` and `.modal-content-material`
        const parser = new DOMParser();
        const baseDoc = parser.parseFromString(baseData, 'text/html');
        const modalContent = baseDoc.querySelector('.modal-content');

        // Rename `.modal-content` to `.modal-content-material` for the material modals
        modalContent.classList.remove('modal-content');
        modalContent.classList.add('modal-content-material');

        // Rename `modal-inner-content` to `modal-inner-content-material`
        const modalInnerContent = modalContent.querySelector('#modal-inner-content');
        modalInnerContent.id = 'modal-inner-content-material';

        // Append the modified structure to the container
        modalContainerMaterial.innerHTML = baseDoc.body.innerHTML;

        const modalInnerContentMaterial = document.getElementById('modal-inner-content-material');

        if (!modalInnerContentMaterial) {
            console.error('Failed to create or find modal-inner-content-material.');
            return;
        }

        items.forEach(item => {
            // Destructure properties from each item
            const {
                materialInfo: {
                    name = "Unnamed Material",
                    version = "0",
                    icon = ""
                } = {},
                id: materialId = "unknown-id"  // Ensure this doesn't conflict with other variables
            } = item;


        
            // Create the modal structure dynamically
            const modalDiv = document.createElement('div');
            modalDiv.id = `modal-${materialId}`;
            modalDiv.classList.add('hidden-modal');



            // Insert the content for the modal
            modalDiv.innerHTML = `
            <div class="header-flex-container">
                <h2>${name} - ${version}</h2>
                <img src="../assets/images/Design/${icon}-icon.png" alt="Material Icon" class="material-icon">

            </div>

            <div class="close-button-container">
                <button class="close-button">Close</button>
            </div>
        `;

            // Append the modal to the modal inner content container
            modalInnerContentMaterial.appendChild(modalDiv);

            // Initialize charts
            /* initializeCharts(materialId, johnsonCookStrength, johnsonCookFailure); */

        });


        // Create a new "empty" modal with static values
        const newMaterialDiv = document.createElement('div');
        newMaterialDiv.id = `modal-00000000`; // Static ID
        newMaterialDiv.classList.add('hidden-modal');

        newMaterialDiv.innerHTML = `
        <div class="header-flex-container">
            <h2>Create New Material </h2>
            <img src="../assets/images/Design/add-icon.png" alt="New Material Icon" class="material-icon">
        </div>
        <div class="close-button-container">
            <button class="close-button">Close</button>
        </div>
        `;

        // Append the new modal to the modal inner content container
        modalInnerContentMaterial.appendChild(newMaterialDiv);

        console.log("Successfulyl loaded the base modal structure");

        /* console.log("Material modals created successfully!"); */
    } catch (error) {
        console.error("Error in createMaterialModals:", error);
    } finally {
        // Hide the loader
        loader.classList.remove('active');
    }

    setupAddButtonListener();

    
}


async function populateModalContent(materialId) {
    // Find the modal by its ID
    const modal = document.getElementById(`modal-${materialId}`);
    if (!modal) {
        console.error(`Modal with ID ${materialId} not found.`);
        return;
    }

    // Handle the special case for materialId "00000000"
    let item;
    
    if (materialId === "00000000") {
        item = {
            materialInfo: {
                name: "New Material",
                version: "new version",
                icon: "add",
                tier: "",
                price: "",
                materialName: "", // Dropdown with material options (Steel, Aluminium, etc.)
                description: [] // Array of strings for multi-line description
            },
            materialModels: {
                physicalProperties: {
                    density: null, // [kg/m³]
                    specific_heat: null, // [J/kgK]
                    isotropic_thermal_conductivity: null, // [W/mK]
                    tensile_failure_stress: null // [MPa]
                },
                isotropicElasticity: {
                    e_modulus: null, // Young's Modulus [GPa]
                    poisson: null, // Poisson Ratio [-]
                    shear_modulus: null, // Shear Modulus [GPa]
                    bulk_modulus: null // Bulk Modulus [GPa]
                },
                johnsonCookStrength: {
                    initial_yield_strength: null, // A [MPa]
                    hardening_constant: null, // B [MPa]
                    hardening_exponent: null, // n [-]
                    strain_rate_constant: null, // C [-]
                    thermal_softening_exp: null, // m [-]
                    melting_temperature: null, // M [K]
                    reference_strain_rate: null // ε₀ [1/s]
                },
                johnsonCookFailure: {
                    initial_failure_strain: null, // D₁ [-]
                    exponential_factor: null, // D₂ [-]
                    triaxial_factor: null, // D₃ [-]
                    strain_rate_factor: null, // D₄ [-]
                    temperature_factor: null, // D₅ [-]
                    reference_strain_rate_alt: null // ε_alt [1/s]
                },
                shockEOS: {
                    grueneisen_coefficient: null, // γ [-]
                    parameter_c1: null, // C₁ [m/s]
                    parameter_s1: null, // S₁ [-]
                    parameter_quadratic: null, // S₂ [s/m]
                    alpha: null // [-]
                }
            },
            additionalInfo: {
                reference: "", // Editable text or link
                source: "" // Editable text for source
            }
        };
        
    } else {
        // Find the corresponding item from the items array
        item = items.find(item => item.id === materialId);
        if (!item) {
            console.error(`Item with ID ${materialId} not found in the items array.`);
            return;
        }
    }

    

    // Set the activeItem to the currently selected item
    activeItem = item;

    

    const {
        materialInfo: {
            name = "",
            version = "",
            icon = "",
            tier = "",
            price = "",
            material: materialName = "",
            description = []
        } = {},
        materialModels: {
            physicalProperties = {},
            isotropicElasticity = {},
            johnsonCookStrength = {},
            johnsonCookFailure = {},
            shockEOS = {}
        } = {},
        additionalInfo: {
            reference = "",
            source = ""
        } = {},
        
    } = item;


    // Function to check if the value is missing data
    const isMissingData = (value) => value === null || value === undefined || value === '';

    // Function to determine if a row should have the missing-data class
    const shouldRowBeMissing = (values) => values.some(isMissingData);

    // Function to format the value
    const formatValue = (value) => (isMissingData(value) ? 'N/A' : value);

    const editable = modal.dataset.editable === "true";

    const renderValue = (key, value, unit) => {
        // Ensure value is defined and convert null/undefined to an empty string
        const safeValue = value !== undefined && value !== null ? value : "";
    
        // If the value is "N/A" and editable, make it an empty string
        const editableValue = safeValue === 'N/A' ? "" : safeValue;
    
        if (editable) {
            // Only make the third cell (the value) editable, not the unit
            return `<input type="text" name="${key}" value="${editableValue}" class="editable-input" />`; // No unit here
        }
        return `<span>${formatValue(safeValue)}</span>`; // Display only the value when not editable, no unit here
    };
    
    
    function getFormContainers(isEditable) {
        if (isEditable) {
            // Merge common fields with edit-only fields
            return [...commonFormContainers, ...editModeFormContainers];
        }
        // Return only common fields
        return [...commonFormContainers];
    }
    


    // Generate placeholder content for each form container
    const commonFormContainers = [


        {
            title: "Johnson Cook Strength",
            placeholder: `
                <div class="property-grid">
                    <div class="property-row ${shouldRowBeMissing([johnsonCookStrength.initial_yield_strength]) ? 'missing-data' : ''}">
                        <div class="property-cell narrow-cell">A</div>
                        <div class="property-cell wide-cell">Initial Yield Strength</div>
                        <div class="property-cell wide-cell">${renderValue('initial_yield_strength', johnsonCookStrength.initial_yield_strength)}</div>
                        <div class="property-cell narrow-cell">[MPa]</div>
                    </div>
                    <div class="property-row ${shouldRowBeMissing([johnsonCookStrength.hardening_constant]) ? 'missing-data' : ''}">
                        <div class="property-cell narrow-cell">B</div>
                        <div class="property-cell wide-cell">Hardening Constant</div>
                        <div class="property-cell wide-cell">${renderValue('hardening_constant', johnsonCookStrength.hardening_constant)}</div>
                        <div class="property-cell narrow-cell">[MPa]</div>
                    </div>
                    <div class="property-row ${shouldRowBeMissing([johnsonCookStrength.hardening_exponent]) ? 'missing-data' : ''}">
                        <div class="property-cell narrow-cell">n</div>
                        <div class="property-cell wide-cell">Hardening Exponent</div>
                        <div class="property-cell wide-cell">${renderValue('hardening_exponent', johnsonCookStrength.hardening_exponent)}</div>
                        <div class="property-cell narrow-cell">[-]</div>
                    </div>
                    <div class="property-row ${shouldRowBeMissing([johnsonCookStrength.strain_rate_constant]) ? 'missing-data' : ''}">
                        <div class="property-cell narrow-cell">C</div>
                        <div class="property-cell wide-cell">Strain Rate Constant</div>
                        <div class="property-cell wide-cell">${renderValue('strain_rate_constant', johnsonCookStrength.strain_rate_constant)}</div>
                        <div class="property-cell narrow-cell">[-]</div>
                    </div>
                    <div class="property-row ${shouldRowBeMissing([johnsonCookStrength.thermal_softening_exp]) ? 'missing-data' : ''}">
                        <div class="property-cell narrow-cell">m</div>
                        <div class="property-cell wide-cell">Thermal Softening Exponent</div>
                        <div class="property-cell wide-cell">${renderValue('thermal_softening_exp', johnsonCookStrength.thermal_softening_exp)}</div>
                        <div class="property-cell narrow-cell">[-]</div>
                    </div>
                    <div class="property-row ${shouldRowBeMissing([johnsonCookStrength.melting_temperature]) ? 'missing-data' : ''}">
                        <div class="property-cell narrow-cell">M</div>
                        <div class="property-cell wide-cell">Melting Temperature</div>
                        <div class="property-cell wide-cell">${renderValue('melting_temperature', johnsonCookStrength.melting_temperature)}</div>
                        <div class="property-cell narrow-cell">[K]</div>
                    </div>
                    <div class="property-row ${shouldRowBeMissing([johnsonCookStrength.reference_strain_rate]) ? 'missing-data' : ''}">
                        <div class="property-cell narrow-cell">&#949<sub>0</sub></div>
                        <div class="property-cell wide-cell">Reference Strain Rate</div>
                        <div class="property-cell wide-cell">${renderValue('reference_strain_rate', johnsonCookStrength.reference_strain_rate)}</div>
                        <div class="property-cell narrow-cell">[1/s]</div> <!-- This is where the unit stays static -->
                    </div>
                </div>
            `
        },
        
        {
            title: "Johnson Cook Failure",
            placeholder: `
                <div class="property-grid">
                    <div class="property-row ${shouldRowBeMissing([johnsonCookFailure.initial_failure_strain]) ? 'missing-data' : ''}">
                        <div class="property-cell narrow-cell">D<sub>1</sub></div>
                        <div class="property-cell wide-cell">Initial Failure Strain</div>
                        <div class="property-cell wide-cell">${renderValue('initial_failure_strain', johnsonCookFailure.initial_failure_strain)}</div>
                        <div class="property-cell narrow-cell">[-]</div>
                    </div>
                    <div class="property-row ${shouldRowBeMissing([johnsonCookFailure.exponential_factor]) ? 'missing-data' : ''}">
                        <div class="property-cell narrow-cell">D<sub>2</sub></div>
                        <div class="property-cell wide-cell">Exponential Factor</div>
                        <div class="property-cell wide-cell">${renderValue('exponential_factor', johnsonCookFailure.exponential_factor)}</div>
                        <div class="property-cell narrow-cell">[-]</div>
                    </div>
                    <div class="property-row ${shouldRowBeMissing([johnsonCookFailure.triaxial_factor]) ? 'missing-data' : ''}">
                        <div class="property-cell narrow-cell">D<sub>3</sub></div>
                        <div class="property-cell wide-cell">Triaxial Factor</div>
                        <div class="property-cell wide-cell">${renderValue('triaxial_factor', johnsonCookFailure.triaxial_factor)}</div>
                        <div class="property-cell narrow-cell">[-]</div>
                    </div>
                    <div class="property-row ${shouldRowBeMissing([johnsonCookFailure.strain_rate_factor]) ? 'missing-data' : ''}">
                        <div class="property-cell narrow-cell">D<sub>4</sub></div>
                        <div class="property-cell wide-cell">Strain Rate Factor</div>
                        <div class="property-cell wide-cell">${renderValue('strain_rate_factor', johnsonCookFailure.strain_rate_factor)}</div>
                        <div class="property-cell narrow-cell">[-]</div>
                    </div>
                    <div class="property-row ${shouldRowBeMissing([johnsonCookFailure.temperature_factor]) ? 'missing-data' : ''}">
                        <div class="property-cell narrow-cell">D<sub>5</sub></div>
                        <div class="property-cell wide-cell">Temperature Factor</div>
                        <div class="property-cell wide-cell">${renderValue('temperature_factor', johnsonCookFailure.temperature_factor)}</div>
                        <div class="property-cell narrow-cell">[-]</div>
                    </div>
                    <div class="property-row ${shouldRowBeMissing([johnsonCookFailure.reference_strain_rate_alt]) ? 'missing-data' : ''}">
                        <div class="property-cell narrow-cell">&#949<sub>alt</sub></div>
                        <div class="property-cell wide-cell">Optional Strain Rate</div>
                        <div class="property-cell wide-cell">${renderValue('reference_strain_rate_alt', johnsonCookFailure.reference_strain_rate_alt)}</div>
                        <div class="property-cell narrow-cell">[1/s]</div>
                    </div>
                </div>
            `
        },
        {
            title: "Shock EOS",
            placeholder: `
                <div class="property-grid">
                    <div class="property-row ${shouldRowBeMissing([shockEOS.grueneisen_coefficient]) ? 'missing-data' : ''}">
                        <div class="property-cell narrow-cell">γ</div>
                        <div class="property-cell wide-cell">Grueneisen Coefficient</div>
                        <div class="property-cell wide-cell">${renderValue('grueneisen_coefficient', shockEOS.grueneisen_coefficient)}</div>
                        <div class="property-cell narrow-cell">[-]</div>
                    </div>
                    <div class="property-row ${shouldRowBeMissing([shockEOS.parameter_c1]) ? 'missing-data' : ''}">
                        <div class="property-cell narrow-cell">C<sub>1</sub></div>
                        <div class="property-cell wide-cell">Bulk Sound Speed</div>
                        <div class="property-cell wide-cell">${renderValue('parameter_c1', shockEOS.parameter_c1)}</div>
                        <div class="property-cell narrow-cell">[m/s]</div>
                    </div>
                    <div class="property-row ${shouldRowBeMissing([shockEOS.parameter_s1]) ? 'missing-data' : ''}">
                        <div class="property-cell narrow-cell">S<sub>1</sub></div>
                        <div class="property-cell wide-cell">1st Order Hugoniot Slope Coeff.</div>
                        <div class="property-cell wide-cell">${renderValue('parameter_s1', shockEOS.parameter_s1)}</div>
                        <div class="property-cell narrow-cell">[-]</div>
                    </div>
                    <div class="property-row ${shouldRowBeMissing([shockEOS.parameter_quadratic]) ? 'missing-data' : ''}">
                        <div class="property-cell narrow-cell">S<sub>2</sub></div>
                        <div class="property-cell wide-cell">Quadratic Hugoniot Slope Coeff.</div>
                        <div class="property-cell wide-cell">${renderValue('parameter_quadratic', shockEOS.parameter_quadratic)}</div>
                        <div class="property-cell narrow-cell">[s/m]</div>
                    </div>
                    <div class="property-row ${shouldRowBeMissing([shockEOS.alpha]) ? 'missing-data' : ''}">
                        <div class="property-cell narrow-cell">&alpha;</div>
                        <div class="property-cell wide-cell">1st Order Volume Correction </div>
                        <div class="property-cell wide-cell">${renderValue('alpha', shockEOS.alpha)}</div>
                        <div class="property-cell narrow-cell">[-]</div>
                    </div>
                </div>
            `
        },

        {
            title: "Isotropic Elasticity",
            placeholder: `
                <div class="property-grid">
                    <div class="property-row ${shouldRowBeMissing([isotropicElasticity.e_modulus]) ? 'missing-data' : ''}">
                        <div class="property-cell narrow-cell">E</div>
                        <div class="property-cell wide-cell">Young's Modulus</div>
                        <div class="property-cell wide-cell">${renderValue('e_modulus', isotropicElasticity.e_modulus)}</div>
                        <div class="property-cell narrow-cell">[GPa]</div>
                    </div>
                    <div class="property-row ${shouldRowBeMissing([isotropicElasticity.poisson]) ? 'missing-data' : ''}">
                        <div class="property-cell narrow-cell">ν</div>
                        <div class="property-cell wide-cell">Poisson Ratio</div>
                        <div class="property-cell wide-cell">${renderValue('poisson', isotropicElasticity.poisson)}</div>
                        <div class="property-cell narrow-cell">[-]</div>
                    </div>
                    <div class="property-row ${shouldRowBeMissing([isotropicElasticity.shear_modulus]) ? 'missing-data' : ''}">
                        <div class="property-cell narrow-cell">G</div>
                        <div class="property-cell wide-cell">Shear Modulus</div>
                        <div class="property-cell wide-cell">${renderValue('shear_modulus', isotropicElasticity.shear_modulus)}</div>
                        <div class="property-cell narrow-cell">[GPa]</div>
                    </div>
                    <div class="property-row ${shouldRowBeMissing([isotropicElasticity.bulk_modulus]) ? 'missing-data' : ''}">
                        <div class="property-cell narrow-cell">K</div>
                        <div class="property-cell wide-cell">Bulk Modulus</div>
                        <div class="property-cell wide-cell">${renderValue('bulk_modulus', isotropicElasticity.bulk_modulus)}</div>
                        <div class="property-cell narrow-cell">[GPa]</div>
                    </div>
                </div>
            `
        },
        {
            title: "Physical Properties",
            placeholder: `
                <div class="property-grid">
                    <div class="property-row ${shouldRowBeMissing([physicalProperties.density]) ? 'missing-data' : ''}">
                        <div class="property-cell narrow-cell">ρ</div>
                        <div class="property-cell wide-cell">Density</div>
                        <div class="property-cell wide-cell">${renderValue('density', physicalProperties.density)}</div>
                        <div class="property-cell narrow-cell">[kg/m³]</div>
                    </div>
                    <div class="property-row ${shouldRowBeMissing([physicalProperties.specific_heat]) ? 'missing-data' : ''}">
                        <div class="property-cell narrow-cell">C<sub>p</sub></div>
                        <div class="property-cell wide-cell">Specific Heat Const. Pr.</div>
                        <div class="property-cell wide-cell">${renderValue('specific_heat', physicalProperties.specific_heat)}</div>
                        <div class="property-cell narrow-cell">[J/kgK]</div>
                    </div>
                    <div class="property-row ${shouldRowBeMissing([physicalProperties.isotropic_thermal_conductivity]) ? 'missing-data' : ''}">
                        <div class="property-cell narrow-cell">&lambda;</div>
                        <div class="property-cell wide-cell">Isotropic Thermal Conductivity</div>
                        <div class="property-cell wide-cell">${renderValue('isotropic_thermal_conductivity', physicalProperties.isotropic_thermal_conductivity)}</div>
                        <div class="property-cell narrow-cell">[W/mK]</div>
                    </div>
                    <div class="property-row ${shouldRowBeMissing([physicalProperties.tensile_failure_stress]) ? 'missing-data' : ''}">
                        <div class="property-cell narrow-cell">cp</div>
                        <div class="property-cell wide-cell">Tensile Failure Stress</div>
                        <div class="property-cell wide-cell">${renderValue('tensile_failure_stress', physicalProperties.tensile_failure_stress)}</div>
                        <div class="property-cell narrow-cell">[MPa]</div>
                    </div>
                </div>
            `
        },
        {
            title: "Other",
            placeholder: `
                <div class="property-grid">
                    <div class="property-row ${shouldRowBeMissing([physicalProperties.hardness]) ? 'missing-data' : ''}">
                        <div class="property-cell wide-cell"></div>
                        <div class="property-cell wide-cell">Brinell Hardness</div>
                        <div class="property-cell wide-cell">${renderValue('hardness', physicalProperties.hardness)}</div>
                        <div class="property-cell narrow-cell">[BHN]</div>
                    </div>
                    <div class="property-row ${shouldRowBeMissing([source]) ? 'missing-data' : ''}">
                        <div class="property-cell wide-cell"></div>
                        <div class="property-cell wide-cell">Source</div>
                        <div class="property-cell wide-cell">${renderValue('source', source)}</div>
                        <div class="property-cell wide-cell"></div>
                    </div>
                    <div class="property-row ${shouldRowBeMissing([reference]) ? 'missing-data' : ''}">
                        <div class="property-cell wide-cell"></div>
                        <div class="property-cell wide-cell">Reference</div>
                        <div class="property-cell wide-cell">
                            ${
                                editable
                                    ? `<input type="text" name="reference" value="${reference || ''}" class="editable-input" />`
                                    : `<a href="${reference || '#'}" target="_blank">${reference ? "Link" : "N/A"}</a>`
                            }
                        </div>
                        <div class="property-cell wide-cell"></div>
                    </div>

                </div>
            `
        }

        

    ];

    const editModeFormContainers = [
        {
            title: "Material Info",
            placeholder: `
                <div class="property-grid">
                    <div class="property-row ${shouldRowBeMissing([name]) ? 'missing-data' : ''}">
                        <div class="property-cell narrow-cell"></div>
                        <div class="property-cell wide-cell">Name</div>
                        <div class="property-cell wide-cell">${renderValue('name', name)}</div>
                        <div class="property-cell narrow-cell"></div>
                    </div>
                    <div class="property-row ${shouldRowBeMissing([version]) ? 'missing-data' : ''}">
                        <div class="property-cell narrow-cell"></div>
                        <div class="property-cell wide-cell">Version</div>
                        <div class="property-cell wide-cell">${renderValue('version', version)}</div>
                        <div class="property-cell narrow-cell"></div>
                    </div>
                    <div class="property-row ${shouldRowBeMissing([icon]) ? 'missing-data' : ''}">
                        <div class="property-cell narrow-cell"></div>
                        <div class="property-cell wide-cell">Icon</div>
                        <div class="property-cell wide-cell">${renderValue('icon', icon)}</div>
                        <div class="property-cell narrow-cell"></div>
                    </div>
                    <div class="property-row ${shouldRowBeMissing([tier]) ? 'missing-data' : ''}">
                        <div class="property-cell narrow-cell"></div>
                        <div class="property-cell wide-cell">Tier</div>
                        <div class="property-cell wide-cell">
                            ${
                                editable 
                                    ? `<select name="tier" class="editable-dropdown">
                                        <option value="free" ${tier === 'free' ? 'selected' : ''}>Free</option>
                                        <option value="basic" ${tier === 'basic' ? 'selected' : ''}>Basic</option>
                                        <option value="standard" ${tier === 'standard' ? 'selected' : ''}>Standard</option>
                                        <option value="premium" ${tier === 'premium' ? 'selected' : ''}>Premium</option>
                                        <option value="admin" ${tier === 'admin' ? 'selected' : ''}>Admin</option>
                                      </select>`
                                    : `<span>${formatValue(tier)}</span>`
                            }
                        </div>
                        <div class="property-cell narrow-cell"></div>
                    </div>
                    <div class="property-row ${shouldRowBeMissing([price]) ? 'missing-data' : ''}">
                        <div class="property-cell narrow-cell"></div>
                        <div class="property-cell wide-cell">Price</div>
                        <div class="property-cell wide-cell">${renderValue('price', price)}</div>
                        <div class="property-cell narrow-cell">[€]</div>
                    </div>
                    <div class="property-row ${shouldRowBeMissing([materialName]) ? 'missing-data' : ''}">
                        <div class="property-cell narrow-cell"></div>
                        <div class="property-cell wide-cell">Material</div>
                        <div class="property-cell wide-cell">
                            ${
                                editable
                                    ? `<select name="materialName" class="editable-dropdown">
                                        <option value="Steel" ${materialName === 'Steel' ? 'selected' : ''}>Steel</option>
                                        <option value="Aluminium" ${materialName === 'Aluminium' ? 'selected' : ''}>Aluminium</option>
                                        <option value="Iron" ${materialName === 'Iron' ? 'selected' : ''}>Iron</option>
                                        <option value="Special Metal" ${materialName === 'Special Metal' ? 'selected' : ''}>Special Metal</option>
                                        <option value="Other" ${materialName === 'Other' ? 'selected' : ''}>Other</option>
                                      </select>`
                                    : `<span>${formatValue(materialName)}</span>`
                            }
                        </div>
                        <div class="property-cell narrow-cell"></div>
                    </div>
                </div>
            `
        },
        {
            title: "Material Description",
            placeholder: `
                <div class="property-grid">
                    <div class="property-row ${shouldRowBeMissing([description]) ? 'missing-data' : ''}">
                        <div class="property-cell narrow-cell"></div>
                        <div class="property-cell wide-cell">Description</div>
                        <div class="property-cell wide-cell">
                            ${
                                editable 
                                    ? `<textarea name="description" class="editable-textarea">${(description && Array.isArray(description) ? description : []).join('\n')}</textarea>`
                                    : `<span>${(Array.isArray(description) ? description : [description || ""]).map(line => `<div>${formatValue(line)}</div>`).join('')}</span>`
                            }
                        </div>
                        <div class="property-cell narrow-cell"></div>
                    </div>
                </div>
            `
        }
    ];


    // Get the appropriate containers
    const formContainers = getFormContainers(editable);


    // Create separate chart containers for each chart
    const strengthChartContainerHTML = `
        <div class="form-container">
            <h4>Chart of Johnson Cook Strength</h4>
            <div class="divider-full"></div>
            <div class="chart-grid">
                <canvas id="chart-johnson-cook-strength-${materialId}"></canvas>
            </div>
        </div>
    `;

    const failureChartContainerHTML = `
        <div class="form-container">
            <h4>Chart of Johnson Cook Failure</h4>
            <div class="divider-full"></div>
            <div class="chart-grid">
                <canvas id="chart-johnson-cook-failure-${materialId}"></canvas>
            </div>
        </div>
    `;

    // CSS class for missing data
    const style = document.createElement('style');
    style.textContent = `
        .missing-data {
            color: #E4E3E1;
        }
    `;
    document.head.appendChild(style);


    // Create additional form container HTML (if needed)
    const formContainersHTML = formContainers.map(({ title, placeholder }) => `
        <div class="form-container">
            <h4>${title}</h4>
            <div class="divider-full"></div>
            ${placeholder}
        </div>
    `).join('');

    // Insert content into the modal
    modal.innerHTML = `
        <div class="header-flex-container">
            <h2>${name} - ${version}</h2>
            <img src="../assets/images/Design/${icon}-icon.png" alt="Material Icon" class="material-icon">
        </div>

        <div class="form-container-grid-material">
            ${formContainersHTML}
        </div>
        
        <div class="form-container-grid-chart">
            ${strengthChartContainerHTML}
            ${failureChartContainerHTML}
        </div>
        
        <div class="card-button-container">
            <div class="grid-button-container">
                <div class="action-button-container">
                    <button class="share-button" data-url="https://xplicitmaterials.com/material-library/${materialId}">
                        <img class="icon-blue" src="../assets/images/Design/share-icon.png" alt="Share" />
                        <img class="icon-white" src="../assets/images/Design/share-white-icon.png" alt="Share White" />
                    </button>
                    <button class="download-button" data-id="${materialId}">
                        <img class="icon-blue" src="../assets/images/Design/download-icon.png" alt="Download" />
                        <img class="icon-white" src="../assets/images/Design/download-white-icon.png" alt="Download White" />
                    </button>
                    <button class="purchase-button" data-id="${materialId}">
                        <img class="icon-blue" src="../assets/images/Design/cart-icon.png" alt="Purchase" />
                        <img class="icon-white" src="../assets/images/Design/cart-white-icon.png" alt="Purchase White" />
                    </button>
                    <button class="favourite-button" data-id="${materialId}">
                        <img class="icon-blue" src="../assets/images/Design/star-empty-icon.png" alt="Favourite" />
                        <img class="icon-white" src="../assets/images/Design/star-empty-white-icon.png" alt="Favourite White" />
                    </button>
                </div>
                <div class="admin-button-container-alt" data-id="${materialId}">
                    <button class="edit-button" data-id="${materialId}">
                        <img class="icon-blue" src="../assets/images/Design/edit-icon.png" alt="Edit" />
                        <img class="icon-white" src="../assets/images/Design/edit-white-icon.png" alt="Edit White" />
                    </button>
                    <button class="save-button" data-id="${materialId}">
                        <img class="icon-blue" src="../assets/images/Design/save-icon.png" alt="Save" />
                        <img class="icon-white" src="../assets/images/Design/save-white-icon.png" alt="Save White" />
                    </button>
                    <button class="delete-button" data-id="${materialId}">
                        <img class="icon-blue" src="../assets/images/Design/delete-icon.png" alt="Delete" />
                        <img class="icon-white" src="../assets/images/Design/delete-white-icon.png" alt="Delete White" />
                    </button>
                </div>
            </div>


            <div class="close-button-container">
                <button class="close-button">Close</button>
            </div>
        </div>


    `;

    // Initialize charts for this modal
    initializeCharts(materialId, johnsonCookStrength, johnsonCookFailure);
    initializeButtons(materialId);

}




const initializeCharts = (id, johnsonCookStrength, johnsonCookFailure) => {
    const ctxStrength = document.getElementById(`chart-johnson-cook-strength-${id}`).getContext('2d');
    const ctxFailure = document.getElementById(`chart-johnson-cook-failure-${id}`).getContext('2d');

    const { xValues, f1Values, f100Values, f1000Values } = generateJCSchart(johnsonCookStrength);
    const { xValuesJCF, f1ValuesJCF, f100ValuesJCF, f1000ValuesJCF } = generateJCFchart(johnsonCookFailure, johnsonCookStrength);


    new Chart(ctxStrength, {
        type: 'line',
        data: {
            labels: xValues,
            datasets: [
                {
                    label: '1/s',
                    data: f1Values,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 3,
                    pointRadius: 0
                },
                {
                    label: '100/s',
                    data: f100Values,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 3,
                    pointRadius: 0
                },
                {
                    label: '1000/s',
                    data: f1000Values,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 3,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Plastic Strain [%]',
                        color: '#1C3448', // Change title color here
                    },
                    ticks: {
                        color: '#1C3448', // Change tick color here
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Yield Stress [MPa]',
                        color: '#1C3448', // Change title color here
                    },
                    ticks: {
                        color: '#1C3448', // Change tick color here
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#1C3448', // Changed color to #1C3448
                        usePointStyle: true,
                        generateLabels: function(chart) {
                            var styles = ['rgba(255, 99, 132, 1)', 'rgba(75, 192, 192, 1)', 'rgba(54, 162, 235, 1)'];
                            return chart.data.datasets.map(function(dataset, i) {
                                return {
                                    text: dataset.label,
                                    fillStyle: styles[i],
                                    strokeStyle: styles[i],
                                    lineWidth: 3,
                                    pointStyle: 'line',
                                    fontColor: '#1C3448' // Changed color to #1C3448
                                };
                            });
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            return tooltipItem.dataset.label + ': ' + tooltipItem.raw;
                        }
                    }
                }
            }
        }
    });
    
    new Chart(ctxFailure, {
        type: 'line',
        data: {
            labels: xValuesJCF,
            datasets: [
                {
                    label: '1/s',
                    data: f1ValuesJCF,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 3,
                    pointRadius: 0
                },
                {
                    label: '100/s',
                    data: f100ValuesJCF,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 3,
                    pointRadius: 0
                },
                {
                    label: '1000/s',
                    data: f1000ValuesJCF,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 3,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'σ∗',
                        color: '#1C3448', // Change title color here
                    },
                    ticks: {
                        color: '#1C3448', // Change tick color here
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Plastic Failure Strain εf',
                        color: '#1C3448', // Change title color here
                    },
                    ticks: {
                        color: '#1C3448', // Change tick color here
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#1C3448', // Changed color to #1C3448
                        usePointStyle: true,
                        generateLabels: function(chart) {
                            var styles = ['rgba(255, 99, 132, 1)', 'rgba(75, 192, 192, 1)', 'rgba(54, 162, 235, 1)'];
                            return chart.data.datasets.map(function(dataset, i) {
                                return {
                                    text: dataset.label,
                                    fillStyle: styles[i],
                                    strokeStyle: styles[i],
                                    lineWidth: 3,
                                    pointStyle: 'line',
                                    fontColor: '#1C3448' // Changed color to #1C3448
                                };
                            });
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            return tooltipItem.dataset.label + ': ' + tooltipItem.raw;
                        }
                    }
                }
            }
        }
    });
    
};


const generateJCSchart = (johnsonCookStrength) => {
    const { initial_yield_strength, hardening_constant, hardening_exponent, strain_rate_constant, reference_strain_rate } = johnsonCookStrength || {};
    const aJCS = parseFloat(initial_yield_strength);
    const bJCS = parseFloat(hardening_constant);
    const nJCS = parseFloat(hardening_exponent);
    const cJCS = parseFloat(strain_rate_constant);
    const eJCS = parseFloat(reference_strain_rate) || 1;

    const stepSizeJCS = 0.0001;
    const xValuesJCS = [];
    const f1ValuesJCS = [];
    const f100ValuesJCS = [];
    const f1000ValuesJCS = [];

    for (let xJCS = 0; xJCS <= 0.156; xJCS += stepSizeJCS) {
        const f1JCS = (aJCS + bJCS * Math.pow(xJCS, nJCS)) * (1 + cJCS * Math.log(1 * eJCS));
        const f100JCS = (aJCS + bJCS * Math.pow(xJCS, nJCS)) * (1 + cJCS * Math.log(100 * eJCS));
        const f1000JCS = (aJCS + bJCS * Math.pow(xJCS, nJCS)) * (1 + cJCS * Math.log(1000 * eJCS));

        xValuesJCS.push(xJCS);
        f1ValuesJCS.push(f1JCS);
        f100ValuesJCS.push(f100JCS);
        f1000ValuesJCS.push(f1000JCS);
    }

    const roundedXValuesJCS = xValuesJCS.map(xJCS => parseFloat(xJCS.toFixed(3)));
    const multipliedXValuesJCS = roundedXValuesJCS.map(xJCS => xJCS * 100);
    const roundedmultipliedXValuesJCS = multipliedXValuesJCS.map(xJCS => parseFloat(xJCS.toFixed(3)));

    return { xValues: roundedmultipliedXValuesJCS, f1Values: f1ValuesJCS, f100Values: f100ValuesJCS, f1000Values: f1000ValuesJCS };
};


const generateJCFchart = (johnsonCookFailure, johnsonCookStrength) => {
    // Extract values from the provided objects or use defaults
    const {
        initial_failure_strain,
        exponential_factor,
        triaxial_factor,
        strain_rate_factor
    } = johnsonCookFailure || {};

    const { reference_strain_rate = 1 } = johnsonCookStrength || {};

    const d1JCF = parseFloat(initial_failure_strain);
    const d2JCF = parseFloat(exponential_factor);
    const d3JCF = parseFloat(triaxial_factor);
    const d4JCF = parseFloat(strain_rate_factor);
    const eJCF = parseFloat(reference_strain_rate);

    // Generate chart data
    const stepSizeJCF = 0.001;
    const xValuesJCF = [];
    const f1ValuesJCF = [];
    const f100ValuesJCF = [];
    const f1000ValuesJCF = [];

    for (let xJCF = -0.5; xJCF <= 0.6; xJCF += stepSizeJCF) {
        const f1JCF = (d1JCF + d2JCF * Math.exp(d3JCF * xJCF)) * (1 + d4JCF * Math.log(1 * eJCF));
        const f100JCF = (d1JCF + d2JCF * Math.exp(d3JCF * xJCF)) * (1 + d4JCF * Math.log(100 * eJCF));
        const f1000JCF = (d1JCF + d2JCF * Math.exp(d3JCF * xJCF)) * (1 + d4JCF * Math.log(1000 * eJCF));

        xValuesJCF.push(xJCF); // Push x value into xValues array
        f1ValuesJCF.push(f1JCF);
        f100ValuesJCF.push(f100JCF);
        f1000ValuesJCF.push(f1000JCF);
    }

    // Round xValues to three decimal places
    const roundedXValuesJCF = xValuesJCF.map(xJCF => parseFloat(xJCF.toFixed(2)));

    // Multiply rounded xValues by 100
    const multipliedXValuesJCF = roundedXValuesJCF.map(xJCF => xJCF * 100);

    // Round xValues to three decimal places
    const roundedmultipliedXValuesJCF = multipliedXValuesJCF.map(xJCF => parseFloat(xJCF.toFixed(3)));

    return {
        xValuesJCF: roundedmultipliedXValuesJCF,
        f1ValuesJCF: f1ValuesJCF,
        f100ValuesJCF: f100ValuesJCF,
        f1000ValuesJCF: f1000ValuesJCF
    };
};



//------------------------------------------------------------
// URL HANDLING FOR LATER (SERVER SIDE NEEDED)
//------------------------------------------------------------


/* document.addEventListener('DOMContentLoaded', () => {
    // Check the current URL path to see if there is a material ID
    const urlPath = window.location.pathname;
    const pathParts = urlPath.split('/');
    const materialId = pathParts[pathParts.length - 1]; // Get the last part of the URL

    if (materialId && materialId !== 'material-library') {
        // Find the modal with the given ID
        const modal = document.getElementById(`modal-${materialId}`);
        if (modal) {
            // Show the modal
            modal.classList.remove('hidden-modal');
            modal.classList.add('visible-modal');

            // Ensure the modal container is displayed
            const modalContainer = document.getElementById('modal-container-material');
            if (modalContainer) {
                modalContainer.style.display = 'block';
            }
        } else {
            console.warn(`Modal with ID ${materialId} not found.`);
        }
    }
});


const shareLink = `${window.location.origin}/material-library/${materialId}`;
console.log(`Share this link: ${shareLink}`); */


//------------------------------------------------------------
// MODAL BUTTONS
//------------------------------------------------------------

function initializeButtons(materialId) {
    console.log("Buttons Initiated");

    // Ensure we don't add multiple event listeners
    document.body.removeEventListener('click', handleButtonClick);
    document.body.addEventListener('click', handleButtonClick);

    console.log("userTier at button init", userTier);

    console.log("userTier at button init", userTier);
    if (userTier !== "admin") {
        // Hide the admin button container if the tier is not 'admin'
        checkAdminButtonVisibility(materialId);
        console.log("Admin buttons should be hidden:", document.querySelector('.admin-button-container'), document.querySelector('.admin-button-container-alt'));

    }
}




// Define the event handler function separately
async function handleButtonClick(event) {

    const clickedButton = event.target.closest('button');

    if (!clickedButton) return;

    const icon = clickedButton.querySelector('img')?.src; // Get the icon's source

    // Handle share button
    if (clickedButton.classList.contains('share-button')) {
        const urlToShare = clickedButton.dataset.url;
        console.log("Share button pressed", urlToShare);

        // Copy URL to clipboard
        navigator.clipboard.writeText(urlToShare)
            .then(() => {
                showNotification('URL copied to clipboard!', icon);
            })
            .catch(err => {
                console.error('Failed to copy URL:', err);
            });
    }



    if (clickedButton.classList.contains('download-button')) {
        const materialId = clickedButton.dataset.id;
        console.log("Download button pressed for material ID:", materialId);

        // Call the download function
        downloadButtonPressed(materialId)
            .then(() => {
                showNotification(`Material ${materialId} download started.`, icon);
            })
            .catch(err => {
                console.error('Failed to start download:', err);
            });
    }


    // Handle purchase button (Add to Cart)
    if (clickedButton.classList.contains('purchase-button')) {
        const materialId = clickedButton.dataset.id;
        console.log("Purchase button pressed for material ID:", materialId);

        // Add material to cart (with expiration handling)
        const cart = getCartItems(); // Get items from the cart (stored in cookies)
        
        if (cart.includes(materialId)) {
            // If item is already in the cart
            showNotification(`Material ${materialId} is already in the cart.`, icon);
        } else {
            // If item is not in the cart, add it
            addToCart(materialId);
            showNotification(`Material ${materialId} added to cart.`, icon);
        }
    }

    // Handle favourite button
    if (clickedButton.classList.contains('favourite-button')) {
        const materialId = clickedButton.dataset.id;
        console.log("Favourite button pressed for material ID:", materialId);
        showNotification(`Material ${materialId} added to favourites.`, icon);
    }

    // Handle Edit Button
    if (clickedButton.classList.contains('edit-button')) {
        console.log("Edit button pressed.");
        
        const materialId = clickedButton.dataset.id;
        if (!materialId) {
            console.error("No material ID found for the edit button.");
            return; // Exit if no material ID is found
        }

        // Find the modal using the material ID
        const modal = document.getElementById(`modal-${materialId}`);
        if (!modal) {
            console.error(`No modal found for material ID: ${materialId}`);
            return; // Exit if no modal is found
        }

        // Determine the current mode (edit or normal)
        const isCurrentlyEditable = modal.dataset.editable === "true";

        // Toggle editable mode
        modal.dataset.editable = isCurrentlyEditable ? "false" : "true";

        // Re-populate modal content based on the new mode
        populateModalContent(materialId);

        // Notify the user
        const modeMessage = isCurrentlyEditable ? 'Normal mode activated.' : 'Editing mode activated.';
        showNotification(modeMessage);

        console.log("active Item: ", activeItem);

        console.log(modeMessage);
    }



    if (clickedButton.classList.contains('save-button')) {
        console.log("Save button pressed.");
        
        let materialId = clickedButton.dataset.id;

        // If it's a new item (00000000), we need to handle it differently
        if (!materialId || materialId === "00000000") {
            // In this case, the material doesn't have a valid ID yet
            materialId = "00000000";  // Explicitly set it as "new"
        }
    
        // Find the modal
        const modal = document.getElementById(`modal-${materialId}`);
        if (!modal) {
            console.error(`No modal found for material ID: ${materialId}`);
            return;
        }
    
        // Collect updated data from the modal and update activeItem
        collectUpdatedData(modal);
    
        // Now save the updated activeItem to the database
        try {
            if (materialId === "00000000") {
                // Handle new material (ID = "00000000")
                const newMaterialId = await saveToDatabase(materialId, activeItem);

                // After saving a new item, update the modal ID and button's dataset with the new ID
                modal.id = `modal-${newMaterialId}`;
                clickedButton.dataset.id = newMaterialId; // Update the button dataset to the new ID
            } else {
                // For existing items, just update the Firestore document
                await saveToDatabase(materialId, activeItem);
            }

            // After saving, set the modal back to normal mode
            modal.dataset.editable = "false"; // Reset to normal mode
            populateModalContent(materialId); // Repopulate modal with saved content

            showNotification('Changes saved successfully.');
            console.log("Firestore operation successful!");
        } catch (error) {
            console.error("Error saving changes:", error);
            showNotification('Failed to save changes.');
        }
    }

    if (clickedButton.classList.contains('delete-button')) {
        console.log("Delete button pressed.");
        
        let materialId = clickedButton.dataset.id;
    
        // Confirm the delete action
        const userConfirmed = confirm("Are you sure you want to delete this material? This action cannot be undone.");
        if (!userConfirmed) {
            console.log("Delete action cancelled by user.");
            return;
        }
    
        try {
            // Delete the Firestore document
            await deleteFromDatabase(materialId);
    
            // Notify the user of success
            showNotification('Material deleted successfully.');
            console.log("Firestore document deleted successfully!");
    
        } catch (error) {
            console.error("Error deleting material:", error);
            showNotification('Failed to delete material.');
        }
    }

}





// Function to delete the document from Firestore
async function deleteFromDatabase(materialId) {
    console.log(`Deleting Firestore document with ID: ${materialId}`);
    
    try {
        // Ensure materialId is valid
        if (!materialId || materialId === "00000000") {
            throw new Error("Invalid material ID. Cannot delete.");
        }

        // Delete the Firestore document
        const docRef = doc(db, 'materialCollection', materialId);
        await deleteDoc(docRef);
        console.log("Firestore document deleted:", materialId);
    } catch (error) {
        console.error("Error deleting document from Firestore:", error);
        throw error; // Rethrow for proper error handling
    }
}



async function saveToDatabase(materialId, updatedData) {
    console.log(`Saving Firestore document with ID: ${materialId}`);
    console.log("Data to be saved:", updatedData);

    try {
        // Check if materialId is for an existing document or a new one
        if (materialId === "00000000") {
            // Add a new document to Firestore
            const newDocRef = await addDoc(collection(db, 'materialCollection'), updatedData); 
            console.log("New document added to Firestore with ID:", newDocRef.id);

            // Return the new document ID if needed
            return newDocRef.id;
        } else {
            // Update the existing document
            const docRef = doc(db, 'materialCollection', materialId);
            await updateDoc(docRef, updatedData);
            console.log("Firestore document updated successfully!");
        }
    } catch (error) {
        console.error("Error saving data to Firestore:", error);
        throw error; // Rethrow for proper error handling
    }
}


// Add item to the cart (set expiration for 72 hours)
function addToCart(itemId) {
    let cart = getCookie('cart');
    cart = cart ? JSON.parse(cart) : [];

    // Check if item is already in the cart
    if (!cart.includes(itemId)) {
        cart.push(itemId);
    }

    // Store cart in cookie with expiration of 72 hours
    setCookie('cart', JSON.stringify(cart), 3); // 72 hours = 3 days
}

function updateCartModal() {
    console.log("updateCartModal called");
    const cartItems = getCartItems(); // Retrieve items from cookies
    const cartTableBody = document.querySelector('.cart-table tbody'); // Cart table body
    const mobileCartContainer = document.querySelector('.mobile-table'); // Mobile cart container
    const totalAmountElement = document.querySelector('.total-amount'); // Total amount display

    let total = 0; // To calculate the total price

    // Clear existing content
    cartTableBody.innerHTML = '';
    mobileCartContainer.innerHTML = '';
    totalAmountElement.textContent = '€0.00';

    if (cartItems.length === 0) {
        // If cart is empty, show a message
        cartTableBody.innerHTML = `<tr><td colspan="8">Your cart is empty.</td></tr>`;
        mobileCartContainer.innerHTML = `<div class="cart-item">Your cart is empty.</div>`;
        return;
    }

    const userTier = userData?.restricted?.tier?.toLowerCase() || "unknown";

    // Define prices based on user tier
    const priceMap = {
        free: 0,
        basic: 5,
        standard: 10,
        premium: 20
    };

    cartItems.forEach((materialId) => {
        const item = items.find(item => item.id === materialId);
        if (!item) {
            console.error(`Item with ID ${materialId} not found in the items array.`);
            return;
        }

        const {
            materialInfo: {
                name = "Unknown Material",
                version = "N/A",
                icon = "placeholder",
                tier = "standard", // Default material tier
            } = {},
            materialModels: {
                isotropicElasticity = null,
                johnsonCookStrength = null,
                johnsonCookFailure = null,
                shockEOS = null,
            } = {}
        } = item;

        const materialTier = tier.toLowerCase();
        let basePrice = priceMap[materialTier] || ""; // Get base price for the material tier
        let discount = 0;

        // Calculate discount based on user tier
        if (userTier === "basic") {
            if (materialTier === "standard") {
                discount = 0.5; // 50%
            } else if (materialTier === "premium") {
                discount = 0.25; // 25%
            }
        } else if (userTier === "standard") {
            if (materialTier === "premium") {
                discount = 0.5; // 50%
            }
        }

        const discountedPrice = basePrice - (basePrice * discount);
        total += discountedPrice; // Add to total

        const iconPath = `../assets/images/Design/${icon}-icon.png`;

        // Calculate properties dynamically
        const physicalProperties = [
            { label: "Isotropic properties", available: isotropicElasticity },
            { label: "JC Strength", available: johnsonCookStrength },
            { label: "JC Failure", available: johnsonCookFailure },
            { label: "Shock EOS", available: shockEOS }
        ];

        const propertiesHtml = physicalProperties.map(prop =>
            `<li>${prop.label}: <span class="status-icon ${prop.available ? 'tick' : 'cross'}">${prop.available ? '✔' : '✘'}</span></li>`
        ).join('');

        // Add desktop cart row
        const row = `
            <tr>
                <td class= "item-icon"><img src="${iconPath}" alt="Item Icon" class="shop-item-icon"></td>
                <td class="content-details">
                    <ul>
                        <li><strong>${name}</strong></li> <!-- Name in bold -->
                        <li><em>${version}</em></li>    <!-- Version in italic -->
                    </ul>
                </td>
                <td class="remove-column">
                    <button class="remove-item-button" aria-label="Remove item" data-id="${materialId}">&times;</button>
                </td>
                <td class="content-details">
                    <ul>
                        ${propertiesHtml}
                    </ul>
                </td>
                <td><strong>${tier}</strong></td> <!-- Tier value in bold -->
                <td>${basePrice !== "" ? `<strong>€${basePrice.toFixed(2)}</strong>` : "-"}</td> <!-- Price in bold -->
                <td>${discount > 0 ? `<strong>${(discount * 100).toFixed(0)}%</strong>` : "-"}</td> <!-- Discount in bold -->
                <td>${discountedPrice !== "" ? `<strong>€${discountedPrice.toFixed(2)}</strong>` : "-"}</td> <!-- Total in bold -->
            </tr>
        `;
        cartTableBody.innerHTML += row;

        // Add mobile cart item
        const mobileItem = `
            <div class="cart-item">
                <div class="first-row">
                    <div class="item-icon">
                        <img src="${iconPath}" alt="Item Icon" class="shop-item-icon">
                    </div>
                    <div class="content-details">
                        <ul>
                            <li><strong>${name}</strong></li> <!-- Name in bold -->
                            <li><em>${version}</em></li>    <!-- Version in italic -->
                        </ul>
                    </div>
                    <button class="remove-item-button" aria-label="Remove item" data-id="${materialId}">&times;</button>
                </div>
                <div class="divider-full"></div>
                <div class="item-details">
                    <div class="content-details">
                        <ul>
                            ${propertiesHtml}
                        </ul>
                    </div>
                    <div class="mobile-sc-separator"></div>
                    <div class="content-details">
                        <ul>
                            <li>Tier: <strong>${tier}</strong></li> <!-- Tier value in bold -->
                            <li>Price: ${basePrice !== "" ? `<strong>€${basePrice.toFixed(2)}</strong>` : "-"}</li> <!-- Price in bold -->
                            <li>Discount: ${discount > 0 ? `<strong>${(discount * 100).toFixed(0)}%</strong>` : "-"}</li> <!-- Discount in bold -->
                            <li>Total: ${discountedPrice !== "" ? `<strong>€${discountedPrice.toFixed(2)}</strong>` : "-"}</li> <!-- Total in bold -->
                        </ul>
                    </div>
                </div>
            </div>
        `;
        mobileCartContainer.innerHTML += mobileItem;
    });

    // Update total in the modal
    totalAmountElement.textContent = `€${total.toFixed(2)}`;

    // Attach event listeners to the remove buttons
    attachRemoveEventListeners();

    // Setup the checkout button
    setupCheckoutButton("cart");

}




// Attach remove button functionality
function attachRemoveEventListeners() {
    const removeButtons = document.querySelectorAll('.remove-item-button');

    removeButtons.forEach((button) => {
        button.addEventListener('click', function () {
            const materialId = this.dataset.id;
            removeFromCart(materialId); // Remove item from cart
            updateCartModal(); // Refresh the cart modal
        });
    });
}

// Remove item from cart
function removeFromCart(materialId) {
    let cart = getCartItems();
    cart = cart.filter((id) => id !== materialId); // Remove the item
    setCookie('cart', JSON.stringify(cart), 3); // Update the cookie
}

document.addEventListener('DOMContentLoaded', () => {
    // Hook into the cart modal open button
    const openCartButton = document.querySelector('.open-cart');
    if (openCartButton) {
        openCartButton.addEventListener('click', () => {
            console.log('Cart button clicked');
            monitorCheckboxes('cart');
            updateCartModal();
            
        });
    }


    // Hook into the subscription modal open button
    const openSubscriptionButton = document.querySelector('.open-subscription');
    if (openSubscriptionButton) {
        openSubscriptionButton.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent the default anchor behavior
            console.log('Subscription button clicked');
            monitorCheckboxes('subscription');
            updateSubscriptionModal();
            
        });
    }


});



function updateSubscriptionModal() {
    console.log("updateSubscriptionModal called");

    // Set up query selectors for the plan buttons
    const planButtons = document.querySelectorAll('.select-plan-btn');
    const checkoutButton = document.querySelector('.checkout-button[data-type="subscription"]');

    // Add event listeners to the plan buttons
    planButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            // Remove 'selected' class from all buttons and revert styles
            planButtons.forEach(btn => {
                btn.classList.remove('selected');
                btn.style.backgroundColor = '#164384';
                btn.style.color = '#fff';
                if (btn.disabled) {
                    btn.textContent = ""; // Remove text for disabled buttons
                } else {
                    btn.textContent = `Choose ${btn.dataset.plan.charAt(0).toUpperCase() + btn.dataset.plan.slice(1)}`;
                }
            });

            // Add 'selected' class to the clicked button and update styles
            event.target.classList.add('selected');
            event.target.style.backgroundColor = '#FFFFFF';
            event.target.style.color = '#164384';
            event.target.textContent = "Selected Plan";

            const plan = event.target.dataset.plan; // Get the plan from the button's data attribute
            console.log("Button with the following plan pressed and recognized: ", plan); // Debug log

            // Enable the checkout button if a plan is selected
            if (checkoutButton) {
                checkoutButton.disabled = false;
            }
        });
    });

    // Highlight the current plan and disable lower tier options
    const highlightCurrentPlan = () => {
        if (userTier) {
            console.log("Current user tier: ", userTier);

            const tierOrder = ['free', 'basic', 'standard', 'premium', 'admin'];
            const currentTierIndex = tierOrder.indexOf(userTier);

            tierOrder.forEach((tier, index) => {
                const planCard = document.querySelector(`.${tier}-plan`);
                if (planCard) {
                    const button = planCard.querySelector('.select-plan-btn');
                    if (index < currentTierIndex) {
                        // Disable the button for lower tiers and remove any text
                        button.textContent = "-"; // Remove the button text
                        button.disabled = true; // Disable the button
                        button.classList.add('disabled'); // Add the disabled class
                    } else if (index === currentTierIndex) {
                        // Highlight the user's current plan and disable the button
                        planCard.classList.add('current-plan'); // Add the highlight class
                        button.textContent = userTier === 'admin' ? "Admin User" : "Your Current Plan"; // Update the button text
                        button.disabled = true; // Disable the button
                        button.classList.add('disabled'); // Add the disabled class
                    } else {
                        // Remove the highlight class and enable the button for higher tiers
                        planCard.classList.remove('current-plan');
                        button.textContent = `Choose ${tier.charAt(0).toUpperCase() + tier.slice(1)}`; // Reset the button text
                        button.disabled = false; // Enable the button
                        button.classList.remove('disabled'); // Remove the disabled class
                    }
                }
            });
        }
    };

    // Highlight the current plan and disable lower tier options
    highlightCurrentPlan();
    // Setup the checkout button
    setupCheckoutButton("subscription");
}





// Utility functions (from earlier code)
export function getCartItems() {
    const cart = getCookie('cart');
    return cart ? JSON.parse(cart) : [];
}

export function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

export function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i].trim();
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}







// Utility: Show notification
function showNotification(message, iconSrc = null) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed; 
        top: 50%; 
        left: 50%; 
        transform: translate(-50%, -50%);
        background-color: #FFFFFF;
        color: #164384; 
        padding: 15px 25px; 
        border: 4px solid #164384;
        z-index: 100000; 
        opacity: 0; 
        font-weight: bold;
        transition: opacity 0.5s ease-in-out; 
        font-size: 1.5rem;
        display: flex; 
        align-items: center; 
        gap: 15px; /* Space between icon and text */
    `;

    // Add the icon to the notification, if provided
    if (iconSrc) {
        const icon = document.createElement('img');
        icon.src = iconSrc;
        icon.alt = "Notification Icon";
        icon.style.cssText = `
            width: 32px; 
            height: 32px; 
            object-fit: contain;
        `;
        notification.appendChild(icon);
    }

    // Add the text message
    const text = document.createElement('span');
    text.textContent = message;
    notification.appendChild(text);

    // Append to body
    document.body.appendChild(notification);

    // Ensure opacity transition works
    requestAnimationFrame(() => {
        notification.style.opacity = '1';
    });

    // Hide notification after 2 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentElement) {
                document.body.removeChild(notification);
            }
        }, 500); // Matches the transition duration
    }, 2000);

    console.log("Notification displayed with message:", message);
}


async function loadMaterialDefaults() {
    const response = await fetch('../assets/materialDefaults.json');
    const materialDefaults = await response.json();
    return materialDefaults;
}

/* loadMaterialDefaults().then(materialDefaults => {
    
}); */




// Function for handling download
async function downloadButtonPressed() {
    if (!activeItem) {
        console.error("No active item selected.");
        return;
    }

    const {
        materialInfo: { name = "Unnamed Material", version = "0", material: materialName = "Unknown" },
        materialModels: { physicalProperties = {}, isotropicElasticity = {}, johnsonCookStrength = {}, johnsonCookFailure = {}, shockEOS = {} }
    } = activeItem;

    console.log("itemprint", activeItem); 

    // Create the file name using name and version
    const fileName = `${name} (${version})`;

    // Format the current date and time for use in the download template
    const currentDate = new Date();
    const formatDate = (date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
    };

    const formattedDate = formatDate(currentDate);

    // Generate a consistent color based on the material name
    const color = generateColor(materialName);


    // Normalize both materialName and name for case-insensitive comparison
    const normalizedMaterialName = materialName.toLowerCase();
    const normalizedName = name.toLowerCase();

    // Define default value for 'alpha'
    let alphaDefaultValue = "n/a";

    // Check if materialName is Steel, Aluminium, or Iron and set the alpha value accordingly
/*     if (["steel", "aluminium", "iron"].includes(normalizedMaterialName)) {
        alphaDefaultValue = materialDefaults[materialName] ? materialDefaults[materialName].alpha : "n/a";
    } */
    
    // Check if name is Copper or Tungsten Alloy and set the alpha value accordingly
/*     if (["copper", "tungsten alloy"].includes(normalizedName)) {
        alphaDefaultValue = nameDefaults[name] ? nameDefaults[name].alpha : "n/a";
    } */


    // Populate the template with values
    const values = {
        version: "18.2.0.210", // Adjust based on ANSYS version if needed
        versiondate: formattedDate, // Formatted current date and time
        pr0_pa0: color.red.toString(), // Red
        pr0_pa1: color.green.toString(), // Green
        pr0_pa2: color.blue.toString(), // Blue
        pr0_pa3: "Appearance",
        pr1_pa4: "Interpolation Options",
        pr1_pa5: physicalProperties.density || "n/a", // Density
        pr1_pa6: "7.88860905221012e-31", // Placeholder value, adjust if needed
        pr2_pa4: "Interpolation Options",
        pr2_pa7: isotropicElasticity.e_modulus || "n/a", // Young's Modulus
        pr2_pa8: isotropicElasticity.poisson || "n/a", // Poisson's Ratio
        pr2_pa11:isotropicElasticity.bulk_modulus || "n/a", // Bulk Modulus
        pr2_pa9: "69607843137.2549", // Placeholder value, adjust if needed
        pr2_pa10: "26691729323.3083", // Placeholder value, adjust if needed
        pr2_pa6: "7.88860905221012e-31", // Placeholder value, adjust if needed
        pr3_pa11: johnsonCookStrength.initial_yield_strength || "n/a", // Initial Yield Stress
        pr3_pa12: johnsonCookStrength.hardening_constant || "n/a", // Hardening Constant
        pr3_pa13: johnsonCookStrength.hardening_exponent || "n/a", // Hardening Exponent
        pr3_pa14: johnsonCookStrength.strain_rate_constant || "n/a", // Strain Rate Constant
        pr3_pa15: johnsonCookStrength.thermal_softening_exp || "n/a", // Thermal Softening Exponent
        pr3_pa16: johnsonCookStrength.melting_temperature || "n/a", // Melting Temperature
        pr3_pa17: johnsonCookStrength.reference_strain_rate || "n/a", // Reference Strain Rate (/sec)
        pr3_pa18: physicalProperties.tensile_failure_stress || "n/a", // Tensile Failure Stress (LS- Dyna)
        pr4_pa4: "Interpolation Options",
        pr4_pa18: physicalProperties.specific_heat || "n/a", // Specific Heat
        pr4_pa6: "7.88860905221012e-31", // Placeholder value, adjust if needed
        pr5_pa19: johnsonCookFailure.initial_failure_strain || "n/a", // Damage Constant D1
        pr5_pa20: johnsonCookFailure.exponential_factor || "n/a", // Damage Constant D2
        pr5_pa21: johnsonCookFailure.triaxial_factor || "n/a", // Damage Constant D3
        pr5_pa22: johnsonCookFailure.strain_rate_factor || "n/a", // Damage Constant D4
        pr5_pa23: johnsonCookFailure.temperature_factor || "n/a", // Damage Constant D5
        pr5_pa16: johnsonCookStrength.melting_temperature || "n/a", // Melting Temperature (from Strength)
        pr5_pa17: johnsonCookStrength.reference_strain_rate || "n/a", // Reference Strain Rate (/sec) (from Strength)
        pr6_pa24: shockEOS.grueneisen_coefficient || "n/a", // Gruneisen Coefficient
        pr6_pa25: shockEOS.parameter_c1 || "n/a", // Parameter C1
        pr6_pa26: shockEOS.parameter_s1 || "n/a", // Parameter S1
        pr6_pa27: shockEOS.parameter_quadratic || "n/a", // Parameter Quadratic S2
        pr7_pa10: isotropicElasticity.shear_modulus || "n/a", // Shear Modulus
        pr8_pa1: physicalProperties.isotropic_thermal_conductivity || "n/a",
        pr8_pa2: physicalProperties.tensile_failure_stress || "n/a",  
        pr8_pa3: shockEOS.alpha, 
        material_name: fileName // Dynamic material_name variable
    };

    // Fetch the XML template
    const response = await fetch('../assets/mat-template.xml');
    let xmlTemplate = await response.text();

    // Replace placeholders with values
    for (var key in values) {
        xmlTemplate = xmlTemplate.replace(new RegExp('{{' + key + '}}', 'g'), values[key]);
    }

    // Create a Blob with the XML content
    const blob = new Blob([xmlTemplate], { type: 'application/xml' });
    // Create a link element
    const link = document.createElement('a');
    // Create a URL for the Blob
    link.href = URL.createObjectURL(blob);
    // Set the download attribute with the desired file name
    link.download = fileName + '.xml';
    // Append the link to the body (necessary for some browsers)
    document.body.appendChild(link);
    // Programmatically click the link to trigger the download
    link.click();
    // Remove the link from the document
    document.body.removeChild(link);
}

// Function to generate a consistent random color based on the material name
function generateColor(materialName) {
    // Calculate the hash of the material name
    var hash = 0;
    if (materialName.length == 0) return hash;
    for (var i = 0; i < materialName.length; i++) {
      var char = materialName.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Use the hash to determine the RGB values
    var red = Math.abs(hash) % 256;
    var green = Math.abs((hash >> 8)) % 256;
    var blue = Math.abs((hash >> 16)) % 256;
    
    // Return the RGB values as an object
    return { red: red, green: green, blue: blue };
}

function collectUpdatedData(modal) {
    // Find all editable input fields and select elements within the modal
    const inputs = modal.querySelectorAll('.editable-input, select, textarea');
    
    inputs.forEach(input => {
        const key = input.name; // Get the key from the input's "name" attribute
        let value;

        // Check if it's an input field (text input, textarea)
        if (input.tagName.toLowerCase() === 'input' || input.tagName.toLowerCase() === 'textarea') {
            value = input.value; // Get the value of input or textarea
        }
        // Check if it's a select field (dropdown)
        else if (input.tagName.toLowerCase() === 'select') {
            value = input.value; // Get the selected value of the dropdown
        }
        
	
        // If the value is "N/A", treat it as empty string
        if (value === "N/A") {
            value = ""; // Set to empty string if "N/A"
        }

        // Special mapping for materialName -> material
        if (key === 'materialName') {
            activeItem.materialInfo.material = value;
        }

        // Now update the activeItem based on the key
        // Check if the key is in materialInfo and update it
        if (key in activeItem.materialInfo) {
            if (key === 'description') {
                // Split the value into an array and save as description
                activeItem.materialInfo[key] = value
                    .split('\n')    // Split the input by newlines
                    .map(line => line.trim())  // Remove any leading/trailing spaces from each line
                    .filter(line => line.length > 0); // Remove empty lines
            } else {
                // For other fields, directly assign the value
                activeItem.materialInfo[key] = value;
            }
            
        }

        
        // Check if the key is in materialModels.johnsonCookStrength and update it
        else if (key in activeItem.materialModels?.johnsonCookStrength) {
            // If johnsonCookStrength exists, update the key
            activeItem.materialModels.johnsonCookStrength[key] = value;
        }
        // Check if the key is in materialModels.johnsonCookFailure and update it
        else if (key in activeItem.materialModels?.johnsonCookFailure) {
            // If johnsonCookFailure exists, update the key
            activeItem.materialModels.johnsonCookFailure[key] = value;
        }
        // Check if the key is in materialModels.shockEOS and update it
        else if (key in activeItem.materialModels?.shockEOS) {
            // If shockEOS exists, update the key
            activeItem.materialModels.shockEOS[key] = value;
        }
        // Check if the key is in materialModels.isotropicElasticity and update it
        else if (key in activeItem.materialModels?.isotropicElasticity) {
            // If isotropicElasticity exists, update the key
            activeItem.materialModels.isotropicElasticity[key] = value;
        }
        // Update physicalProperties fields in the correct place
        else if (key in activeItem.materialModels?.physicalProperties) {
            activeItem.materialModels.physicalProperties[key] = value;
        }
        // Update other fields in the correct place
        else if (key in activeItem.additionalInfo) {
            activeItem.additionalInfo[key] = value;
        }

        
    });

    console.log("Updated activeItem after collecting data:", activeItem);
}





function setupAddButtonListener() {
    const addButton = document.querySelector('.add-button'); // Selects the button by its class

    /* console.log("Setting up add button listener"); */
    if (addButton) {
        addButton.addEventListener('click', () => {
            console.log("Add button pressed");
            const modal = document.getElementById('modal-00000000'); // Reference the new modal by its ID
            if (modal) {
                // Show the modal
                modal.classList.remove('hidden-modal');
                modal.classList.add('visible-modal');

                const emptyId = "00000000";

                // Populate the content of the modal dynamically when clicked
                populateModalContent(emptyId);

                // Ensure the modal container is displayed
                const modalContainer = document.getElementById('modal-container-material');
                if (modalContainer) {
                    modalContainer.style.display = 'flex'; // Make the modal container visible
                    document.body.classList.add('no-scroll'); // Prevent body scroll
                }
            } else {
                console.error('Modal with ID "modal-00000000" not found.');
            }
        });
    } else {
        console.error('Add button not found!');
    }
}

// Automatically set up the listener on DOMContentLoaded
document.addEventListener('DOMContentLoaded', setupAddButtonListener);



