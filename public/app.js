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




//------------------------------------------------------------
// MOBILE VIEW
//------------------------------------------------------------

const leftCol = document.getElementById("left-col");
const rightCol = document.getElementById("right-col");


const toggleLeftAndRightViewsOnMobile = () => {
    if (document.body.clientWidth <= 600) {
        leftCol.style.display = "none";
        rightCol.style.display = "block";
    }
}


//------------------------------------------------------------
// SIDEBAR RIGHT
//------------------------------------------------------------


document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.getElementById('sidebar-right');
    const closeBtn = document.getElementById('closebtn-right');
    const menuBtn = document.getElementById('filter-btn');

    // Function to open sidebar
    function openNav() {
        sidebar.classList.add('open');
        sidebar.classList.remove('close');
    }

    // Function to close sidebar
    function closeNav() {
        sidebar.classList.add('close');
        sidebar.classList.remove('open');
    }

    // Event listeners
    menuBtn.addEventListener('click', openNav);
    closeBtn.addEventListener('click', closeNav);

    // Optional: Close sidebar if clicked outside
    document.addEventListener('click', function(event) {
        if (!sidebar.contains(event.target) && !menuBtn.contains(event.target)) {
            closeNav();
        }
    });
});

//------------------------------------------------------------
// GET DATA
//------------------------------------------------------------

let materials = [];




const getmaterials = async() => {
    
    
    try {

        
        const getFilteredMaterialsFn = httpsCallable(functions, 'getFilteredMaterials'); // Prepare the cloud function
        
        // Call the cloud function
        const result = await getFilteredMaterialsFn();
        materials = result.data.materials;
        
        // Proceed with showing the materials
        showMaterials(materials);
    } catch (err) {
        console.log("getmaterials error: ", err);
    }
};



const addBtn = document.querySelector(".add-btn");

// Ensure you select the loader dimmer correctly

// Listen for authentication state changes
onAuthStateChanged(auth, (user) => {
    
    if (user) {
        // console.log("User is logged in:", user.uid);

        const mainTabs = document.getElementById("tabcontainer");
        mainTabs.style.display = "flex";  // Show the welcome message


        // Reload the page if user logs in or out
        if (!window.initialAuthCheck) {
            window.initialAuthCheck = true;  // Ensure this only runs once on page load
        } else {
            console.log("Reloading page after login");  // Log before reloading
            // window.location.reload();  // Reload the page when auth state changes
        }


        // User is authenticated, now we can call the cloud function
        getmaterials();


        // Check if the user has the 'admin' claim
        user.getIdTokenResult().then((idTokenResult) => {
            const isAdmin = !!idTokenResult.claims.admin;
            // console.log("Is user admin:", isAdmin);

            // Store the admin status for future use
            window.isAdmin = isAdmin;

            // Toggle visibility of add button based on admin status
            
            if (addBtn && isAdmin) {
                addBtn.style.visibility = "visible";  // Show the button if admin
            }


        }).catch((error) => {
            console.log("Error retrieving user token:", error);
        }).finally(() => {
            // Hide the entire dimmer (loader + overlay) once the authentication check is complete

        });

    } else {
        console.log("No user is logged in. Delaying function call.");
        const loaderDimmer = document.getElementById("loading-dimmer"); // Select by ID
        if (loaderDimmer) {
            
            loaderDimmer.style.display = "none"; // Hide the loader if no user
        }

        console.log("No user is logged in");

        if (!window.initialAuthCheck) {
            window.initialAuthCheck = true;
        } else {
            console.log("Reloading page after logout");  // Log before reloading
            window.location.reload();  // Reload the page when auth state changes
        }

        // If no one is logged in, display a welcome message
        displayWelcomeMessage();  // This function will handle the welcome content

    }

});

function displayWelcomeMessage() {
    const loaderDimmer = document.getElementById("loading-dimmer");
    const welcomeMessage = document.getElementById("welcome-message");

    if (loaderDimmer) {
        loaderDimmer.style.display = "none";  // Hide the loader
    }

    if (welcomeMessage) {
        welcomeMessage.style.display = "block";  // Show the welcome message
    }

    // Add event listeners for login and register links
    document.getElementById('main-login-btn').addEventListener('click', function(e) {
        // Add your login logic here
        signUpLogInBtnPressed(e);
    });

    document.getElementById('main-register-btn').addEventListener('click', function(e) {
        // Add your register logic here
        console.log("welcome register btn pressed");
        needAnAccountBtnPressed(e);
    });
}


//------------------------------------------------------------
// SHOW material AS LIST ITEM ON THE LEFT
//------------------------------------------------------------

const showMaterials = async (materials) => {

    await fetchUserFavorites(); // Ensure favorites are fetched

    // Clear all material lists first
    const materialLists = {
        steel: document.getElementById("material-list-steel"),
        aluminium: document.getElementById("material-list-aluminium"),
        iron: document.getElementById("material-list-iron"),
        specialMetal: document.getElementById("material-list-special-metal"),
        other: document.getElementById("material-list-other")
    };
    
    // console.log(materialLists.steel, materialLists.aluminium, materialLists.iron, materialLists.specialMetal, materialLists.other);
    
    for (let list in materialLists) {
        if (materialLists.hasOwnProperty(list)) {
            materialLists[list].innerHTML = "";
        }
    }

    // Sort materials alphabetically by name (now accessed from materialInfo)
    materials.sort((a, b) => 
        a.materialInfo.name.localeCompare(b.materialInfo.name)
    );

    // Group materials by name
    const groupedMaterials = materials.reduce((acc, material) => {
        const name = material.materialInfo.name;
        if (!acc[name]) {
            acc[name] = [];
        }
        acc[name].push(material);
        return acc;
    }, {});

    
    //EZ AZÉRT ILYEN, MERT AZ ADATBÁZISBAN MÁSHOGY SZEREPEL ÉS VALAHOGY ÁT KELL ALAkítani

    // Mapping for material types
    const materialMapping = {
        "steel": "steel",
        "aluminium": "aluminium",
        "iron": "iron",
        "special metal": "specialMetal",  // Mapping "special metal" to "specialMetal"
        "other": "other"
    };


    // Helper function to get the tier label (badge)
    const getTierLabel = (tier) => {
        switch (tier) {
            case "free":
                return `<div class="tier-label tier-free"><span>free</span></div>`;
            case "basic":
                return `<div class="tier-label tier-basic"><span>basic</span></div>`;
            case "standard":
                return `<div class="tier-label tier-standard"><span>standard</span></div>`;
            case "premium":
                return `<div class="tier-label tier-premium"><span>premium</span></div>`;
            case "admin":
                return `<div class="tier-label tier-admin"><span>disabled</span></div>`; // Directly replace with "Disabled"
            default:
                return ``; // No label for unknown tiers
        }
    };
    
    
    

    // Create the HTML structure
    for (const [name, materialGroup] of Object.entries(groupedMaterials)) {

        // Add sorting step here for alphabetical ascending order within the card
        materialGroup.sort((a, b) => 
            String(a.materialInfo.version).localeCompare(String(b.materialInfo.version))
        );


        const container = document.createElement('div');
        container.classList.add('material-group');

        const header = document.createElement('div');
        header.classList.add('material-group-header');

        // Left part: Material name
        const nameDiv = document.createElement('div');
        nameDiv.classList.add('material-name');
        nameDiv.innerText = name;

        // Right part: Icon (if available)
        const iconDiv = document.createElement('div');
        iconDiv.classList.add('material-icon');

        // Find the first non-null icon in the group
        let iconFound = false;
        for (const material of materialGroup) {
            const iconName = material.materialInfo.icon;
            if (iconName && !iconFound) {
                const iconImg = document.createElement('img');
                iconImg.src = `./assets/icons/${iconName}-icon.png`;
                iconImg.alt = `${name} icon`;
                iconImg.classList.add('material-icon-img');
                iconDiv.appendChild(iconImg);
                iconFound = true; // Stop searching after finding the first icon
            }
        }

        // Append both parts to the header
        header.appendChild(nameDiv);
        header.appendChild(iconDiv);

        const list = document.createElement('ul');
        list.classList.add('material-sublist');



        materialGroup.forEach(material => {
            const li = document.createElement('li');
            li.classList.add('material-list-item');
            li.classList.add(material.materialType); // Add a class for material type
            li.id = material.id;
        
            // Check if the material is in user favorites
            const isFavorite = userFavorites.has(material.id);

            // Define color logic for each material type
            const materialType = material.materialInfo.material.toLowerCase(); // Convert to lowercase for uniformity
            let starColor = '';
            switch (materialType) {
                case 'steel':
                    starColor = 'rgb(120, 0, 0)'; // Red for Steel
                    break;
                case 'aluminium':
                    starColor = 'rgb(0, 128, 192)'; // Blue for Aluminium
                    break;
                case 'iron':
                    starColor = 'rgb(0, 111, 55)'; // Green for Iron
                    break;
                case 'special-metal':
                    starColor = 'rgb(135, 104, 143)'; // Purple for Special Metal
                    break;
                case 'other':
                    starColor = 'rgb(255, 128, 64)'; // Orange for Other
                    break;
                default:
                    starColor = 'black'; // Fallback color if material type is unknown
            }

            // Insert SVG icon with dynamic fill color and contour
            const starIcon = isFavorite
                ? `<svg id="star-icon-${material.id}" class="favorite-icon" width="40" height="40" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path fill="none" stroke="${starColor}" stroke-width="2" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                </svg>`
                : '';

        



            li.innerHTML = `
                <div class="content">
                    <div class="subtitle">
                        ${getTierLabel(material.materialInfo.tier)} ${material.materialInfo.version}
                    </div>
                    <div class="favorite-indicator"  id="favorite-indicator-${material.id}" style="margin-left: auto;">${starIcon}</div> <!-- Separate star container -->
                </div>
            `;
            list.appendChild(li);
        });

        container.appendChild(header);
        container.appendChild(list);

        // Determine material type and append to corresponding list
        const materialType = materialMapping[materialGroup[0].materialInfo.material.toLowerCase()];
        if (materialType && materialLists[materialType]) {
            materialLists[materialType].appendChild(container);
        } else {
            materialLists.other.appendChild(container);
            console.error(`Unknown material: ${materialGroup[0].materialInfo.material}`);
        }
    }

    document.querySelectorAll('.material-group-header').forEach(header => {
        header.addEventListener('click', function() {
            const group = this.parentElement;
            group.classList.toggle('collapsed');
        });
    });
    const loaderDimmer = document.getElementById("loading-dimmer"); // Select by ID
    if (loaderDimmer) {
        
        loaderDimmer.style.display = "none"; // Hide the loader if no user
    }

};


