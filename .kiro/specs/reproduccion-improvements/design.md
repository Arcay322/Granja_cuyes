# Design Document

## Overview

The Reproduction module improvements will enhance the breeding management system by providing detailed animal information, preventing breeding conflicts, validating gestation periods, and offering advanced selection interfaces with performance tracking.

## Architecture

### Frontend Components
- **Enhanced Selection Dialogs** - Detailed animal cards with comprehensive information
- **Breeding Compatibility System** - Recommendations and compatibility scoring
- **Gestation Validation** - Real-time validation of breeding timelines
- **Performance Analytics** - Reproductive metrics and trends visualization

### Backend Services
- **Breeding Eligibility Service** - Logic to determine available mothers and fathers
- **Gestation Validation Service** - Pregnancy timeline validation
- **Reproductive Performance Service** - Analytics and performance tracking
- **Breeding Recommendation Engine** - Compatibility and outcome predictions

### Database Enhancements
- **Reproductive History Tracking** - Extended pregnancy and litter records
- **Performance Metrics** - Calculated breeding statistics
- **Availability Status** - Real-time breeding availability tracking

## Components and Interfaces

### Enhanced Animal Selection

#### Mother Selection Interface
```typescript
interface MotherSelectionData {
  id: number;
  raza: string;
  sexo: string;
  galpon: string;
  jaula: string;
  etapaVida: string;
  peso: number;
  fechaNacimiento: string;
  edad: number;
  estadoReproductivo: 'Disponible' | 'Preñada' | 'Lactando' | 'Descanso';
  historialReproductivo: {
    totalPreneces: number;
    prenecesExitosas: number;
    promedioLitada: number;
    ultimaPrenez?: string;
    intervalosReproductivos: number[];
  };
  salud: {
    ultimaEvaluacion?: string;
    estado: string;
    vacunas: boolean;
  };
  compatibilidad?: {
    score: number;
    recomendaciones: string[];
  };
}
```

#### Father Selection Interface
```typescript
interface FatherSelectionData {
  id: number;
  raza: string;
  sexo: string;
  galpon: string;
  jaula: string;
  etapaVida: string;
  peso: number;
  fechaNacimiento: string;
  edad: number;
  estadoReproductivo: 'Disponible' | 'Activo' | 'Descanso';
  rendimientoReproductivo: {
    totalCruces: number;
    tasaExito: number;
    promedioDescendencia: number;
    ultimoCruce?: string;
    frecuenciaCruce: number;
  };
  genetica: {
    linaje: string;
    caracteristicas: string[];
    diversidadGenetica: number;
  };
  compatibilidad?: {
    score: number;
    predicciones: string[];
  };
}
```

### Breeding Eligibility Logic

#### Mother Availability Rules
1. **Basic Eligibility**
   - Sex: Female (H)
   - Life Stage: Reproductora, Adulta
   - Health Status: Activo
   - Age: 3+ months, <24 months for optimal breeding

2. **Reproductive Status**
   - Not currently pregnant (no active prenez)
   - Not in lactation period (<45 days since last litter)
   - Minimum rest period between pregnancies (30+ days)
   - Maximum breeding frequency (not more than 3 pregnancies per year)

3. **Health Requirements**
   - Recent health evaluation (<90 days)
   - No active health issues
   - Appropriate weight range for breeding

#### Father Availability Rules
1. **Basic Eligibility**
   - Sex: Male (M)
   - Life Stage: Reproductor, Adulto
   - Health Status: Activo
   - Age: 4+ months, <36 months for optimal breeding

2. **Breeding Capacity**
   - Not overused (maximum 2 breeding per week)
   - Adequate rest between breeding sessions
   - Good reproductive performance history

3. **Genetic Diversity**
   - Not closely related to selected mother
   - Contributes to genetic diversity
   - Compatible breeding characteristics

### Gestation Validation System

#### Pregnancy Timeline Validation
```typescript
interface GestationValidation {
  madreId: number;
  fechaPrenez: string;
  fechaRegistroCamada: string;
  diasGestacion: number;
  validacion: {
    esValido: boolean;
    tipo: 'Normal' | 'Prematuro' | 'Tardio' | 'Critico';
    mensaje: string;
    recomendaciones: string[];
  };
  rangosNormales: {
    minimo: 59; // días
    optimo: 68; // días
    maximo: 75; // días
    critico: 80; // días
  };
}
```

#### Validation Rules
1. **Minimum Gestation**: 59 days (prevent premature registration)
2. **Optimal Range**: 65-72 days (normal gestation)
3. **Extended Gestation**: 73-79 days (warning but allowed)
4. **Critical Overdue**: 80+ days (requires veterinary attention)

### Performance Analytics

#### Reproductive Metrics
1. **Mother Performance**
   - Pregnancy success rate
   - Average litter size
   - Offspring survival rate
   - Breeding interval consistency
   - Lifetime productivity

2. **Father Performance**
   - Breeding frequency
   - Offspring count
   - Genetic contribution
   - Breeding success rate
   - Lineage quality

3. **Breeding Pair Analysis**
   - Compatibility scoring
   - Predicted outcomes
   - Historical performance
   - Genetic diversity impact

## User Experience Enhancements

### Enhanced Selection Dialogs
- **Card-based Interface**: Visual cards showing animal photos and key stats
- **Search and Filter**: Real-time search by ID, race, location, or characteristics
- **Sorting Options**: Sort by performance, age, availability, compatibility
- **Detailed Information**: Expandable cards with complete breeding history

### Breeding Recommendations
- **Compatibility Scoring**: Algorithm-based compatibility between breeding pairs
- **Outcome Predictions**: Expected litter size, survival rate, characteristics
- **Genetic Diversity**: Recommendations to maintain healthy genetic diversity
- **Performance Optimization**: Suggestions based on historical breeding data

### Validation Feedback
- **Real-time Validation**: Immediate feedback on breeding eligibility
- **Clear Error Messages**: Specific reasons why animals are unavailable
- **Gestation Warnings**: Visual indicators for gestation timeline issues
- **Breeding Recommendations**: Suggested alternatives when selections are invalid

## Error Handling

### Breeding Conflicts
- Prevent double-booking of breeding animals
- Handle concurrent breeding requests
- Validate breeding capacity limits
- Manage breeding schedule conflicts

### Data Validation
- Comprehensive input validation for all breeding data
- Cross-reference validation between related records
- Temporal validation for breeding timelines
- Biological constraint validation

### User Feedback
- Clear, actionable error messages
- Visual indicators for validation status
- Progressive disclosure of detailed information
- Contextual help and recommendations

## Testing Strategy

### Validation Testing
1. **Breeding Eligibility**: Test all eligibility rules and edge cases
2. **Gestation Validation**: Verify timeline calculations and validations
3. **Performance Metrics**: Validate calculation accuracy
4. **User Interface**: Test selection, search, and filtering functionality

### Integration Testing
1. **Frontend-Backend**: Verify data flow and API integration
2. **Database Consistency**: Ensure data integrity across breeding operations
3. **Real-time Updates**: Test live updates of availability status
4. **Performance**: Validate system performance with large datasets