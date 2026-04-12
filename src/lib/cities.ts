export interface City {
  slug: string;
  name: string;
  nameHi: string;
  state: string;
  isMetro: boolean;
  latitude: number;
  longitude: number;
}

export const CITIES: City[] = [
  { slug: 'mumbai', name: 'Mumbai', nameHi: 'मुंबई', state: 'Maharashtra', isMetro: true, latitude: 19.0760, longitude: 72.8777 },
  { slug: 'delhi', name: 'Delhi', nameHi: 'दिल्ली', state: 'Delhi', isMetro: true, latitude: 28.7041, longitude: 77.1025 },
  { slug: 'bangalore', name: 'Bangalore', nameHi: 'बैंगलूर', state: 'Karnataka', isMetro: true, latitude: 12.9716, longitude: 77.5946 },
  { slug: 'chennai', name: 'Chennai', nameHi: 'चेन्नई', state: 'Tamil Nadu', isMetro: true, latitude: 13.0827, longitude: 80.2707 },
  { slug: 'kolkata', name: 'Kolkata', nameHi: 'कोलकाता', state: 'West Bengal', isMetro: true, latitude: 22.5726, longitude: 88.3639 },
  { slug: 'hyderabad', name: 'Hyderabad', nameHi: 'हैदराबाद', state: 'Telangana', isMetro: true, latitude: 17.3850, longitude: 78.4867 },
  { slug: 'pune', name: 'Pune', nameHi: 'पुणे', state: 'Maharashtra', isMetro: true, latitude: 18.5204, longitude: 73.8567 },
  { slug: 'ahmedabad', name: 'Ahmedabad', nameHi: 'अहमदाबाद', state: 'Gujarat', isMetro: true, latitude: 23.0225, longitude: 72.5714 },
  { slug: 'jaipur', name: 'Jaipur', nameHi: 'जयपुर', state: 'Rajasthan', isMetro: false, latitude: 26.9124, longitude: 75.7873 },
  { slug: 'lucknow', name: 'Lucknow', nameHi: 'लखनऊ', state: 'Uttar Pradesh', isMetro: false, latitude: 26.8467, longitude: 80.9462 },
  { slug: 'surat', name: 'Surat', nameHi: 'सूरत', state: 'Gujarat', isMetro: false, latitude: 21.1702, longitude: 72.8311 },
  { slug: 'kanpur', name: 'Kanpur', nameHi: 'कानपुर', state: 'Uttar Pradesh', isMetro: false, latitude: 26.4499, longitude: 80.3319 },
  { slug: 'nagpur', name: 'Nagpur', nameHi: 'नागपुर', state: 'Maharashtra', isMetro: false, latitude: 21.1458, longitude: 79.0882 },
  { slug: 'indore', name: 'Indore', nameHi: 'इंदौर', state: 'Madhya Pradesh', isMetro: false, latitude: 22.7196, longitude: 75.8577 },
  { slug: 'thane', name: 'Thane', nameHi: 'ठाणे', state: 'Maharashtra', isMetro: false, latitude: 19.2183, longitude: 72.9781 },
  { slug: 'bhopal', name: 'Bhopal', nameHi: 'भोपाल', state: 'Madhya Pradesh', isMetro: false, latitude: 23.2599, longitude: 77.4126 },
  { slug: 'visakhapatnam', name: 'Visakhapatnam', nameHi: 'विशाखापट्टनम', state: 'Andhra Pradesh', isMetro: false, latitude: 17.6868, longitude: 83.2185 },
  { slug: 'patna', name: 'Patna', nameHi: 'पटना', state: 'Bihar', isMetro: false, latitude: 25.6093, longitude: 85.1376 },
  { slug: 'vadodara', name: 'Vadodara', nameHi: 'वडोदरा', state: 'Gujarat', isMetro: false, latitude: 22.3072, longitude: 73.1812 },
  { slug: 'ghaziabad', name: 'Ghaziabad', nameHi: 'गाजियाबाद', state: 'Uttar Pradesh', isMetro: false, latitude: 28.6692, longitude: 77.4538 },
  { slug: 'ludhiana', name: 'Ludhiana', nameHi: 'लुधियाना', state: 'Punjab', isMetro: false, latitude: 30.9010, longitude: 75.8573 },
  { slug: 'agra', name: 'Agra', nameHi: 'आगरा', state: 'Uttar Pradesh', isMetro: false, latitude: 27.1767, longitude: 78.0081 },
  { slug: 'coimbatore', name: 'Coimbatore', nameHi: 'कोयंबटूर', state: 'Tamil Nadu', isMetro: false, latitude: 11.0168, longitude: 76.9558 },
  { slug: 'madurai', name: 'Madurai', nameHi: 'मदुरै', state: 'Tamil Nadu', isMetro: false, latitude: 9.9252, longitude: 78.1198 },
  { slug: 'varanasi', name: 'Varanasi', nameHi: 'वाराणसी', state: 'Uttar Pradesh', isMetro: false, latitude: 25.3176, longitude: 83.0064 },
  { slug: 'rajkot', name: 'Rajkot', nameHi: 'राजकोट', state: 'Gujarat', isMetro: false, latitude: 22.3039, longitude: 70.8022 },
  { slug: 'ranchi', name: 'Ranchi', nameHi: 'रांची', state: 'Jharkhand', isMetro: false, latitude: 23.3441, longitude: 85.3096 },
  { slug: 'chandigarh', name: 'Chandigarh', nameHi: 'चंडीगढ़', state: 'Chandigarh', isMetro: false, latitude: 30.7333, longitude: 76.7794 },
  { slug: 'mysore', name: 'Mysore', nameHi: 'मैसूर', state: 'Karnataka', isMetro: false, latitude: 12.2958, longitude: 76.6394 },
  { slug: 'guwahati', name: 'Guwahati', nameHi: 'गुवाहाटी', state: 'Assam', isMetro: false, latitude: 26.1445, longitude: 91.7362 },
  { slug: 'bhubaneswar', name: 'Bhubaneswar', nameHi: 'भुवनेश्वर', state: 'Odisha', isMetro: false, latitude: 20.2961, longitude: 85.8245 },
  { slug: 'dehradun', name: 'Dehradun', nameHi: 'देहरादून', state: 'Uttarakhand', isMetro: false, latitude: 30.3165, longitude: 78.0322 },
  { slug: 'raipur', name: 'Raipur', nameHi: 'रायपुर', state: 'Chhattisgarh', isMetro: false, latitude: 21.2514, longitude: 81.6296 },
  { slug: 'kochi', name: 'Kochi', nameHi: 'कोची', state: 'Kerala', isMetro: false, latitude: 9.9312, longitude: 76.2673 },
  { slug: 'thiruvananthapuram', name: 'Thiruvananthapuram', nameHi: 'तिरुवनंतपुरम', state: 'Kerala', isMetro: false, latitude: 8.5241, longitude: 76.9366 },
  { slug: 'jodhpur', name: 'Jodhpur', nameHi: 'जोधपुर', state: 'Rajasthan', isMetro: false, latitude: 26.2389, longitude: 73.0243 },
  { slug: 'gwalior', name: 'Gwalior', nameHi: 'ग्वालियर', state: 'Madhya Pradesh', isMetro: false, latitude: 26.2183, longitude: 78.1828 },
  { slug: 'vijayawada', name: 'Vijayawada', nameHi: 'विजयवाड़ा', state: 'Andhra Pradesh', isMetro: false, latitude: 16.5062, longitude: 80.6480 },
  { slug: 'amritsar', name: 'Amritsar', nameHi: 'अमृतसर', state: 'Punjab', isMetro: false, latitude: 31.6340, longitude: 74.8723 },
  { slug: 'noida', name: 'Noida', nameHi: 'नोएडा', state: 'Uttar Pradesh', isMetro: false, latitude: 28.5355, longitude: 77.3910 },
  { slug: 'mangalore', name: 'Mangalore', nameHi: 'मंगलूर', state: 'Karnataka', isMetro: false, latitude: 12.9141, longitude: 74.8560 },
  { slug: 'jammu', name: 'Jammu', nameHi: 'जम्मू', state: 'Jammu & Kashmir', isMetro: false, latitude: 32.7266, longitude: 74.8570 },
  { slug: 'jalandhar', name: 'Jalandhar', nameHi: 'जलंधर', state: 'Punjab', isMetro: false, latitude: 31.3260, longitude: 75.5762 },
  { slug: 'shimla', name: 'Shimla', nameHi: 'शिमला', state: 'Himachal Pradesh', isMetro: false, latitude: 31.1048, longitude: 77.1734 },
  { slug: 'tiruchirappalli', name: 'Tiruchirappalli', nameHi: 'तिरुचिरापल्ली', state: 'Tamil Nadu', isMetro: false, latitude: 10.7905, longitude: 78.7047 },
  { slug: 'hubli', name: 'Hubli', nameHi: 'हुबली', state: 'Karnataka', isMetro: false, latitude: 15.3647, longitude: 75.1240 },
  { slug: 'salem', name: 'Salem', nameHi: 'सेलम', state: 'Tamil Nadu', isMetro: false, latitude: 11.6643, longitude: 78.1460 },
  { slug: 'aurangabad', name: 'Aurangabad', nameHi: 'औरंगाबाद', state: 'Maharashtra', isMetro: false, latitude: 19.8762, longitude: 75.3433 },
  { slug: 'srinagar', name: 'Srinagar', nameHi: 'श्रीनगर', state: 'Jammu & Kashmir', isMetro: false, latitude: 34.0837, longitude: 74.7973 },
  { slug: 'meerut', name: 'Meerut', nameHi: 'मेरठ', state: 'Uttar Pradesh', isMetro: false, latitude: 28.9845, longitude: 77.7064 },
];