//------------------------------------------------------------
// CLICK material LIST ITEM
//------------------------------------------------------------





const materialListPressed = (event) => {
    const id = event.target.closest("li").getAttribute("id");

    // Log the clicked element and its parent classes for better debugging
    // console.log("Clicked element:", event.target);
    // console.log("Clicked element's class:", event.target.className);
    // console.log("Parent button class (if any):", event.target.closest('button')?.className);
    console.log("Item ID:", id);

    // Check if a button is pressed using closest
    const button = event.target.closest("button");
    if (button) {
        const buttonClass = button.className;
        console.log(`Button pressed: ${buttonClass}`);
        event.stopPropagation(); // Prevent the click from propagating to the list item

        // Execute the corresponding button function
        if (buttonClass.includes("edit-user")) {
            console.log("Edit button function called.");
            editButtonPressed(id);
        } else if (buttonClass.includes("delete-user")) {
            console.log("Delete button function called.");
            deleteButtonPressed(id);
        } else if (buttonClass.includes("material-purchase-btn")) {
            console.log("Material Purchase button function called.");
            MaterialPurchaseButtonPressed(id);
        } else if (buttonClass.includes("download-btn")) {
            console.log("Download button function called.");
            downloadButtonPressed(id);
        }

        return; // Exit the function to prevent card collapse/expansion
    }

    // Handle card expansion/collapse when non-button area is clicked
    // console.log("No button pressed, handling card expansion/collapse.");
    const cardExpanded = moveCardToNextRow(id);
    if (!cardExpanded) {
        //console.log("Card collapsed, hiding buttons.");
        hideButtonsOnCollapse(id); // Hide buttons when card is collapsed
    } else {
        //console.log("Card expanded, displaying material details.");
    }
    displaymaterialOnDetailsView(id);
    displayButtonsOnDetailView(id);
};


const moveCardToNextRow = (id) => {
    const selectedCard = document.getElementById(id);
    const cardContainer = selectedCard.closest('.material-group');
    const materialList = cardContainer.parentElement;

    const topLineId = `${id}-top-line`;
    const bottomLineId = `${id}-bottom-line`;
    const detailDivId = `${id}-detail`;

    const existingTopLine = document.getElementById(topLineId);
    const existingBottomLine = document.getElementById(bottomLineId);
    const existingDetailDiv = document.getElementById(detailDivId);

    if (existingTopLine && existingBottomLine && existingDetailDiv) {
        // Card is already expanded, collapse it
        materialList.insertBefore(cardContainer, existingTopLine);
        existingTopLine.remove();
        existingBottomLine.remove();
        existingDetailDiv.remove();

        const allCards = Array.from(materialList.querySelectorAll('.material-group'));
        const selectedIndex = allCards.indexOf(cardContainer);

        for (let i = selectedIndex + 1; i < allCards.length; i++) {
            materialList.insertBefore(allCards[i], null);
        }

        return false; // Indicates card was collapsed
    } else {
        // Remove previously opened detail divs and lines
        document.querySelectorAll('.separator-line').forEach(line => line.remove());
        document.querySelectorAll('.material-detail').forEach(div => div.remove());

        // Expand the card
        const topLine = document.createElement('div');
        topLine.id = topLineId;
        topLine.classList.add('separator-line');

        const bottomLine = document.createElement('div');
        bottomLine.id = bottomLineId;
        bottomLine.classList.add('separator-line');

        const detailDiv = document.createElement('div');
        detailDiv.id = detailDivId;
        detailDiv.classList.add('material-detail');

        materialList.insertBefore(topLine, cardContainer);
        materialList.insertBefore(cardContainer, topLine.nextSibling);
        materialList.insertBefore(detailDiv, cardContainer.nextSibling);
        materialList.insertBefore(bottomLine, detailDiv.nextSibling);

        const allCards = Array.from(materialList.querySelectorAll('.material-group'));
        const selectedIndex = allCards.indexOf(cardContainer);

        for (let i = selectedIndex + 1; i < allCards.length; i++) {
            materialList.appendChild(allCards[i]);
        }

        return true; // Indicates card was expanded
    }
};

const hideButtonsOnCollapse = (id) => {
    const listItem = document.getElementById(id);
    const existingActionDiv = listItem.querySelector('.action');
    if (existingActionDiv) {
        existingActionDiv.remove(); // Remove buttons when card is collapsed
    }
    // Hide the specific list item Star Icon (favorite-indicator)
    const starIcon = listItem.querySelector(`#star-icon-${id}`); // Assuming we have a unique ID for each star icon
    const starIconContainer = listItem.querySelector(`#favorite-indicator-${id}`);
    if (starIcon) {
        starIconContainer.style.display = "flex";
        starIcon.style.display = 'block'; // Hide the star icon
    }
};

// Add event listeners to all material lists
const addEventListenersTomaterialLists = () => {
    const materialListSelectors = ["#material-list-steel", "#material-list-aluminium", "#material-list-iron", "#material-list-special-metal", "#material-list-other"];
    materialListSelectors.forEach(selector => {
      const materialList = document.querySelector(selector);
      if (materialList) {
        materialList.addEventListener("click", materialListPressed);
      }
    });
  };
  
  // Call the function to add event listeners after DOM content is loaded
  document.addEventListener('DOMContentLoaded', function() {
    addEventListenersTomaterialLists();
});

//------------------------------------------------------------
// EDIT DATA
//------------------------------------------------------------

const editButtonPressed = (id) => {
    modalOverlay.style.display = "flex";
    const selectedMaterial = getmaterial(id);  // Renamed from `material`

    // Accessing materialInfo properties
    name.value = selectedMaterial.materialInfo.name;
    version.value = selectedMaterial.materialInfo.version;
    material.value = selectedMaterial.materialInfo.material;  // This refers to the HTML element or another variable, not the renamed constant
    icon.value = selectedMaterial.materialInfo.icon;
    description.value = selectedMaterial.materialInfo.description;
    tier.value = selectedMaterial.materialInfo.tier;
    price.value = selectedMaterial.materialInfo.price;
   
    console.log(material.value); // Should log the DOM element


    // Accessing Johnson Cook Strength properties
    initial_yield_strength.value = selectedMaterial.materialModels.johnsonCookStrength.initial_yield_strength;
    hardening_constant.value = selectedMaterial.materialModels.johnsonCookStrength.hardening_constant;
    hardening_exponent.value = selectedMaterial.materialModels.johnsonCookStrength.hardening_exponent;
    strain_rate_constant.value = selectedMaterial.materialModels.johnsonCookStrength.strain_rate_constant;
    thermal_softening_exp.value = selectedMaterial.materialModels.johnsonCookStrength.thermal_softening_exp;
    melting_temperature.value = selectedMaterial.materialModels.johnsonCookStrength.melting_temperature;
    reference_strain_rate.value = selectedMaterial.materialModels.johnsonCookStrength.reference_strain_rate;
    console.log(initial_yield_strength); // Should log the DOM element

    // Accessing Johnson Cook Failure properties
    initial_failure_strain.value = selectedMaterial.materialModels.johnsonCookFailure.initial_failure_strain;
    exponential_factor.value = selectedMaterial.materialModels.johnsonCookFailure.exponential_factor;
    triaxial_factor.value = selectedMaterial.materialModels.johnsonCookFailure.triaxial_factor;
    strain_rate_factor.value = selectedMaterial.materialModels.johnsonCookFailure.strain_rate_factor;
    temperature_factor.value = selectedMaterial.materialModels.johnsonCookFailure.temperature_factor;
    reference_strain_rate_alt.value = selectedMaterial.materialModels.johnsonCookFailure.reference_strain_rate_2;
    
    // Accessing Isotropic Elasticity properties
    e_modulus.value = selectedMaterial.materialModels.isotropicElasticity.e_modulus;
    poisson.value = selectedMaterial.materialModels.isotropicElasticity.poisson;
    shear_modulus.value = selectedMaterial.materialModels.isotropicElasticity.shear_modulus;
    bulk_modulus.value = selectedMaterial.materialModels.isotropicElasticity.bulk_modulus;

    // Accessing Shock EOS properties
    grueneisen_coefficient.value = selectedMaterial.materialModels.shockEOS.grueneisen_coefficient;
    parameter_c1.value = selectedMaterial.materialModels.shockEOS.parameter_c1;
    parameter_s1.value = selectedMaterial.materialModels.shockEOS.parameter_s1;
    parameter_quadratic.value = selectedMaterial.materialModels.shockEOS.parameter_quadratic;

    // Accessing Physical Properties
    density.value = selectedMaterial.materialModels.physicalProperties.density;
    specific_heat.value = selectedMaterial.materialModels.physicalProperties.specific_heat;
    hardness.value = selectedMaterial.materialModels.physicalProperties.hardness;

    // Accessing Additional Info
    source.value = selectedMaterial.additionalInfo.source;
    reference.value = selectedMaterial.additionalInfo.reference;

    modalOverlay.setAttribute("material-id", selectedMaterial.id);
}



