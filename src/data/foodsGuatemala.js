// Fuente: INCAP (Instituto de Nutrición de Centro América y Panamá) — "Tabla de
// Composición de Alimentos de Centroamérica", 2da edición (2007, reimpresión 2012).
// Valores por 100 g de porción comestible. Subconjunto curado a mano.
//
// Nota sobre vigencia: INCAP publicó una 3ra edición en 2018 (25 grupos, 2657
// alimentos), que es la más actual. A diferencia de la tabla peruana, esa edición no
// tiene una versión digital gratuita públicamente disponible (se vende impresa a
// través de INCAP) y no pudo verificarse valor por valor contra el documento oficial,
// así que estos datos siguen basados en la 2da edición, que sí es de acceso libre.
// Si consigues el PDF de la 3ra edición, se puede actualizar esta tabla contra esa
// fuente.

const foodsGuatemala = [
  // Cereales, panes y tortillas
  { name: 'Tortilla de maíz blanco, c/cal', group: 'Cereales', kcal: 204, protein: 5.4, fat: 1.0, carbs: 44.9, fiber: 4.47 },
  { name: 'Tortilla de maíz amarillo, c/cal', group: 'Cereales', kcal: 206, protein: 5.6, fat: 1.3, carbs: 44.5, fiber: 4.5 },
  { name: 'Tamalito de maíz, simple (Guatemala)', group: 'Cereales', kcal: 135, protein: 3.16, fat: 1.27, carbs: 28.69, fiber: 0.52 },
  { name: 'Pan francés de Guatemala', group: 'Cereales', kcal: 311, protein: 9.4, fat: 4.3, carbs: 58.5, fiber: 1.1 },
  { name: 'Pan dulce de Guatemala', group: 'Cereales', kcal: 377, protein: 6.9, fat: 9.8, carbs: 65.4, fiber: 1.3 },
  { name: 'Harina de maíz nixtamalizado, masa seca', group: 'Cereales', kcal: 365, protein: 9.34, fat: 3.78, carbs: 76.27, fiber: 9.6 },
  { name: 'Maíz amarillo, grano entero crudo', group: 'Cereales', kcal: 365, protein: 9.42, fat: 4.74, carbs: 74.26, fiber: 7.3 },
  { name: 'Harina de trigo enriquecida, para pan', group: 'Cereales', kcal: 361, protein: 11.98, fat: 1.66, carbs: 72.53, fiber: 2.4 },
  { name: 'Elote/maíz fresco, amarillo dulce, crudo', group: 'Cereales', kcal: 86, protein: 3.22, fat: 1.18, carbs: 19.02, fiber: 2.7 },
  { name: 'Pasta enriquecida, cruda', group: 'Cereales', kcal: 371, protein: 13.04, fat: 1.51, carbs: 74.67, fiber: 3.2 },

  // Verduras y hortalizas
  { name: 'Aguacate', group: 'Verduras', kcal: 160, protein: 2.0, fat: 14.66, carbs: 8.53, fiber: 6.70 },
  { name: 'Ajo, cabeza o bulbo', group: 'Verduras', kcal: 134, protein: 5.30, fat: 0.20, carbs: 29.30, fiber: 1.40 },
  { name: 'Brócoli/brécol crudo', group: 'Verduras', kcal: 34, protein: 2.82, fat: 0.37, carbs: 6.64, fiber: 2.60 },
  { name: 'Cebolla, cabeza', group: 'Verduras', kcal: 45, protein: 1.40, fat: 0.20, carbs: 9.70, fiber: 0.60 },
  { name: 'Chile dulce/pimiento rojo, fresco', group: 'Verduras', kcal: 26, protein: 0.93, fat: 0.30, carbs: 6.03, fiber: 2.00 },
  { name: 'Chile jalapeño, fresco', group: 'Verduras', kcal: 23, protein: 1.20, fat: 0.10, carbs: 5.30, fiber: 0 },
  { name: 'Cilantro/culantro', group: 'Verduras', kcal: 42, protein: 3.30, fat: 0.70, carbs: 8.00, fiber: 2.80 },
  { name: 'Coliflor cruda', group: 'Verduras', kcal: 25, protein: 1.98, fat: 0.10, carbs: 5.30, fiber: 2.50 },
  { name: 'Elote/maíz fresco, amarillo', group: 'Verduras', kcal: 161, protein: 3.60, fat: 1.40, carbs: 33.50, fiber: 0 },
  { name: 'Espinaca cruda', group: 'Verduras', kcal: 23, protein: 2.97, fat: 0.26, carbs: 3.63, fiber: 1.72 },
  { name: 'Camote/batata anaranjado, crudo', group: 'Verduras', kcal: 86, protein: 1.57, fat: 0.05, carbs: 20.12, fiber: 3.00 },

  // Frutas
  { name: 'Banano/guineo maduro', group: 'Frutas', kcal: 85, protein: 0.60, fat: 1.10, carbs: 20.50, fiber: 0 },
  { name: 'Durazno común, maduro c/cáscara', group: 'Frutas', kcal: 52, protein: 0.80, fat: 0.20, carbs: 13.30, fiber: 1.50 },
  { name: 'Fresa/frutilla', group: 'Frutas', kcal: 32, protein: 0.67, fat: 0.30, carbs: 7.68, fiber: 2.00 },
  { name: 'Guayaba madura', group: 'Frutas', kcal: 51, protein: 0.80, fat: 0.60, carbs: 11.90, fiber: 0 },
  { name: 'Kiwi, fruta fresca', group: 'Frutas', kcal: 61, protein: 1.14, fat: 0.52, carbs: 14.66, fiber: 3.00 },
  { name: 'Limón agrio, fruta sin piel', group: 'Frutas', kcal: 30, protein: 0.60, fat: 0.30, carbs: 9.28, fiber: 2.60 },
  { name: 'Mandarina/tangerina, fruta', group: 'Frutas', kcal: 53, protein: 0.81, fat: 0.31, carbs: 13.34, fiber: 1.80 },
  { name: 'Mango maduro', group: 'Frutas', kcal: 59, protein: 0.50, fat: 0.20, carbs: 15.40, fiber: 1.80 },
  { name: 'Manzana, fruta criolla, s/cáscara', group: 'Frutas', kcal: 54, protein: 0.30, fat: 0.10, carbs: 14.60, fiber: 1.30 },
  { name: 'Maracuyá/granadilla morada, pulpa', group: 'Frutas', kcal: 97, protein: 2.20, fat: 0.70, carbs: 23.38, fiber: 10.40 },
  { name: 'Naranja dulce, fruta', group: 'Frutas', kcal: 47, protein: 0.94, fat: 0.12, carbs: 11.75, fiber: 2.40 },
  { name: 'Papaya/lechosa madura, pulpa', group: 'Frutas', kcal: 39, protein: 0.61, fat: 0.14, carbs: 9.81, fiber: 1.80 },

  // Carnes y aves
  { name: 'Pollo, pechuga s/piel, cruda', group: 'Carnes', kcal: 119, protein: 21.39, fat: 3.08, carbs: 0, fiber: 0 },
  { name: 'Pollo, pierna c/piel, cruda', group: 'Carnes', kcal: 187, protein: 18.15, fat: 12.12, carbs: 0, fiber: 0 },
  { name: 'Pollo, muslo s/piel, crudo', group: 'Carnes', kcal: 209, protein: 25.94, fat: 10.88, carbs: 0, fiber: 0 },
  { name: 'Res, carne magra, cruda', group: 'Carnes', kcal: 126, protein: 22.03, fat: 3.50, carbs: 0, fiber: 0 },
  { name: 'Res, carne semimagra, cruda', group: 'Carnes', kcal: 234, protein: 18.68, fat: 17.15, carbs: 0, fiber: 0 },
  { name: 'Cerdo, carne magra, cocida', group: 'Carnes', kcal: 209, protein: 28.62, fat: 9.63, carbs: 0, fiber: 0 },
  { name: 'Cordero, carne magra, cruda', group: 'Carnes', kcal: 134, protein: 20.29, fat: 5.25, carbs: 0, fiber: 0 },
  { name: 'Pavo, pechuga s/piel, horneada', group: 'Carnes', kcal: 135, protein: 30.06, fat: 0.74, carbs: 0, fiber: 0 },
  { name: 'Chorizo de cerdo', group: 'Carnes', kcal: 278, protein: 15.80, fat: 22.80, carbs: 1.10, fiber: 0 },

  // Pescados y mariscos
  { name: 'Pescado carne, tilapia, cruda', group: 'Pescados', kcal: 96, protein: 20.08, fat: 1.70, carbs: 0, fiber: 0 },
  { name: 'Pescado carne, salmón', group: 'Pescados', kcal: 179, protein: 19.93, fat: 10.43, carbs: 0, fiber: 0 },
  { name: 'Pescado carne, trucha, fresca', group: 'Pescados', kcal: 148, protein: 20.77, fat: 6.61, carbs: 0, fiber: 0 },
  { name: 'Pescado carne, atún enlatado c/agua, sólidos', group: 'Pescados', kcal: 128, protein: 23.62, fat: 2.97, carbs: 0, fiber: 0 },
  { name: 'Camarón, fresco', group: 'Pescados', kcal: 106, protein: 20.31, fat: 1.73, carbs: 0.91, fiber: 0 },
  { name: 'Calamar, fresco', group: 'Pescados', kcal: 92, protein: 15.58, fat: 1.38, carbs: 3.08, fiber: 0 },
  { name: 'Pulpo, fresco', group: 'Pescados', kcal: 82, protein: 14.91, fat: 1.04, carbs: 2.20, fiber: 0 },
  { name: 'Langosta, cocida', group: 'Pescados', kcal: 98, protein: 20.50, fat: 0.59, carbs: 1.28, fiber: 0 },

  // Leche y derivados
  { name: 'Leche de vaca, íntegra, fluida (3.25% grasa)', group: 'Lácteos', kcal: 60, protein: 3.22, fat: 3.25, carbs: 4.99, fiber: 0 },
  { name: 'Leche de vaca, semidescremada (2% grasa), fluida', group: 'Lácteos', kcal: 89, protein: 3.33, fat: 1.97, carbs: 4.68, fiber: 0 },
  { name: 'Queso blanco fresco, leche íntegra', group: 'Lácteos', kcal: 264, protein: 17.50, fat: 20.10, carbs: 3.30, fiber: 0 },
  { name: 'Queso mozarela, leche íntegra', group: 'Lácteos', kcal: 300, protein: 22.17, fat: 22.35, carbs: 2.19, fiber: 0 },
  { name: 'Yogurt, leche íntegra, natural', group: 'Lácteos', kcal: 61, protein: 3.47, fat: 3.25, carbs: 4.66, fiber: 0 },
  { name: 'Crema, espesa', group: 'Lácteos', kcal: 345, protein: 2.05, fat: 37.00, carbs: 2.79, fiber: 0 },

  // Huevos
  { name: 'Huevo de gallina, entero, crudo', group: 'Huevos', kcal: 147, protein: 12.58, fat: 9.94, carbs: 0.77, fiber: 0 },
  { name: 'Huevo de gallina, clara fresca', group: 'Huevos', kcal: 52, protein: 10.90, fat: 0.17, carbs: 0.73, fiber: 0 },
  { name: 'Huevo de gallina, yema, fresca', group: 'Huevos', kcal: 322, protein: 15.86, fat: 26.54, carbs: 3.59, fiber: 0 },

  // Leguminosas, granos secos y nueces
  { name: 'Frijol negro, grano seco', group: 'Leguminosas', kcal: 343, protein: 22.70, fat: 1.60, carbs: 61.60, fiber: 18.37 },
  { name: 'Frijol blanco, grano seco', group: 'Leguminosas', kcal: 333, protein: 23.36, fat: 0.85, carbs: 60.27, fiber: 15.20 },
  { name: 'Frijol soya, grano seco', group: 'Leguminosas', kcal: 416, protein: 36.49, fat: 19.94, carbs: 30.16, fiber: 9.30 },
  { name: 'Lenteja seca, grano', group: 'Leguminosas', kcal: 353, protein: 25.80, fat: 1.06, carbs: 60.08, fiber: 30.50 },
  { name: 'Garbanzo, grano seco', group: 'Leguminosas', kcal: 364, protein: 19.30, fat: 6.04, carbs: 60.65, fiber: 17.40 },
  { name: 'Haba seca, grano crudo', group: 'Leguminosas', kcal: 341, protein: 26.12, fat: 1.53, carbs: 58.29, fiber: 25.00 },
  { name: 'Maní/cacahuate crudo, c/película', group: 'Leguminosas', kcal: 543, protein: 25.50, fat: 44.00, carbs: 21.30, fiber: 8.50 },
  { name: 'Almendra, seca', group: 'Leguminosas', kcal: 581, protein: 21.94, fat: 50.62, carbs: 19.94, fiber: 10.40 },
  { name: 'Semilla de ajonjolí', group: 'Leguminosas', kcal: 573, protein: 17.73, fat: 49.67, carbs: 23.45, fiber: 11.80 },
];

export default foodsGuatemala;
