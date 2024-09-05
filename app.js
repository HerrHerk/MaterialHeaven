//------------------------------------------------------------
// IMPORTS
//------------------------------------------------------------


import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js"
const db = getFirestore();
const dbRef = collection(db, "materialCollection");

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
        
        //const docSnap = await getDocs(dbRef);

        await onSnapshot(dbRef, docsSnap => {

            materials = [];

            docsSnap.forEach(doc => {
            
                const material = doc.data();
                material.id = doc.id;
                materials.push(material);
                
                // console.log(doc.data());         EVERYTHING IS FETCHED
                // console.log(doc.data().material);   ONLY material IS FETCHED
                // console.log(doc.id);             ONLY ID IS FETCHED
            })
    
            showMaterials(materials);
        });

    } catch(err) {
        console.log("getmaterials =" + err);
    }

}

getmaterials();

//------------------------------------------------------------
// SHOW material AS LIST ITEM ON THE LEFT
//------------------------------------------------------------

const showMaterials = (materials) => {
    // Clear all material lists first
    const materialLists = {
        steel: document.getElementById("material-list-steel"),
        aluminium: document.getElementById("material-list-aluminium"),
        iron: document.getElementById("material-list-iron"),
        specialMetal: document.getElementById("material-list-special-metal"),
        other: document.getElementById("material-list-other")
    };
    
    console.log(materialLists.steel, materialLists.aluminium, materialLists.iron, materialLists.specialMetal, materialLists.other);
    
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
            li.id = material.id;
            li.innerHTML = `
                <div class="content">
                    <div class="subtitle">
                        ${material.materialInfo.version}
                    </div>
                </div>
            `;
            list.appendChild(li);
        });

        container.appendChild(header);
        container.appendChild(list);

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

};


//------------------------------------------------------------
// CLICK material LIST ITEM
//------------------------------------------------------------





const materialListPressed = (event) => {
    const id = event.target.closest("li").getAttribute("id");

    // Log the clicked element and its parent classes for better debugging
    console.log("Clicked element:", event.target);
    console.log("Clicked element's class:", event.target.className);
    console.log("Parent button class (if any):", event.target.closest('button')?.className);
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
        } else if (buttonClass.includes("download-btn")) {
            console.log("Download button function called.");
            downloadButtonPressed(id);
        }

        return; // Exit the function to prevent card collapse/expansion
    }

    // Handle card expansion/collapse when non-button area is clicked
    console.log("No button pressed, handling card expansion/collapse.");
    const cardExpanded = moveCardToNextRow(id);
    if (!cardExpanded) {
        console.log("Card collapsed, hiding buttons.");
        hideButtonsOnCollapse(id); // Hide buttons when card is collapsed
    } else {
        console.log("Card expanded, displaying material details.");
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
    var materialName = `${material.name} (${material.version})`;
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
};

const displayButtonsOnDetailView = (id) => {
    const material = getmaterial(id);
    const listItem = document.getElementById(id);

    if (listItem) {
        // Hide buttons on all other list items
        hideOtherButtonsOnDetailView(id);

        const buttonsDiv = document.createElement("div");
        buttonsDiv.className = "action";
        buttonsDiv.innerHTML = `
            <button class="edit-user">
                <img src="./assets/icons/edit-icon.png" alt="edit icon" width="20" height="20">
            </button>
            <button class="delete-user">
                <img src="./assets/icons/delete-icon.png" alt="delete icon" width="20" height="20">
            </button>
            <button class="download-btn">
                <img src="./assets/icons/download-icon.png" alt="download icon" width="20" height="20"> 
            </button>
        `;

        // Clear any previous buttons on this item to avoid duplication
        const existingActionDiv = listItem.querySelector('.action');
        if (existingActionDiv) {
            existingActionDiv.remove();
        }

        // Append the new buttons div to the list item
        listItem.appendChild(buttonsDiv);
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

   
    // Assign extracted values to corresponding variables from Johnson Cook Strength subcollection
    var aJCS = parseFloat(material.materialModels.johnsonCookStrength.initial_yield_strength);
    var bJCS = parseFloat(material.materialModels.johnsonCookStrength.hardening_constant);
    var nJCS = parseFloat(material.materialModels.johnsonCookStrength.hardening_exponent);
    var cJCS = parseFloat(material.materialModels.johnsonCookStrength.strain_rate_constant);
    var eJCS = parseFloat(material.materialModels.johnsonCookStrength.reference_strain_rate);


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

    // Assign extracted values to corresponding variables from Johnson Cook Failure subcollection
    var d1JCF = parseFloat(material.materialModels.johnsonCookFailure.initial_failure_strain);
    var d2JCF = parseFloat(material.materialModels.johnsonCookFailure.exponential_factor);
    var d3JCF = parseFloat(material.materialModels.johnsonCookFailure.triaxial_factor);
    var d4JCF = parseFloat(material.materialModels.johnsonCookFailure.strain_rate_factor);
    var eJCF = parseFloat(material.materialModels.johnsonCookStrength.reference_strain_rate);

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

const addBtn = document.querySelector(".add-btn");
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