//------------------------------------------------------------
// DELETE DATA
//------------------------------------------------------------

const deleteButtonPressed = async (id) => {

    const isConfirmed = confirm("Are you sure you want to delete it?");

    if (isConfirmed) {
        try {
            const docRef = doc(db, "materialCollection", id);
            await deleteDoc(docRef);
        } catch(e) {
            setErrorMessage("error", "Unable to delete user data from the database. Please try again later");
            showErrorMessages();
        }
    }
}


//------------------------------------------------------------
// DOWNLOAD DATA
//------------------------------------------------------------

const downloadButtonPressed = async (id) => {
    const material = getmaterial(id);

    // Get the date
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

    // Generate a consistent random color based on the material name
    var materialName = `${material.materialInfo.name} (${material.materialInfo.version})`;
    var color = generateColor(materialName);

    // Values to be inserted into the XML template
    var values = {
        version: "18.2.0.210", // 1st value should be adjusted based on ANSYS version, if there are compatibility issues
        versiondate: formattedDate, // Use the formatted current date and time
        pr0_pa0: color.red.toString(), // Red
        pr0_pa1: color.green.toString(), // Green
        pr0_pa2: color.blue.toString(), // Blue
        pr0_pa3: "Appearance",
    
        pr1_pa4: "Interpolation Options",
        pr1_pa5: material.materialModels.physicalProperties.density || "n/a", // Density
        pr1_pa6: "7.88860905221012e-31",
    
        pr2_pa4: "Interpolation Options",
        pr2_pa7: material.materialModels.isotropicElasticity.e_modulus || "n/a", // Young's Modulus
        pr2_pa8: material.materialModels.isotropicElasticity.poisson || "n/a", // Poisson's Ratio
        pr2_pa9: "69607843137.2549",
        pr2_pa10: "26691729323.3083",
        pr2_pa6: "7.88860905221012e-31",
    
        pr3_pa11: material.materialModels.johnsonCookStrength.initial_yield_strength || "n/a", // Initial Yield Stress
        pr3_pa12: material.materialModels.johnsonCookStrength.hardening_constant || "n/a", // Hardening Constant
        pr3_pa13: material.materialModels.johnsonCookStrength.hardening_exponent || "n/a", // Hardening Exponent
        pr3_pa14: material.materialModels.johnsonCookStrength.strain_rate_constant || "n/a", // Strain Rate Constant
        pr3_pa15: material.materialModels.johnsonCookStrength.thermal_softening_exp || "n/a", // Thermal Softening Exponent
        pr3_pa16: material.materialModels.johnsonCookStrength.melting_temperature || "n/a", // Melting Temperature
        pr3_pa17: material.materialModels.johnsonCookStrength.reference_strain_rate || "n/a", // Reference Strain Rate (/sec)
    
        pr4_pa4: "Interpolation Options",
        pr4_pa18: material.materialModels.physicalProperties.specific_heat || "n/a", // Specific Heat
        pr4_pa6: "7.88860905221012e-31",
    
        pr5_pa19: material.materialModels.johnsonCookFailure.initial_failure_strain || "n/a", // Damage Constant D1
        pr5_pa20: material.materialModels.johnsonCookFailure.exponential_factor || "n/a", // Damage Constant D2
        pr5_pa21: material.materialModels.johnsonCookFailure.triaxial_factor || "n/a", // Damage Constant D3
        pr5_pa22: material.materialModels.johnsonCookFailure.strain_rate_factor || "n/a", // Damage Constant D4
        pr5_pa23: material.materialModels.johnsonCookFailure.temperature_factor || "n/a", // Damage Constant D5
        pr5_pa16: material.materialModels.johnsonCookStrength.melting_temperature || "n/a", // Melting Temperature (from Strength)
        pr5_pa17: material.materialModels.johnsonCookStrength.reference_strain_rate || "n/a", // Reference Strain Rate (/sec) (from Strength)
    
        pr6_pa24: material.materialModels.shockEOS.grueneisen_coefficient || "n/a", // Gruneisen Coefficient
        pr6_pa25: material.materialModels.shockEOS.parameter_c1 || "n/a", // Parameter C1
        pr6_pa26: material.materialModels.shockEOS.parameter_s1 || "n/a", // Parameter S1
        pr6_pa27: material.materialModels.shockEOS.parameter_quadratic || "n/a", // Parameter Quadratic S2
    
        pr7_pa10: material.materialModels.isotropicElasticity.shear_modulus || "n/a", // Shear Modulus
        material_name: materialName // Dynamic material_name variable
    };

    // Fetch the XML template
    const response = await fetch('mat-template.xml');
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
    link.download = materialName + '.xml';
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


//------------------------------------------------------------
// DISPLAY DETAILS VIEW ON LIST ITEM CLICK
//------------------------------------------------------------

const getmaterial = (id) => {
    return materials.find(material => {
        return material.id === id;
    })
}



const displaymaterialOnDetailsView = (id) => {
    const material = getmaterial(id);
    const singleMaterialDetail = document.getElementById(`${id}-detail`);

    if (!material.materialModels) {
        console.log(`materialModels is missing for material ID ${id}`);
    
        // Adding cards with empty values, slight blur effect, and overlayed message
        singleMaterialDetail.innerHTML = `
            <div class="blurred-content-container">
                <div class="card-mat-container blurred">
                    <div class="card-mat">
                        <div class="mat-header">Johnson Cook Strength</div>
                        <div class="mat-row">
                            <div class="mat-property">Initial Yield Strength:</div>
                            <div class="mat-data">-</div>
                            <div class="mat-unit">[MPa]</div>
                        </div>
                        <div class="mat-row">
                            <div class="mat-property">Hardening Constant:</div>
                            <div class="mat-data">-</div>
                            <div class="mat-unit">[MPa]</div>
                        </div>
                        <div class="mat-row">
                            <div class="mat-property">Hardening Exponent:</div>
                            <div class="mat-data">-</div>
                            <div class="mat-unit">[-]</div>
                        </div>
                        <div class="mat-row">
                            <div class="mat-property">Strain Rate Constant:</div>
                            <div class="mat-data">-</div>
                            <div class="mat-unit">[-]</div>
                        </div>
                        <div class="mat-row">
                            <div class="mat-property">Thermal Softening Exp:</div>
                            <div class="mat-data">-</div>
                            <div class="mat-unit">[-]</div>
                        </div>
                        <div class="mat-row">
                            <div class="mat-property">Melting Temperature:</div>
                            <div class="mat-data">-</div>
                            <div class="mat-unit">[K]</div>
                        </div>
                        <div class="mat-row">
                            <div class="mat-property">Reference Strain Rate:</div>
                            <div class="mat-data">-</div>
                            <div class="mat-unit">[1/s]</div>
                        </div>
                    </div>
    
                    <div class="card-mat">
                        <div class="mat-header">Johnson Cook Failure</div>
                        <div class="mat-row">
                            <div class="mat-property">Initial Failure Strain:</div>
                            <div class="mat-data">-</div>
                            <div class="mat-unit">[-]</div>
                        </div>
                        <div class="mat-row">
                            <div class="mat-property">Exponential Factor:</div>
                            <div class="mat-data">-</div>
                            <div class="mat-unit">[-]</div>
                        </div>
                        <div class="mat-row">
                            <div class="mat-property">Triaxial Factor:</div>
                            <div class="mat-data">-</div>
                            <div class="mat-unit">[-]</div>
                        </div>
                        <div class="mat-row">
                            <div class="mat-property">Strain Rate Factor:</div>
                            <div class="mat-data">-</div>
                            <div class="mat-unit">[-]</div>
                        </div>
                        <div class="mat-row">
                            <div class="mat-property">Temperature Factor:</div>
                            <div class="mat-data">-</div>
                            <div class="mat-unit">[-]</div>
                        </div>
                    </div>
    
                    <div class="card-mat">
                        <div class="mat-header">Isotropic Elasticity</div>
                        <div class="mat-row">
                            <div class="mat-property">Young's Modulus:</div>
                            <div class="mat-data">-</div>
                            <div class="mat-unit">[GPa]</div>
                        </div>
                        <div class="mat-row">
                            <div class="mat-property">&#957-Poisson Ratio:</div>
                            <div class="mat-data">-</div>
                            <div class="mat-unit">[-]</div>
                        </div>
                        <div class="mat-row">
                            <div class="mat-property">Shear Modulus:</div>
                            <div class="mat-data">-</div>
                            <div class="mat-unit">[-]</div>
                        </div>
                        <div class="mat-row">
                            <div class="mat-property">Bulk Modulus:</div>
                            <div class="mat-data">-</div>
                            <div class="mat-unit">[GPa]</div>
                        </div>
                    </div>
    
                    <div class="card-mat">
                        <div class="mat-header">Shock EOS</div>
                        <div class="mat-row">
                            <div class="mat-property">&#947-Grueneisen Coefficient:</div>
                            <div class="mat-data">-</div>
                            <div class="mat-unit">[-]</div>
                        </div>
                        <div class="mat-row">
                            <div class="mat-property">Parameter C1:</div>
                            <div class="mat-data">-</div>
                            <div class="mat-unit">[m/s]</div>
                        </div>
                        <div class="mat-row">
                            <div class="mat-property">Parameter S1:</div>
                            <div class="mat-data">-</div>
                            <div class="mat-unit">[-]</div>
                        </div>
                        <div class="mat-row">
                            <div class="mat-property">Parameter Quadratic:</div>
                            <div class="mat-data">-</div>
                            <div class="mat-unit">[s/m]</div>
                        </div>
                    </div>
    
                    <div class="card-mat">
                        <div class="mat-header">Physical Properties</div>
                        <div class="mat-row">
                            <div class="mat-property">Density:</div>
                            <div class="mat-data">-</div>
                            <div class="mat-unit">[kg/m3]</div>
                        </div>
                        <div class="mat-row">
                            <div class="mat-property">Specific Heat Const. Pr.:</div>
                            <div class="mat-data">-</div>
                            <div class="mat-unit">[J/kgK]</div>
                        </div>
                    </div>
    
                    <div class="card-mat">
                        <div class="mat-header">Other</div>
                        <div class="mat-row">
                            <div class="mat-property">Hardness:</div>
                            <div class="mat-data">-</div>
                            <div class="mat-unit">[BHN]</div>
                        </div>
                        <div class="mat-row">
                            <div class="mat-property">Source:</div>
                            <div class="mat-data">-</div>
                            <div class="mat-unit"></div>
                        </div>
                        <div class="mat-row">
                            <div class="mat-property">Reference:</div>
                            <div class="mat-data">-</div>
                            <div class="mat-unit"></div>
                        </div>
                    </div>
                </div>
    
                <div class="card-chart-container">    
                    <div class="card-chart blurred">
                        <div class="mat-header">Chart of Johnson Cook Strength</div>
                        <canvas class="chart-canv" id="chart-johnson-cook-strength"></canvas>
                    </div>

                    <div class="card-chart blurred">
                        <div class="mat-header">Chart of Johnson Cook Failure</div>
                        <canvas class="chart-canv" id="chart-johnson-cook-failure"></canvas>
                    </div>
                </div>


                <div class="overlay-message">
                    <div class="overlay-box">
                        <div class="overlay-text">You need to purchase this material or to have a higher subscription tier!</div>
                    </div>
                </div>
            </div>
        `;

        // Initialize charts after rendering
        setTimeout(() => {
            initializeCharts(id);
        }, 0);
        
        return;
    } else {
        // Function to format the value
        const formatValue = (value) => (value === null || value === undefined || value === '') ? 'n/a' : value;
        
        // Function to check if the value is missing data
        const isMissingData = (value) => value === null || value === undefined || value === '';

        singleMaterialDetail.innerHTML = `
            <div class="card-mat-container">
                <div class="card-mat">
                    <div class="mat-header">Johnson Cook Strength</div>
                    <div class="mat-row ${isMissingData(material.materialModels.johnsonCookStrength.initial_yield_strength) ? 'missing-data' : ''}">
                        <div class="mat-property">Initial Yield Strength:</div>
                        <div class="mat-data">${formatValue(material.materialModels.johnsonCookStrength.initial_yield_strength)}</div>
                        <div class="mat-unit">[MPa]</div>
                    </div>
                    <div class="mat-row ${isMissingData(material.materialModels.johnsonCookStrength.hardening_constant) ? 'missing-data' : ''}">
                        <div class="mat-property">Hardening Constant:</div>
                        <div class="mat-data">${formatValue(material.materialModels.johnsonCookStrength.hardening_constant)}</div>
                        <div class="mat-unit">[MPa]</div>
                    </div>
                    <div class="mat-row ${isMissingData(material.materialModels.johnsonCookStrength.hardening_exponent) ? 'missing-data' : ''}">
                        <div class="mat-property">Hardening Exponent:</div>
                        <div class="mat-data">${formatValue(material.materialModels.johnsonCookStrength.hardening_exponent)}</div>
                        <div class="mat-unit">[-]</div>
                    </div>
                    <div class="mat-row ${isMissingData(material.materialModels.johnsonCookStrength.strain_rate_constant) ? 'missing-data' : ''}">
                        <div class="mat-property">Strain Rate Constant:</div>
                        <div class="mat-data">${formatValue(material.materialModels.johnsonCookStrength.strain_rate_constant)}</div>
                        <div class="mat-unit">[-]</div>
                    </div>
                    <div class="mat-row ${isMissingData(material.materialModels.johnsonCookStrength.thermal_softening_exp) ? 'missing-data' : ''}">
                        <div class="mat-property">Thermal Softening Exp:</div>
                        <div class="mat-data">${formatValue(material.materialModels.johnsonCookStrength.thermal_softening_exp)}</div>
                        <div class="mat-unit">[-]</div>
                    </div>
                    <div class="mat-row ${isMissingData(material.materialModels.johnsonCookStrength.melting_temperature) ? 'missing-data' : ''}">
                        <div class="mat-property">Melting Temperature:</div>
                        <div class="mat-data">${formatValue(material.materialModels.johnsonCookStrength.melting_temperature)}</div>
                        <div class="mat-unit">[K]</div>
                    </div>
                    <div class="mat-row ${isMissingData(material.materialModels.johnsonCookStrength.reference_strain_rate) ? 'missing-data' : ''}">
                        <div class="mat-property">Reference Strain Rate:</div>
                        <div class="mat-data">${formatValue(material.materialModels.johnsonCookStrength.reference_strain_rate)}</div>
                        <div class="mat-unit">[1/s]</div>
                    </div>
                </div>

                <div class="card-mat">
                    <div class="mat-header">Johnson Cook Failure</div>
                    <div class="mat-row ${isMissingData(material.materialModels.johnsonCookFailure.initial_failure_strain) ? 'missing-data' : ''}">
                        <div class="mat-property">Initial Failure Strain:</div>
                        <div class="mat-data">${formatValue(material.materialModels.johnsonCookFailure.initial_failure_strain)}</div>
                        <div class="mat-unit">[-]</div>
                    </div>
                    <div class="mat-row ${isMissingData(material.materialModels.johnsonCookFailure.exponential_factor) ? 'missing-data' : ''}">
                        <div class="mat-property">Exponential Factor:</div>
                        <div class="mat-data">${formatValue(material.materialModels.johnsonCookFailure.exponential_factor)}</div>
                        <div class="mat-unit">[-]</div>
                    </div>
                    <div class="mat-row ${isMissingData(material.materialModels.johnsonCookFailure.triaxial_factor) ? 'missing-data' : ''}">
                        <div class="mat-property">Triaxial Factor:</div>
                        <div class="mat-data">${formatValue(material.materialModels.johnsonCookFailure.triaxial_factor)}</div>
                        <div class="mat-unit">[-]</div>
                    </div>
                    <div class="mat-row ${isMissingData(material.materialModels.johnsonCookFailure.strain_rate_factor) ? 'missing-data' : ''}">
                        <div class="mat-property">Strain Rate Factor:</div>
                        <div class="mat-data">${formatValue(material.materialModels.johnsonCookFailure.strain_rate_factor)}</div>
                        <div class="mat-unit">[-]</div>
                    </div>
                    <div class="mat-row ${isMissingData(material.materialModels.johnsonCookFailure.temperature_factor) ? 'missing-data' : ''}">
                        <div class="mat-property">Temperature Factor:</div>
                        <div class="mat-data">${formatValue(material.materialModels.johnsonCookFailure.temperature_factor)}</div>
                        <div class="mat-unit">[-]</div>
                    </div>
                    <div class="mat-row ${isMissingData(material.materialModels.johnsonCookStrength.melting_temperature) ? 'missing-data' : ''}">
                        <div class="mat-property">Melting Temperature:</div>
                        <div class="mat-data">${formatValue(material.materialModels.johnsonCookStrength.melting_temperature)}</div>
                        <div class="mat-unit">[K]</div>
                    </div>
                    <div class="mat-row ${isMissingData(material.materialModels.johnsonCookStrength.reference_strain_rate) ? 'missing-data' : ''}">
                        <div class="mat-property">Reference Strain Rate:</div>
                        <div class="mat-data">${formatValue(material.materialModels.johnsonCookStrength.reference_strain_rate)}</div>
                        <div class="mat-unit">[1/s]</div>
                    </div>
                </div>

                <div class="card-mat">
                    <div class="mat-header">Isotropic Elasticity</div>
                    <div class="mat-row ${isMissingData(material.materialModels.isotropicElasticity.e_modulus) ? 'missing-data' : ''}">
                        <div class="mat-property">Young's Modulus:</div>
                        <div class="mat-data">${formatValue(material.materialModels.isotropicElasticity.e_modulus)}</div>
                        <div class="mat-unit">[GPa]</div>
                    </div>
                    <div class="mat-row ${isMissingData(material.materialModels.isotropicElasticity.poisson) ? 'missing-data' : ''}">
                        <div class="mat-property">&#957-Poisson Ratio:</div>
                        <div class="mat-data">${formatValue(material.materialModels.isotropicElasticity.poisson)}</div>
                        <div class="mat-unit">[-]</div>
                    </div>
                    <div class="mat-row ${isMissingData(material.materialModels.isotropicElasticity.shear_modulus) ? 'missing-data' : ''}">
                        <div class="mat-property">Shear Modulus:</div>
                        <div class="mat-data">${formatValue(material.materialModels.isotropicElasticity.shear_modulus)}</div>
                        <div class="mat-unit">[-]</div>
                    </div>
                    <div class="mat-row ${isMissingData(material.materialModels.isotropicElasticity.bulk_modulus) ? 'missing-data' : ''}">
                        <div class="mat-property">Bulk Modulus:</div>
                        <div class="mat-data">${formatValue(material.materialModels.isotropicElasticity.bulk_modulus)}</div>
                        <div class="mat-unit">[GPa]</div>
                    </div>
                </div>

                <div class="card-mat">
                    <div class="mat-header">Shock EOS</div>
                    <div class="mat-row ${isMissingData(material.materialModels.shockEOS.grueneisen_coefficient) ? 'missing-data' : ''}">
                        <div class="mat-property">&#947-Grueneisen Coefficient:</div>
                        <div class="mat-data">${formatValue(material.materialModels.shockEOS.grueneisen_coefficient)}</div>
                        <div class="mat-unit">[-]</div>
                    </div>
                    <div class="mat-row ${isMissingData(material.materialModels.shockEOS.parameter_c1) ? 'missing-data' : ''}">
                        <div class="mat-property">Parameter C1:</div>
                        <div class="mat-data">${formatValue(material.materialModels.shockEOS.parameter_c1)}</div>
                        <div class="mat-unit">[m/s]</div>
                    </div>
                    <div class="mat-row ${isMissingData(material.materialModels.shockEOS.parameter_s1) ? 'missing-data' : ''}">
                        <div class="mat-property">Parameter S1:</div>
                        <div class="mat-data">${formatValue(material.materialModels.shockEOS.parameter_s1)}</div>
                        <div class="mat-unit">[-]</div>
                    </div>
                    <div class="mat-row ${isMissingData(material.materialModels.shockEOS.parameter_quadratic) ? 'missing-data' : ''}">
                        <div class="mat-property">Parameter Quadratic:</div>
                        <div class="mat-data">${formatValue(material.materialModels.shockEOS.parameter_quadratic)}</div>
                        <div class="mat-unit">[s/m]</div>
                    </div>
                </div>

                <div class="card-mat">
                    <div class="mat-header">Physical Properties</div>
                    <div class="mat-row ${isMissingData(material.materialModels.physicalProperties.density) ? 'missing-data' : ''}">
                        <div class="mat-property">Density:</div>
                        <div class="mat-data">${formatValue(material.materialModels.physicalProperties.density)}</div>
                        <div class="mat-unit">[kg/m3]</div>
                    </div>
                    <div class="mat-row ${isMissingData(material.materialModels.physicalProperties.specific_heat) ? 'missing-data' : ''}">
                        <div class="mat-property">Specific Heat Const. Pr.:</div>
                        <div class="mat-data">${formatValue(material.materialModels.physicalProperties.specific_heat)}</div>
                        <div class="mat-unit">[J/kgK]</div>
                    </div>
                </div>

                <div class="card-mat">
                    <div class="mat-header">Other</div>
                    <div class="mat-row ${isMissingData(material.materialModels.physicalProperties.hardness) ? 'missing-data' : ''}">
                        <div class="mat-property">Hardness:</div>
                        <div class="mat-data">${formatValue(material.materialModels.physicalProperties.hardness)}</div>
                        <div class="mat-unit">[BHN]</div>
                    </div>
                    <div class="mat-row ${isMissingData(material.additionalInfo.source) ? 'missing-data' : ''}">
                        <div class="mat-property">Source:</div>
                        <div class="mat-data">${formatValue(material.additionalInfo.source)}</div>
                        <div class="mat-unit"></div>
                    </div>
                    <div class="mat-row ${isMissingData(material.additionalInfo.reference) ? 'missing-data' : ''}">
                        <div class="mat-property">Reference:</div>
                        <div class="mat-data">
                            <a href="${material.additionalInfo.reference}" target="_blank" class="reference-link">Link</a>
                        </div>
                        <div class="mat-unit"></div>
                    </div>
                </div>
            </div>

            <div class="card-chart-container">    
                <div class="card-chart">
                    <div class="mat-header">Chart of Johnson Cook Strength</div>
                    <canvas class="chart-canv" id="chart-johnson-cook-strength"></canvas>
                </div>

                <div class="card-chart">
                    <div class="mat-header">Chart of Johnson Cook Failure</div>
                    <canvas class="chart-canv" id="chart-johnson-cook-failure"></canvas>
                </div>
            </div>
        `;

        // Initialize charts after rendering
        setTimeout(() => {
            initializeCharts(id);
        }, 0);
    }


};

const displayButtonsOnDetailView = (id) => {
    // const material = getmaterial(id);
    const listItem = document.getElementById(id);


    const material = materials.find(item => item.id === id);

    if (!material) {
        console.log("Material not found");
        return;
    }


    console.log("listItem", listItem);

    if (listItem) {
        // Hide buttons on all other list items
        hideOtherButtonsOnDetailView(id);

        const buttonsDiv = document.createElement("div");
        buttonsDiv.className = "action";

        // Determine the class based on material tier
        let tierClass = "";
        let tierName = ""; // Capitalize first letter
        let tierPrice = "";
        
        switch (material.materialInfo.tier) {
            case "free":
                tierClass = "free";
                tierName = "| Free";
                tierPrice = "free";
                break;
            case "basic":
                tierClass = "basic";
                tierName = "| Basic";
                tierPrice = "€ 10";
                break;
            case "standard":
                tierClass = "standard";
                tierName = "| Standard";
                tierPrice = "€ 25";
                break;
            case "premium":
                tierClass = "premium";
                tierName = "| Premium";
                tierPrice = "€ 40";
                break;
            case "admin":
                tierClass = "admin";
                tierName = "";
                tierPrice = "Disabled Material ";
                break;
            default:
                tierClass = ""; // Default, no additional styling
                tierName = material.materialInfo.tier.charAt(0).toUpperCase() + material.materialInfo.tier.slice(1);
        }



        buttonsDiv.innerHTML = `

                        <!-- Favourite Button -->
            <button class="button-tooltip favourite-btn" data-tooltip="Add this Material to your Favourites">
                <img src="./assets/icons/star-empty-icon.svg" alt="favourite icon" width="20" height="20">
            </button>

            <button class="button-tooltip download-btn" data-tooltip="Download Material as XML File">
                <img src="./assets/icons/download-icon.png" alt="download icon" width="20" height="20">
            </button>
            <button class="button-tooltip material-purchase-btn material-purchase-btn-tooltip ${tierClass}" data-tooltip="Price: ${tierPrice} ${tierName}">
                <img src="./assets/icons/shopping-cart-icon.png" alt="shopping cart icon" width="20" height="20"> 
            </button>

            <button class="button-tooltip edit-user" data-tooltip="Edit this Material">
                <img src="./assets/icons/edit-icon.png" alt="edit icon" width="20" height="20">
            </button>
            <button class="button-tooltip delete-user" data-tooltip="Delete this Material">
                <img src="./assets/icons/delete-icon.png" alt="delete icon" width="20" height="20">
            </button>
        `;
    

        // Clear any previous buttons on this item to avoid duplication
        const existingActionDiv = listItem.querySelector('.action');
        if (existingActionDiv) {
            existingActionDiv.remove();
        }

        // Append the new buttons div to the list item
        listItem.appendChild(buttonsDiv);

        // Check if the user is admin
        if (!window.isAdmin) {
            // Remove edit and delete buttons if the user is not admin
            const editButton = buttonsDiv.querySelector(".edit-user");
            const deleteButton = buttonsDiv.querySelector(".delete-user");
            
            if (editButton) {
                editButton.remove(); // Remove edit button from DOM
            }
            if (deleteButton) {
                deleteButton.remove(); // Remove delete button from DOM
            }
        }


        // Favourite button logic
        const favouriteBtn = buttonsDiv.querySelector('.favourite-btn');
        const favouriteIcon = favouriteBtn.querySelector('img');

        // Fetch the current user's favourite status and update the icon
        checkIfFavourite(id)
            .then(isFavourite => updateFavouriteIcon(isFavourite, favouriteIcon))
            .catch(error => console.error("Error checking favourites:", error));

        // Handle click event for toggling favourite
        favouriteBtn.addEventListener('click', () => {
            const currentIsFavourite = favouriteIcon.src.includes('star-filled-icon.svg');
            const newIsFavourite = !currentIsFavourite;

            // Swap the icon based on the new state
            updateFavouriteIcon(newIsFavourite, favouriteIcon);

            // Update Firestore with the new favourite state
            if (newIsFavourite) {
                addToFavourites(id);  // Add the item to favourites
            } else {
                removeFromFavourites(id);  // Remove the item from favourites
            }
        });

        // Hide the specific list item Star Icon (favorite-indicator)
        const starIcon = listItem.querySelector(`#star-icon-${id}`);
        const starIconContainer = listItem.querySelector(`#favorite-indicator-${id}`); // Assuming we have a unique ID for each star icon
        if (starIcon) {
            starIcon.style.display = 'none'; // Hide the star icon
            starIconContainer.style.display = "none";
        }


        // Hide list item Star Icon



    } else {
        console.error(`material with id ${id} not found`);
    }
};


const hideOtherButtonsOnDetailView = (id) => {
    const listItems = document.querySelectorAll(".material-list-item");

    listItems.forEach(item => {
        if (item.id !== id) {
            const actionDiv = item.querySelector('.action');
            if (actionDiv) {
                actionDiv.remove();
            }
        }
    });
};

//------------------------------------------------------------
// FAVOURITE LOGIC
//------------------------------------------------------------

let userFavorites = new Set(); // Store favorite material IDs

const fetchUserFavorites = async () => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error('User is not logged in');
    }

    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
        const userData = userDoc.data();
        const favourites = userData.favourites || {};
        // Populate the set with the favorite material IDs
        userFavorites = new Set(Object.keys(favourites));
    } else {
        console.log('User document not found');
    }
};



