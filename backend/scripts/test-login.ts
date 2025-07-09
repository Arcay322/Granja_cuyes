import axios from 'axios';

async function testLogin() {
  try {
    console.log('🔍 Probando login con credenciales existentes...');
    
    // Intentar login con las cuentas existentes
    const cuentas = [
      { email: 'admin@cuyesgpt.com', password: 'admin123' },
      { email: 'arcay325@gmail.com', password: 'password123' },
      { email: '99866114a@gmail.com', password: 'password123' }
    ];
    
    for (const cuenta of cuentas) {
      try {
        console.log(`\nIntentando login con: ${cuenta.email}`);
        
        const response = await axios.post('http://localhost:4000/api/auth/login', {
          email: cuenta.email,
          password: cuenta.password
        });
        
        console.log('✅ Login exitoso!');
        const token = (response.data as any).token;
        console.log('Token:', token.substring(0, 50) + '...');
        
        // Probar acceso a cuyes con el token
        const cuyesResponse = await axios.get('http://localhost:4000/api/cuyes', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('✅ Acceso a cuyes exitoso!');
        const cuyes = cuyesResponse.data as any[];
        console.log(`Total de cuyes: ${cuyes.length}`);
        
        if (cuyes.length > 0) {
          console.log('Primer cuy:', {
            id: cuyes[0].id,
            raza: cuyes[0].raza,
            proposito: cuyes[0].proposito
          });
        }
        
        return; // Salir si encontramos una cuenta que funciona
        
      } catch (error: any) {
        if (error.response) {
          console.log(`❌ Error ${error.response.status}: ${error.response.data.message || 'Error desconocido'}`);
        } else {
          console.log('❌ Error de conexión:', error.message);
        }
      }
    }
    
    console.log('\n❌ No se pudo hacer login con ninguna cuenta. Probablemente las contraseñas no coinciden.');
    console.log('💡 Sugerencia: Ve al frontend http://localhost:5174 y usa la página de registro para crear una nueva cuenta.');
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

testLogin();
