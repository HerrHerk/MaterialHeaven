const fs = require('fs');

// Load your original JSON file
const data = require('./firestoreData.json');

// Define the categories and their associated properties
const categories = {
  materialInfo: ['name', 'material', 'version', 'tier', 'price', 'icon', 'description'],
  materialModels: {
    isotropicElasticity: ['e_modulus', 'poisson', 'shear_modulus', 'bulk_modulus'],
    johnsonCookStrength: ['initial_yield_strength', 'hardening_constant', 'hardening_exponent', 'strain_rate_constant', 'thermal_softening_exp', 'melting_temperature', 'reference_strain_rate'],
    johnsonCookFailure: ['initial_failure_strain', 'exponential_factor', 'triaxial_factor', 'strain_rate_factor', 'temperature_factor', 'reference_strain_rate_alt'],
    physicalProperties: ['density', 'specific_heat', 'hardness'],
    shockEOS: ['grueneisen_coefficient', 'parameter_s1', 'parameter_c1', 'parameter_quadratic']
  },
  additionalInfo: ['source', 'reference']
};

// Default value for missing properties
const defaultValue = null;

// Function to restructure a single material
function restructureMaterial(material) {
  const restructured = {
    materialInfo: {},
    materialModels: {
      isotropicElasticity: {},
      johnsonCookStrength: {},
      johnsonCookFailure: {},
      physicalProperties: {},
      shockEOS: {}
    },
    additionalInfo: {}
  };

  // Initialize materialInfo with default values
  categories.materialInfo.forEach(prop => {
    restructured.materialInfo[prop] = material[prop] !== undefined ? material[prop] : defaultValue;
  });

  // Initialize materialModels categories with default values
  Object.keys(categories.materialModels).forEach(modelCategory => {
    categories.materialModels[modelCategory].forEach(prop => {
      restructured.materialModels[modelCategory][prop] = material[prop] !== undefined ? material[prop] : defaultValue;
    });
  });

  // Initialize additionalInfo with default values
  categories.additionalInfo.forEach(prop => {
    restructured.additionalInfo[prop] = material[prop] !== undefined ? material[prop] : defaultValue;
  });

  return restructured;
}

// Process each material in the original JSON file
const restructuredData = {};
for (const id in data) {
  restructuredData[id] = restructureMaterial(data[id]);
}

// Write the restructured data to a new JSON file
fs.writeFileSync('restructuredFirestoreData.json', JSON.stringify(restructuredData, null, 2));

console.log('Restructured data has been saved to restructuredFirestoreData.json');