export const METRO_CITIES = CITIES.filter((city) => city.isMetro);

export const STATES = Array.from(new Set(CITIES.map((city) => city.state))).sort();

export function getCityBySlug(slug: string): City | undefined {
  return CITIES.find((city) => city.slug === slug);
}

export function getCitiesByState(state: string): City[] {
  return CITIES.filter((city) => city.state === state);
}

export function getRelatedCities(currentSlug: string, count: number = 10): City[] {
  const currentCity = getCityBySlug(currentSlug);
  if (!currentCity) {
    return CITIES.slice(0, count);
  }

  const sameState = CITIES.filter(
    (city) => city.state === currentCity.state && city.slug !== currentSlug
  );

  const metros = METRO_CITIES.filter(
    (city) => city.slug !== currentSlug && !sameState.includes(city)
  );

  const others = CITIES.filter(
    (city) =>
      city.slug !== currentSlug &&
      !sameState.includes(city) &&
      !metros.includes(city)
  );

  const related = [...sameState, ...metros, ...others];
  return related.slice(0, count);
}

export const ALL_INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman & Nicobar Islands', 'Chandigarh', 'Dadra & Nagar Haveli and Daman & Diu',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

export default { CITIES, METRO_CITIES, STATES, getCityBySlug, getCitiesByState, getRelatedCities, ALL_INDIAN_STATES };