// Function to update the favourite icon based on the state
const updateFavouriteIcon = (isFavourite, iconElement) => {
    if (isFavourite) {
        iconElement.src = './assets/icons/star-filled-icon.svg';
        iconElement.alt = 'remove from favourites';
    } else {
        iconElement.src = './assets/icons/star-empty-icon.svg';
        iconElement.alt = 'add to favourites';
    }
};

// Check if the material is a favourite
const checkIfFavourite = async (materialId) => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error('User is not logged in');
    }

    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
        const userData = userDoc.data();
        const favourites = userData.favourites || {};

        // Check if the material ID is in the favourites map
        return favourites.hasOwnProperty(materialId);
    } else {
        console.log('User document not found');
        return false;
    }
};

// Add the material to favourites in Firestore
const addToFavourites = async (materialId) => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error('User is not logged in');
    }

    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, {
        [`favourites.${materialId}`]: true
    });
    console.log(`Material ${materialId} added to favourites`);
};

// Remove the material from favourites in Firestore
const removeFromFavourites = async (materialId) => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error('User is not logged in');
    }

    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, {
        [`favourites.${materialId}`]: deleteField()  // Remove the favourite
    });
    console.log(`Material ${materialId} removed from favourites`);
};

//------------------------------------------------------------
// CHART
//------------------------------------------------------------

