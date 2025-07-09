// Test script to verify camada creation with automatic cuy creation
const axios = require('axios');

const API_BASE = 'http://localhost:4000/api';

// Mock authentication token (replace with actual token)
const AUTH_TOKEN = 'your_test_token_here';

async function testCamadaCreation() {
  try {
    console.log('🧪 Testing camada creation with automatic cuy creation...');
    
    // First, get existing cuyes to use as parents
    console.log('📋 Getting existing cuyes...');
    const cuyesResponse = await axios.get(`${API_BASE}/cuyes`);
    const cuyes = cuyesResponse.data;
    
    console.log(`Found ${cuyes.length} cuyes`);
    
    // Find a female and male cuy to use as parents
    const hembras = cuyes.filter(cuy => cuy.sexo === 'H' && cuy.estado === 'Activo');
    const machos = cuyes.filter(cuy => cuy.sexo === 'M' && cuy.estado === 'Activo');
    
    console.log(`Available females: ${hembras.length}, Available males: ${machos.length}`);
    
    if (hembras.length === 0 || machos.length === 0) {
      console.log('❌ Need at least one male and one female cuy to test');
      return;
    }
    
    // Get count of cuyes before creating camada
    const countBefore = cuyes.length;
    console.log(`🔢 Total cuyes before creating camada: ${countBefore}`);
    
    // Create test camada
    const testCamada = {
      fechaNacimiento: new Date('2025-07-01').toISOString(),
      numVivos: 3,
      numMuertos: 1,
      padreId: machos[0].id,
      madreId: hembras[0].id
    };
    
    console.log('📝 Creating test camada:', testCamada);
    
    const camadaResponse = await axios.post(`${API_BASE}/reproduccion/camadas`, testCamada, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Camada created successfully:', camadaResponse.data);
    
    // Get updated count of cuyes
    const updatedCuyesResponse = await axios.get(`${API_BASE}/cuyes`);
    const updatedCuyes = updatedCuyesResponse.data;
    const countAfter = updatedCuyes.length;
    
    console.log(`🔢 Total cuyes after creating camada: ${countAfter}`);
    console.log(`🆕 New cuyes created: ${countAfter - countBefore}`);
    
    // Find the newly created crías
    const crias = updatedCuyes.filter(cuy => cuy.estado === 'Cría');
    console.log(`🐹 Found ${crias.length} crías in the system`);
    
    // Show details of the crías
    crias.forEach((cria, index) => {
      console.log(`Cría ${index + 1}:`, {
        id: cria.id,
        estado: cria.estado,
        sexo: cria.sexo,
        peso: cria.peso,
        fechaNacimiento: cria.fechaNacimiento,
        camadaId: cria.camadaId
      });
    });
    
    if (countAfter - countBefore === testCamada.numVivos) {
      console.log('🎉 SUCCESS: The correct number of crías were created!');
    } else {
      console.log('❌ ISSUE: Expected', testCamada.numVivos, 'new cuyes, but got', countAfter - countBefore);
    }
    
  } catch (error) {
    console.error('❌ Error testing camada creation:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testCamadaCreation();
