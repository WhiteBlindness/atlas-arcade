// City coordinates [lat, lng] keyed by CityEntry id (src/data/cities.ts).
// Fetched from the Wikipedia REST API (coordinates field); the handful the API
// omitted are filled from well-known values. Used by Skyline Silhouette to score
// how close a dropped map pin lands to the real city.

export const CITY_COORDS: Record<string, [number, number]> = {
  paris: [48.857, 2.352], london: [51.507, -0.127], "new-york": [40.713, -74.006],
  tokyo: [35.69, 139.692], rome: [41.893, 12.483], sydney: [-33.868, 151.21],
  cairo: [30.044, 31.236], rio: [-22.911, -43.206], amsterdam: [52.373, 4.894],
  barcelona: [41.383, 2.183], istanbul: [41.014, 28.955], dubai: [25.205, 55.271],
  singapore: [1.283, 103.833], "san-francisco": [37.778, -122.416], venice: [45.438, 12.336],
  prague: [50.088, 14.421], reykjavik: [64.146, -21.942], marrakesh: [31.63, -8.009],
  kyoto: [35.012, 135.768], cusco: [-13.517, -71.979], tallinn: [59.437, 24.745],
  cartagena: [10.4, -75.5], "luang-prabang": [19.89, 102.135], valparaiso: [-33.046, -71.62],
  moscow: [55.756, 37.618], berlin: [52.52, 13.405], toronto: [43.653, -79.382],
  seoul: [37.56, 126.99], shanghai: [31.233, 121.469], bangkok: [13.753, 100.494],
  beijing: [39.907, 116.398], "los-angeles": [34.05, -118.25], chicago: [41.882, -87.628],
  madrid: [40.417, -3.703], "mexico-city": [19.433, -99.133], mumbai: [19.076, 72.878],
  delhi: [28.61, 77.23], miami: [25.774, -80.194], "las-vegas": [36.167, -115.149],
  "washington-dc": [38.905, -77.016], "cape-town": [-33.925, 18.424], "buenos-aires": [-34.604, -58.381],
  vienna: [48.208, 16.372], lisbon: [38.725, -9.15], athens: [37.984, 23.728],
  "kuala-lumpur": [3.148, 101.695], budapest: [47.493, 19.051], warsaw: [52.23, 21.011],
  helsinki: [60.171, 24.938], dublin: [53.35, -6.26], oslo: [59.913, 10.739],
  copenhagen: [55.676, 12.568], zurich: [47.377, 8.541], munich: [48.137, 11.575],
  montreal: [45.509, -73.554], stockholm: [59.329, 18.069], brussels: [50.847, 4.353],
  tbilisi: [41.723, 44.793], ljubljana: [46.051, 14.506], bruges: [51.209, 3.224],
  chefchaouen: [35.171, -5.27], samarkand: [39.651, 66.965], edinburgh: [55.953, -3.189],
  bergen: [60.393, 5.325], ghent: [51.054, 3.725], lviv: [49.84, 24.03],
  yerevan: [40.178, 44.513], baku: [40.376, 49.833], valletta: [35.898, 14.513],
  riga: [56.949, 24.106], bratislava: [48.144, 17.11], sarajevo: [43.857, 18.413],
  porto: [41.15, -8.611],
};