const initializeCharts = (id) => {
    const ctxStrength = document.getElementById('chart-johnson-cook-strength').getContext('2d');
    const ctxFailure = document.getElementById('chart-johnson-cook-failure').getContext('2d');
    const { xValues, f1Values, f100Values, f1000Values } = generateJCSchart(id);
    const { xValuesJCF, f1ValuesJCF, f100ValuesJCF, f1000ValuesJCF } = generateJCFchart(id);

    new Chart(ctxStrength, {
        type: 'line',
        data: {
            labels: xValues, // Use the generated xValues for the X-axis labels
            datasets: [
                {
                    label: '1/s',
                    data: f1Values, // Use the generated f1Values for the dataset
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 3,
                    pointRadius: 0
                },
                {
                    label: '100/s',
                    data: f100Values, // Use the generated f100Values for the dataset
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 3,
                    pointRadius: 0
                },
                {
                    label: '1000/s',
                    data: f1000Values, // Use the generated f1000Values for the dataset
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
                        color: 'white',

                    },
                    ticks: {
                        color: 'white',

                        
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Yield Stress [MPa]',
                        color: 'white',

                    },
                    ticks: {
                        color: 'white',

                        
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: 'white', // Set legend text color to white
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
                                    fontColor: 'white' // Ensure this is white as well
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
            labels: xValuesJCF, // Use the generated xValues for the X-axis labels
            datasets: [
                {
                    label: '1/s',
                    data: f1ValuesJCF, // Use the generated f1Values for the dataset
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 3,
                    pointRadius: 0
                },
                {
                    label: '100/s',
                    data: f100ValuesJCF, // Use the generated f100Values for the dataset
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 3,
                    pointRadius: 0
                },
                {
                    label: '1000/s',
                    data: f1000ValuesJCF, // Use the generated f1000Values for the dataset
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
                        color: 'white',

                    },
                    ticks: {
                        color: 'white',

                        
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Plastic Failure Strain εf',
                        color: 'white',

                    },
                    ticks: {
                        color: 'white',

                        
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: 'white', // Set legend text color to white
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
                                    fontColor: 'white' // Ensure this is white as well
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




const generateJCSchart = (id) => {
    const material = getmaterial(id);

    if (!material.materialModels) {
        // Assign extracted values to corresponding variables from Johnson Cook Strength subcollection
        var aJCS = parseFloat(792);
        var bJCS = parseFloat(510);
        var nJCS = parseFloat(0.26);
        var cJCS = parseFloat(0.014);
        var eJCS = parseFloat(1);
    } else {
        // Assign extracted values to corresponding variables from Johnson Cook Strength subcollection
        var aJCS = parseFloat(material.materialModels.johnsonCookStrength.initial_yield_strength);
        var bJCS = parseFloat(material.materialModels.johnsonCookStrength.hardening_constant);
        var nJCS = parseFloat(material.materialModels.johnsonCookStrength.hardening_exponent);
        var cJCS = parseFloat(material.materialModels.johnsonCookStrength.strain_rate_constant);
        var eJCS = parseFloat(material.materialModels.johnsonCookStrength.reference_strain_rate);
    }


    // Use the extracted values to generate chart data
    const stepSizeJCS = 0.0001;
    const xValuesJCS = [];
    const f1ValuesJCS = [];
    const f100ValuesJCS = [];
    const f1000ValuesJCS = [];

    for (let xJCS = 0; xJCS <= 0.156; xJCS += stepSizeJCS) {
        const f1JCS = (aJCS + bJCS * Math.pow(xJCS, nJCS)) * (1 + cJCS * Math.log(1 * eJCS));
        const f100JCS = (aJCS + bJCS * Math.pow(xJCS, nJCS)) * (1 + cJCS * Math.log(100 * eJCS));
        const f1000JCS = (aJCS + bJCS * Math.pow(xJCS, nJCS)) * (1 + cJCS * Math.log(1000 * eJCS));

        xValuesJCS.push(xJCS); // Push x value into xValues array
        f1ValuesJCS.push(f1JCS);
        f100ValuesJCS.push(f100JCS);
        f1000ValuesJCS.push(f1000JCS);
    }

    // Round xValues to three decimal places
    const roundedXValuesJCS = xValuesJCS.map(xJCS => parseFloat(xJCS.toFixed(3)));

    // Multiply rounded xValues by 100
    const multipliedXValuesJCS = roundedXValuesJCS.map(xJCS => xJCS * 100);

    // Round xValues to three decimal places
    const roundedmultipliedXValuesJCS = multipliedXValuesJCS.map(xJCS => parseFloat(xJCS.toFixed(3)));

    return { xValues: roundedmultipliedXValuesJCS, f1Values: f1ValuesJCS, f100Values: f100ValuesJCS, f1000Values: f1000ValuesJCS };
}

const generateJCFchart = (id) => {
    const material = getmaterial(id);

    if (!material.materialModels) {
        // Assign fake values
        var d1JCF = parseFloat(0.05);
        var d2JCF = parseFloat(3.44);
        var d3JCF = parseFloat(-2.12);
        var d4JCF = parseFloat(0.002);
        var eJCF = parseFloat(1);
    } else {
        // Assign extracted values to corresponding variables from Johnson Cook Failure subcollection
        var d1JCF = parseFloat(material.materialModels.johnsonCookFailure.initial_failure_strain);
        var d2JCF = parseFloat(material.materialModels.johnsonCookFailure.exponential_factor);
        var d3JCF = parseFloat(material.materialModels.johnsonCookFailure.triaxial_factor);
        var d4JCF = parseFloat(material.materialModels.johnsonCookFailure.strain_rate_factor);
        var eJCF = parseFloat(material.materialModels.johnsonCookStrength.reference_strain_rate);
    }


    // Use the extracted values to generate chart data
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

    return { xValuesJCF: roundedXValuesJCF, f1ValuesJCF: f1ValuesJCF, f100ValuesJCF: f100ValuesJCF, f1000ValuesJCF: f1000ValuesJCF };
}


//------------------------------------------------------------
// MODAL
//------------------------------------------------------------


const modalOverlay = document.getElementById("modal-overlay");
const closeBtn = document.querySelector(".close-btn");

const addButtonPressed = () => {
    modalOverlay.style.display = "flex";
    modalOverlay.removeAttribute("material-id");

    // Clear all input fields
    name.value = "";
    version.value = "";
    material.value = "";  // Ensure this refers to the correct element

    // Clear MaterialInfo fields
    name.value = "";
    version.value = "";
    material.value = "";
    icon.value = "";
    description.value = "";
    tier.value = "";
    price.value = "";

    // Clear MaterialModels subcollections fields
    // Johnson Cook Strength
    initial_yield_strength.value = "";
    hardening_constant.value = ""; // Correct typo here (was hardening_constan)
    hardening_exponent.value = "";
    strain_rate_constant.value = "";
    thermal_softening_exp.value = "";
    melting_temperature.value = "";
    reference_strain_rate.value = "";

    // Johnson Cook Failure
    initial_failure_strain.value = "";
    exponential_factor.value = "";
    triaxial_factor.value = "";
    strain_rate_factor.value = "";
    temperature_factor.value = "";
    reference_strain_rate_alt.value = ""; // Make sure you use the correct variable

    // Isotropic Elasticity
    e_modulus.value = "";
    poisson.value = "";
    shear_modulus.value = "";
    bulk_modulus.value = "";

    // Shock EOS
    grueneisen_coefficient.value = "";
    parameter_c1.value = "";
    parameter_s1.value = "";
    parameter_quadratic.value = "";

    // Physical Properties
    density.value = "";
    specific_heat.value = "";
    hardness.value = "";

    // Additional Info
    source.value = "";
    reference.value = "";

    console.log("Name field after clear:", name.value);

};


const closeButtonPressed = () => {
    modalOverlay.style.display = "none";
}

const hideModal = (e) => {
    
    if (e instanceof Event) {
        console.log(e.target);
        console.log(e.currenTtarget);
    
        if (e.target === e.currentTarget) {
            modalOverlay.style.display = "none";
        }         
    } else {
        modalOverlay.style.display = "none";
    }

}

addBtn.addEventListener("click", addButtonPressed);
closeBtn.addEventListener("click", closeButtonPressed);
modalOverlay.addEventListener("click", hideModal);

//------------------------------------------------------------
// FORM VALIDATION AND ADD DATA
//------------------------------------------------------------

const saveBtn = document.querySelector(".save-btn");
const error = {};



const name = document.getElementById("name"),
      version = document.getElementById("version"),
      initial_failure_strain = document.getElementById("initial_failure_strain"),
      initial_yield_strength = document.getElementById("initial_yield_strength"),
      material = document.getElementById("material");

const saveButtonPressed = async() => {


    /* OLD CHECKS, MAYBE GOOD FOR LATER

    checkRequired([name, version, initial_failure_strain, initial_yield_strength, material]);
    checkmaterial(material);
    checkInputLength(initial_failure_strain, 2);
    checkInputLength(initial_yield_strength, 10);
    showErrorMessages(); */

    if (Object.keys(error).length === 0) {

        const mat_properties = {
            materialInfo: {
                name: name.value,
                material: material.value, // Adjust as necessary if `material` should be a specific category
                version: version.value,
                tier: tier.value, // Ensure you include this if it’s part of the schema
                price: price.value, // Ensure you include this if it’s part of the schema
                icon: icon.value,
                description: description.value
            },
            
            materialModels: {
                isotropicElasticity: {
                    e_modulus: e_modulus.value,
                    poisson: poisson.value,
                    shear_modulus: shear_modulus.value,
                    bulk_modulus: bulk_modulus.value,
                },
                
                johnsonCookStrength: {
                    initial_yield_strength: initial_yield_strength.value,
                    hardening_constant: hardening_constant.value, // Correct field name
                    hardening_exponent: hardening_exponent.value,
                    strain_rate_constant: strain_rate_constant.value,
                    thermal_softening_exp: thermal_softening_exp.value,
                    melting_temperature: melting_temperature.value,
                    reference_strain_rate: reference_strain_rate.value,
                },
                
                johnsonCookFailure: {
                    initial_failure_strain: initial_failure_strain.value,
                    exponential_factor: exponential_factor.value,
                    triaxial_factor: triaxial_factor.value,
                    strain_rate_factor: strain_rate_factor.value,
                    temperature_factor: temperature_factor.value,
                    reference_strain_rate_alt: reference_strain_rate_alt.value, // Adjust to match the field name in the new schema
                },
                
                physicalProperties: {
                    density: density.value,
                    specific_heat: specific_heat.value,
                    hardness: hardness.value,
                },
                
                shockEOS: {
                    grueneisen_coefficient: grueneisen_coefficient.value,
                    parameter_c1: parameter_c1.value,
                    parameter_s1: parameter_s1.value,
                    parameter_quadratic: parameter_quadratic.value,
                }
            },
            
            additionalInfo: {
                source: source.value,
                reference: reference.value,
            }
        };
        

        if(modalOverlay.getAttribute("material-id")) {
            // update data
            const docRef = doc(db, "materialCollection", modalOverlay.getAttribute("material-id"));

            try {
                
                await updateDoc(docRef, mat_properties);

                hideModal();

            } catch(e) {
                setErrorMessage("error", "Unable to update user data to the database. Please try again later");
                showErrorMessages();
            }



        } else {
            // add data
            try {
                await addDoc(dbRef, mat_properties);
                hideModal();
                // here
            } catch (err) {
                setErrorMessage("error", "Unable to add user data to the database. Please try again later");
                showErrorMessages();
            }
        }

    }
}

const checkRequired = (inputArray) => {
    inputArray.forEach(input => {
        if (input.value.trim() === "") {
            // console.log(input.id + " is empty");
            setErrorMessage(input, input.id + " is empty");
        } else {
            deleteErrorMessage(input);
        }
    });
    console.log(error);
}

const setErrorMessage = (input, message) => {
    if (input.nodeName === "INPUT") {
        error[input.id] = message;
        input.style.border = "1px solid red";
    } else {
        error[input] = message;
    }

}

const deleteErrorMessage = (input) => {
    delete error[input.id];
    input.style.border = "1px solid green";
}

const checkInputLength = (input, number) => {
    if (input.value.trim() !== "") {
        if(input.value.trim().length === number) {
            deleteErrorMessage(input);
        } else {
            setErrorMessage(input, input.id + ` must be ${number} digits`);
        }
    }
}



const checkmaterial = (input) => {
    if(input.value.trim() !== "") {
        const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
        if(re.test(input.value.trim())) {
            deleteErrorMessage(input);
        } else {
            setErrorMessage(input, input.id + " is invalid");
        }
    }
}

const showErrorMessages = () => {
    const errorLabel = document.getElementById("error-label");

errorLabel.innerHTML = "";
    for (const key in error){
        const li = document.createElement("li");
        li.innerText = error[key];
        li.style.color = "red";
        errorLabel.appendChild(li);
    }
}

saveBtn.addEventListener("click", saveButtonPressed);




//------------------------------------------------------------
// TABS
//------------------------------------------------------------

document.addEventListener('DOMContentLoaded', function () {
    var tabs = document.querySelectorAll('.tab');
    var contents = document.querySelectorAll('.tab-content');

    tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            // Remove active class from all tabs
            tabs.forEach(function (tab) {
            tab.classList.remove('active');
            });

            // Add active class to clicked tab
            tab.classList.add('active');

            // Hide all contents
            contents.forEach(function (content) {
            content.classList.remove('active');
            });

            // Show content corresponding to clicked tab
            var target = tab.getAttribute('data-target');
            document.getElementById(target).classList.add('active');

            // Log the active tab
            console.log('Active tab:', tab.textContent || tab.innerText);        
        });
    });
});


//------------------------------------------------------------
// SLIDESHOW
//------------------------------------------------------------

let slideIndex = 0;
const slides = document.querySelectorAll('.slide');
const totalSlides = slides.length;
const indicators = document.querySelectorAll('.indicator');

// Function to show the current slide
function showSlide(index) {
    const offset = -index * 20; // Calculate the offset based on the current slide index
    document.querySelector('#slideshow').style.transform = `translateX(${offset}%)`;
    updateIndicators(index);
}

// Function to show the next slide
function showNextSlide() {
    slideIndex = (slideIndex + 1) % totalSlides; // Increment index and loop back if needed
    showSlide(slideIndex);
}

// Update indicators based on the current slide
function updateIndicators(index) {
    indicators.forEach((indicator, i) => {
        indicator.classList.toggle('active', i === index);
    });
}

// Attach click events to indicators for manual slide control
indicators.forEach((indicator, index) => {
    indicator.addEventListener('click', () => {
        slideIndex = index;
        showSlide(slideIndex);
    });
});

// Set the slideshow to rotate every 5 seconds
setInterval(showNextSlide, 5000);



//------------------------------------------------------------
// SHOPPING CART PRESSED
//------------------------------------------------------------

// Array to hold the materials in the shopping cart
export let shoppingCart = [];

// Function to handle adding a material to the cart
const MaterialPurchaseButtonPressed = async (id) => {
    const selectedMaterial = getmaterial(id);  // Access the current material
    const userId = auth.currentUser.uid; // Get the current user's UID from Firebase Auth
    const userTier = await getUserTier(userId); // Get the user's tier


    // Check if the material is already in the cart
    const isInCart = shoppingCart.some(material => material.id === selectedMaterial.id);

    // Check if the material is already purchased
    const userDoc = await getDoc(doc(db, "users", userId));
    const purchasedMaterials = userDoc.data().restricted.purchased; // Assuming this is a map of purchased material IDs
    const isPurchased = purchasedMaterials[selectedMaterial.id] !== undefined;

    // Check tier eligibility
    if (selectedMaterial.materialInfo.tier > userTier) {
        showTierNotification();
        return; // If tier is not sufficient, do not add to cart
    }

    if (isPurchased) {
        showPurchasedNotification();
        return; // If already purchased, do not add to cart
    }

    if (isInCart) {
        // Show notification for existing item
        showExistsNotification();
        return;  // Do nothing if it's already in the cart
    }

    // Add the selected material to the shopping cart array
    shoppingCart.push(selectedMaterial);

    console.log(shoppingCart);

    // Show notification for added item
    showAddedNotification();

    // Update the shopping cart UI
    updateShoppingCartUI();
};

// Function to update the shopping cart overlay
const updateShoppingCartUI = () => {
    const cartList = document.getElementById('cart-items');  // Ensure this matches your HTML
    cartList.innerHTML = '';  // Clear the existing list

    // Check if shopping cart is empty
    if (shoppingCart.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="6">Your shopping cart is empty. Come back once you have selected materials for purchase.</td>
        `;
        cartList.appendChild(emptyRow);
    } else {
        let totalCost = 0;  // Initialize total cost variable

        shoppingCart.forEach(material => {
            const cartItem = document.createElement('tr');
            cartItem.setAttribute('id', `cart-item-${material.id}`);

            // Ensure the price is treated as a number
            const price = parseFloat(material.materialInfo.price) || 0; // Fallback to 0 if price is not valid
            totalCost += price;  // Increment total cost

            cartItem.innerHTML = `
                <td>
                    <img src="${material.materialInfo.icon ? `./assets/icons/${material.materialInfo.icon}-icon.png` : ''}" alt="" width="30" height="30">
                </td>
                <td>${material.materialInfo.name}</td>
                <td>${material.materialInfo.version}</td>
                <td>${material.materialInfo.tier}</td>
                <td>$${price.toFixed(2)}</td>
                <td style="text-align: center;">
                    <button class="remove-shopping-cart-btn" data-id="${material.id}">X</button>
                </td>
            `;
            // Append the material item to the cart list
            cartList.appendChild(cartItem);
        });

        // Add a summary row for total cost
        const totalRow = document.createElement('tr');
        totalRow.innerHTML = `
            <td colspan="4" style="text-align: right;"><strong>Total Cost:</strong></td>
            <td>$${totalCost.toFixed(2)}</td>
            <td></td> <!-- Empty cell for the action button -->
        `;
        cartList.appendChild(totalRow);

        // Add event listeners for removing items
        document.querySelectorAll('.remove-shopping-cart-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const materialId = event.target.getAttribute('data-id');
                removeMaterialFromCart(materialId);
            });
        });
    }
};


// Function to remove a material from the cart
const removeMaterialFromCart = (id) => {
    // Filter out the material to be removed
    shoppingCart = shoppingCart.filter(material => material.id !== id);

    // Update the cart UI after removing
    updateShoppingCartUI();
};


const showAddedNotification = () => {
    const notification = document.getElementById('notification-added');
    notification.style.display = 'block'; // Make the notification visible
    notification.style.opacity = 1; // Set opacity to 1 for fade-in

    // After 2 seconds, start fading out
    setTimeout(() => {
        notification.style.opacity = 0; // Set opacity to 0 for fade-out

        // Hide the notification after the fade-out transition
        setTimeout(() => {
            notification.style.display = 'none'; // Hide it after fading out
        }, 500); // Match this time with the transition duration
    }, 2000); // Display for 2 seconds
};

const showExistsNotification = () => {
    const notification = document.getElementById('notification-exists');
    notification.style.display = 'block'; // Make the notification visible
    notification.style.opacity = 1; // Set opacity to 1 for fade-in

    // After 2 seconds, start fading out
    setTimeout(() => {
        notification.style.opacity = 0; // Set opacity to 0 for fade-out

        // Hide the notification after the fade-out transition
        setTimeout(() => {
            notification.style.display = 'none'; // Hide it after fading out
        }, 500); // Match this time with the transition duration
    }, 2000); // Display for 2 seconds
};

const showTierNotification = () => {
    const notification = document.getElementById('notification-tier');
    notification.style.display = 'block'; // Make the notification visible
    notification.style.opacity = 1; // Set opacity to 1 for fade-in

    // After 2 seconds, start fading out
    setTimeout(() => {
        notification.style.opacity = 0; // Set opacity to 0 for fade-out

        // Hide the notification after the fade-out transition
        setTimeout(() => {
            notification.style.display = 'none'; // Hide it after fading out
        }, 500); // Match this time with the transition duration
    }, 2000); // Display for 2 seconds
};

const showPurchasedNotification = () => {
    const notification = document.getElementById('notification-purchased');
    notification.style.display = 'block'; // Make the notification visible
    notification.style.opacity = 1; // Set opacity to 1 for fade-in

    // After 2 seconds, start fading out
    setTimeout(() => {
        notification.style.opacity = 0; // Set opacity to 0 for fade-out

        // Hide the notification after the fade-out transition
        setTimeout(() => {
            notification.style.display = 'none'; // Hide it after fading out
        }, 500); // Match this time with the transition duration
    }, 2000); // Display for 2 seconds
};


//------------------------------------------------------------
// EXTRACT USER TIER
//------------------------------------------------------------



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

//------------------------------------------------------------
// ABOUT LSIT
//------------------------------------------------------------

// Example material count
const materialCount = 150;  // Replace this with the actual material count when data is available

// Replace 'X materials' with actual count
document.getElementById('materials-link').innerHTML = `${materialCount} materials`;

// Show the materials popup on click
document.getElementById('materials-link').addEventListener('click', function(event) {
    event.preventDefault();  // Prevent default link behavior

    // Show the materials popup
    const materialsPopup = document.getElementById('materials-popup');
    materialsPopup.classList.remove('hidden');
});

// Close the popup when clicking the close button
/* document.getElementById('close-popup').addEventListener('click', function() {
    document.getElementById('materials-popup').classList.add('hidden');
}); */

/* // Close the popup when clicking outside of it
window.addEventListener('click', function(event) {
    const materialsPopup = document.getElementById('materials-popup');
    if (!materialsPopup.classList.contains('hidden') && !materialsPopup.contains(event.target) && event.target !== document.getElementById('materials-link')) {
        materialsPopup.classList.add('hidden');
    }
}); */

//------------------------------------------------------------
// SORT MATERIALS FOR STATISTICS
//------------------------------------------------------------


const sortMaterialsByTierAndType = async () => {
    try {
        // Fetch all materials
        const querySnapshot = await getDocs(dbRef);

        // Tier counters
        let tierCount = {
            free: 0,
            basic: 0,
            standard: 0,
            premium: 0,
            total: 0
        };

        // Material category lists
        let steel = [];
        let aluminium = [];
        let iron = [];
        let specialMetals = [];
        let other = [];

        // Iterate through the documents in materialCollection
        querySnapshot.forEach((doc) => {
            const materialData = doc.data();
            const materialId = doc.id; // Document ID (used as ID)

            // Accessing the materialInfo map
            const materialInfo = materialData.materialInfo || {}; // Default to an empty object if undefined

            // Destructure the required fields from materialInfo with fallback defaults
            const {
                material = "", 
                name = "", 
                version = "", 
                tier = "other" // Default tier if not defined
            } = materialInfo;

            // Log the material data for debugging
            // console.log(`Processing material ID: ${materialId}, Material Info:`, materialInfo);

            // Increment tier count if the tier is defined
            if (tierCount[tier] !== undefined) {
                tierCount[tier]++;
                tierCount.total++; // Increment total materials count
            } else {
                console.warn(`Undefined tier found for material ID: ${materialId}, Tier: ${tier}`);
                return; // Skip to next iteration if tier is not recognized
            }

            // Create material object to store ID, name, and version
            const materialObject = {
                id: materialId,
                name: name,
                version: version
            };

            // Sort materials based on their 'material' type, handling potential issues
            if (material) {
                switch (material.toLowerCase()) {
                    case 'steel':
                        steel.push(materialObject);
                        break;
                    case 'aluminium':
                    case 'aluminum': // In case of US spelling
                        aluminium.push(materialObject);
                        break;
                    case 'iron':
                        iron.push(materialObject);
                        break;
                    case 'special metal':
                        specialMetals.push(materialObject);
                        break;
                    default:
                        other.push(materialObject);
                        break;
                }
            } else {
                console.warn(`Missing material name for document ID: ${materialId}`);
            }
        });

        // Output the tier counts and categorized materials
        return {
            tierCount,
            steel,
            aluminium,
            iron,
            specialMetals,
            other
        };

    } catch (error) {
        console.error("Error fetching materials:", error);
        return null;
    }
};

const updatePlanCounts = (tierCount) => {
    // Update the counts in the HTML
    document.getElementById("free-material-count").innerText = tierCount.free;
    document.getElementById("basic-material-count").innerText = tierCount.basic;
    document.getElementById("standard-material-count").innerText = tierCount.standard;
    document.getElementById("premium-material-count").innerText = tierCount.premium;

    const totalBasicCount = tierCount.free + tierCount.basic;
    const totalStandardCount = totalBasicCount + tierCount.standard;
    const totalPremiumCount = totalStandardCount + tierCount.premium;

    document.getElementById("basic-material-total-count").innerText = totalBasicCount;
    document.getElementById("standard-material-total-count").innerText = totalStandardCount;
    document.getElementById("premium-material-total-count").innerText = totalPremiumCount;
};





// Usage example
sortMaterialsByTierAndType().then((result) => {
    if (result) {
        console.log("Tier counts:", result.tierCount);
/*         console.log("Steel materials:", result.steel);
        console.log("Aluminium materials:", result.aluminium);
        console.log("Iron materials:", result.iron);
        console.log("Special metals:", result.specialMetals);
        console.log("Other materials:", result.other); */
    }
});

const fetchAndDisplayMaterialCounts = async () => {
    const materialsData = await sortMaterialsByTierAndType();
    if (materialsData) {
        updatePlanCounts(materialsData.tierCount);
    }
};

// Call the function when you want to fetch and update the counts
fetchAndDisplayMaterialCounts();
