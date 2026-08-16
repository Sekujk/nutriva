// Fuente: Instituto Nacional de Salud (INS) del Perú — "Tablas Peruanas de Composición
// de Alimentos", 10ma edición (2017). Valores por 100 g de alimento.
// Subconjunto inicial curado a mano; el documento completo tiene más de 1600 alimentos.

const foodsPeru = [
  // Cereales y derivados
  { name: 'Arroz blanco corriente', group: 'Cereales', kcal: 358, protein: 7.8, fat: 0.7, carbs: 77.6, fiber: 0.5 },
  { name: 'Arroz con cáscara', group: 'Cereales', kcal: 332, protein: 5.9, fat: 2.0, carbs: 75.7, fiber: 4.1 },
  { name: 'Avena, hojuela cruda', group: 'Cereales', kcal: 333, protein: 13.3, fat: 4.0, carbs: 72.2, fiber: 10.6 },
  { name: 'Cebada perlada o resbalada cruda', group: 'Cereales', kcal: 277, protein: 5.3, fat: 0.6, carbs: 79.8, fiber: 15.6 },
  { name: 'Fideo tallarín crudo fortificado con hierro', group: 'Cereales', kcal: 305, protein: 9.5, fat: 0.1, carbs: 69.6, fiber: 3.2 },
  { name: 'Maíz amarillo', group: 'Cereales', kcal: 355, protein: 6.7, fat: 4.8, carbs: 73.6, fiber: 1.4 },
  { name: 'Maíz blanco crudo', group: 'Cereales', kcal: 343, protein: 5.9, fat: 4.0, carbs: 76.1, fiber: 1.3 },
  { name: 'Maíz cancha tostada de', group: 'Cereales', kcal: 342, protein: 6.7, fat: 2.7, carbs: 79.8, fiber: 5.2 },
  { name: 'Pan de molde', group: 'Cereales', kcal: 317, protein: 6.8, fat: 2.5, carbs: 69.2, fiber: 2.4 },
  { name: 'Pan francés fortificado con hierro', group: 'Cereales', kcal: 277, protein: 8.4, fat: 0.2, carbs: 62.9, fiber: 2.7 },
  { name: 'Quinua', group: 'Cereales', kcal: 351, protein: 13.6, fat: 5.8, carbs: 66.6, fiber: 5.9 },
  { name: 'Quinua cocida', group: 'Cereales', kcal: 89, protein: 2.8, fat: 1.3, carbs: 16.3, fiber: 0 },
  { name: 'Trigo, harina fortificada con hierro de', group: 'Cereales', kcal: 362, protein: 10.5, fat: 2.0, carbs: 76.3, fiber: 2.7 },

  // Verduras, hortalizas y derivados
  { name: 'Ajo sin cáscara', group: 'Verduras', kcal: 121, protein: 5.6, fat: 0.8, carbs: 30.4, fiber: 2.1 },
  { name: 'Alcachofa', group: 'Verduras', kcal: 24, protein: 2.2, fat: 0.1, carbs: 18.9, fiber: 14.0 },
  { name: 'Apio, tallo sin hojas', group: 'Verduras', kcal: 8, protein: 1.0, fat: 0.2, carbs: 3.8, fiber: 2.8 },
  { name: 'Berenjena', group: 'Verduras', kcal: 12, protein: 1.0, fat: 0.1, carbs: 5.9, fiber: 3.6 },
  { name: 'Brócoli', group: 'Verduras', kcal: 32, protein: 3.9, fat: 1.3, carbs: 4.0, fiber: 0.7 },
  { name: 'Cebolla de cabeza', group: 'Verduras', kcal: 40, protein: 1.4, fat: 0.2, carbs: 11.3, fiber: 1.4 },
  { name: 'Col, hojas de', group: 'Verduras', kcal: 32, protein: 2.7, fat: 0.6, carbs: 7.6, fiber: 2.0 },
  { name: 'Coliflor sin tallo y sin hojas', group: 'Verduras', kcal: 17, protein: 2.2, fat: 0.6, carbs: 4.4, fiber: 2.5 },
  { name: 'Espárragos', group: 'Verduras', kcal: 15, protein: 2.2, fat: 0.3, carbs: 3.8, fiber: 1.7 },
  { name: 'Espinaca negra sin tronco', group: 'Verduras', kcal: 24, protein: 2.8, fat: 0.9, carbs: 4.9, fiber: 2.2 },
  { name: 'Lechuga americana', group: 'Verduras', kcal: 7, protein: 0.6, fat: 0.1, carbs: 2.4, fiber: 1.2 },
  { name: 'Pimiento rojo', group: 'Verduras', kcal: 27, protein: 1.2, fat: 1.3, carbs: 4.6, fiber: 0.9 },
  { name: 'Tomate redondo, con cáscara', group: 'Verduras', kcal: 18, protein: 0.7, fat: 0.3, carbs: 4.7, fiber: 0.7 },
  { name: 'Zapallo criollo', group: 'Verduras', kcal: 28, protein: 0.6, fat: 0.2, carbs: 7.6, fiber: 0.5 },

  // Frutas y derivados
  { name: 'Fresa', group: 'Frutas', kcal: 34, protein: 0.7, fat: 0.8, carbs: 8.9, fiber: 2.0 },
  { name: 'Granadilla', group: 'Frutas', kcal: 51, protein: 2.5, fat: 2.7, carbs: 11.4, fiber: 5.8 },
  { name: 'Guanábana', group: 'Frutas', kcal: 44, protein: 0.9, fat: 0.2, carbs: 14.3, fiber: 3.3 },
  { name: 'Mandarina', group: 'Frutas', kcal: 29, protein: 0.6, fat: 0.3, carbs: 8.6, fiber: 1.8 },
  { name: 'Mango', group: 'Frutas', kcal: 54, protein: 0.4, fat: 0.2, carbs: 15.9, fiber: 1.8 },
  { name: 'Manzana nacional', group: 'Frutas', kcal: 50, protein: 0.1, fat: 0.1, carbs: 14.6, fiber: 1.3 },
  { name: 'Naranja de Guayaquil', group: 'Frutas', kcal: 31, protein: 0.5, fat: 0.2, carbs: 10.2, fiber: 2.4 },
  { name: 'Palta', group: 'Frutas', kcal: 130, protein: 1.7, fat: 12.5, carbs: 5.6, fiber: 0 },
  { name: 'Papaya', group: 'Frutas', kcal: 25, protein: 0.4, fat: 0.1, carbs: 8.2, fiber: 1.8 },
  { name: 'Piña', group: 'Frutas', kcal: 33, protein: 0.4, fat: 0.2, carbs: 9.8, fiber: 1.4 },
  { name: 'Plátano de isla', group: 'Frutas', kcal: 75, protein: 1.2, fat: 0.1, carbs: 21.6, fiber: 2.2 },
  { name: 'Plátano maduro', group: 'Frutas', kcal: 103, protein: 1.2, fat: 0.2, carbs: 29.6, fiber: 2.6 },
  { name: 'Sandía', group: 'Frutas', kcal: 23, protein: 0.7, fat: 0.1, carbs: 5.9, fiber: 0.4 },
  { name: 'Uva negra', group: 'Frutas', kcal: 63, protein: 0.2, fat: 0.1, carbs: 18.1, fiber: 0.9 },

  // Pescados y mariscos
  { name: 'Pescado anchoveta', group: 'Pescados', kcal: 156, protein: 19.1, fat: 8.2, carbs: 0, fiber: 0 },
  { name: 'Pescado atún, fresco', group: 'Pescados', kcal: 141, protein: 23.3, fat: 4.6, carbs: 0, fiber: 0 },
  { name: 'Pescado bonito, fresco', group: 'Pescados', kcal: 138, protein: 23.4, fat: 4.2, carbs: 0, fiber: 0 },
  { name: 'Pescado caballa, fresco', group: 'Pescados', kcal: 127, protein: 19.5, fat: 4.9, carbs: 0, fiber: 0 },
  { name: 'Pescado congrio', group: 'Pescados', kcal: 73, protein: 15.7, fat: 0.7, carbs: 0, fiber: 0 },
  { name: 'Pescado corvina', group: 'Pescados', kcal: 124, protein: 19.5, fat: 4.5, carbs: 0, fiber: 0.0 },
  { name: 'Pescado jurel, fresco', group: 'Pescados', kcal: 120, protein: 19.7, fat: 4.0, carbs: 0, fiber: 0 },
  { name: 'Pescado lenguado', group: 'Pescados', kcal: 91, protein: 18.8, fat: 1.2, carbs: 0, fiber: 0.0 },
  { name: 'Pescado merluza, fresco', group: 'Pescados', kcal: 72, protein: 15.8, fat: 0.5, carbs: 0, fiber: 0 },
  { name: 'Pescado tilapia, cruda', group: 'Pescados', kcal: 96, protein: 20.1, fat: 1.7, carbs: 0, fiber: 0.0 },
  { name: 'Pescado trucha, fresca', group: 'Pescados', kcal: 111, protein: 19.5, fat: 3.1, carbs: 0, fiber: 0 },
  { name: 'Pulpo', group: 'Pescados', kcal: 80, protein: 13.6, fat: 1.4, carbs: 2.2, fiber: 0 },

  // Carnes y derivados
  { name: 'Pollo, carne pulpa de', group: 'Carnes', kcal: 119, protein: 21.4, fat: 3.1, carbs: 0, fiber: 0 },
  { name: 'Pollo, pierna de (sin piel)', group: 'Carnes', kcal: 120, protein: 20.6, fat: 3.6, carbs: 0, fiber: 0 },
  { name: 'Gallina, pechuga de (sin piel)', group: 'Carnes', kcal: 108, protein: 19.2, fat: 2.9, carbs: 0, fiber: 0 },
  { name: 'Pavo, carne pulpa', group: 'Carnes', kcal: 160, protein: 20.4, fat: 8.0, carbs: 0, fiber: 0 },
  { name: 'Res, carne pulpa de', group: 'Carnes', kcal: 105, protein: 21.3, fat: 1.6, carbs: 0, fiber: 0.0 },
  { name: 'Cerdo, carne magra, cruda', group: 'Carnes', kcal: 143, protein: 21.4, fat: 5.7, carbs: 0, fiber: 0.0 },
  { name: 'Conejo, carne pulpa de', group: 'Carnes', kcal: 136, protein: 20.1, fat: 5.6, carbs: 0, fiber: 0 },

  // Leche y derivados
  { name: 'Leche fresca de vaca', group: 'Lácteos', kcal: 63, protein: 3.1, fat: 3.5, carbs: 4.9, fiber: 0 },
  { name: 'Leche evaporada entera', group: 'Lácteos', kcal: 133, protein: 6.3, fat: 7.7, carbs: 10.9, fiber: 0 },
  { name: 'Leche en polvo entera', group: 'Lácteos', kcal: 484, protein: 27.0, fat: 26.1, carbs: 36.1, fiber: 0 },
  { name: 'Queso fresco de vaca', group: 'Lácteos', kcal: 264, protein: 17.5, fat: 20.1, carbs: 3.3, fiber: 0 },
  { name: 'Queso mantecoso', group: 'Lácteos', kcal: 396, protein: 33.5, fat: 30.0, carbs: 3.3, fiber: 0 },
  { name: 'Yogurt natural de leche descremada', group: 'Lácteos', kcal: 56, protein: 5.7, fat: 0.2, carbs: 7.7, fiber: 0 },

  // Huevos
  { name: 'Huevo de gallina entero, crudo', group: 'Huevos', kcal: 156, protein: 12.7, fat: 11.1, carbs: 0, fiber: 0 },
  { name: 'Huevo de gallina, clara de', group: 'Huevos', kcal: 51, protein: 10.9, fat: 0.2, carbs: 0.7, fiber: 0 },
  { name: 'Huevo de gallina, yema de', group: 'Huevos', kcal: 354, protein: 15.6, fat: 30.9, carbs: 1.9, fiber: 0 },
  { name: 'Huevo de codorniz, entero crudo', group: 'Huevos', kcal: 140, protein: 12.6, fat: 9.4, carbs: 0, fiber: 0 },

  // Leguminosas y derivados
  { name: 'Frejol canario cocido', group: 'Leguminosas', kcal: 43, protein: 5.2, fat: 0.5, carbs: 15.5, fiber: 10.4 },
  { name: 'Frejol negro', group: 'Leguminosas', kcal: 270, protein: 18.2, fat: 1.3, carbs: 63.4, fiber: 15.2 },
  { name: 'Frejol soya', group: 'Leguminosas', kcal: 369, protein: 33.7, fat: 18.7, carbs: 32.7, fiber: 9.3 },
  { name: 'Garbanzo', group: 'Leguminosas', kcal: 293, protein: 17.6, fat: 5.4, carbs: 63.3, fiber: 17.4 },
  { name: 'Garbanzo, cocido', group: 'Leguminosas', kcal: 127, protein: 6.9, fat: 2.5, carbs: 27.8, fiber: 7.6 },
  { name: 'Lentejas chicas', group: 'Leguminosas', kcal: 211, protein: 22.6, fat: 1.0, carbs: 61.0, fiber: 30.5 },
  { name: 'Pallar seco', group: 'Leguminosas', kcal: 253, protein: 20.4, fat: 1.2, carbs: 61.4, fiber: 19.0 },
  { name: 'Habas secas sin cáscara', group: 'Leguminosas', kcal: 233, protein: 25.9, fat: 2.4, carbs: 55.3, fiber: 25.0 },

  // Tubérculos, raíces y derivados
  { name: 'Camote amarillo sin cáscara', group: 'Tubérculos', kcal: 95, protein: 2.0, fat: 0.0, carbs: 23.4, fiber: 2.9 },
  { name: 'Papa amarilla sin cáscara', group: 'Tubérculos', kcal: 101, protein: 2.0, fat: 0.4, carbs: 23.3, fiber: 0.4 },
  { name: 'Papa blanca', group: 'Tubérculos', kcal: 87, protein: 2.1, fat: 0.1, carbs: 22.3, fiber: 2.4 },
  { name: 'Yuca amarilla fresca sin cáscara', group: 'Tubérculos', kcal: 147, protein: 0.6, fat: 0.2, carbs: 39.1, fiber: 1.8 },
  { name: 'Olluco sin cáscara', group: 'Tubérculos', kcal: 59, protein: 1.1, fat: 0.1, carbs: 14.3, fiber: 0 },
  { name: 'Maca (tubérculo seco)', group: 'Tubérculos', kcal: 301, protein: 11.8, fat: 1.6, carbs: 66.3, fiber: 0 },

  // Productos azucarados
  { name: 'Azúcar granulada o refinada', group: 'Azúcares', kcal: 384, protein: 0.0, fat: 0.0, carbs: 99.2, fiber: 0 },
  { name: 'Miel de abeja', group: 'Azúcares', kcal: 330, protein: 0.0, fat: 0.0, carbs: 85.6, fiber: 0.2 },
];

export default foodsPeru;
