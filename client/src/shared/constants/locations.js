/**
 * Predefined administrative locations of Ethiopia: Region -> Zone -> City.
 * Users select a city, and its corresponding zone and region are automatically filled.
 */

export const ETHIOPIA_LOCATIONS_DATA = [
  {
    region: 'Addis Ababa',
    zones: [
      {
        name: 'Addis Ababa',
        cities: ['Addis Ababa'],
      },
    ],
  },
  {
    region: 'Afar',
    zones: [
      {
        name: 'Zone 1 (Awsi Rasu)',
        cities: ['Semera-Logia', 'Asayita'],
      },
      {
        name: 'Zone 2 (Kilbet Rasu)',
        cities: ['Abala', 'Afdera', 'Berhale', 'Dallol'],
      },
      {
        name: 'Zone 3 (Gabi Rasu)',
        cities: ['Awash', 'Amibara'],
      },
      {
        name: 'Zone 4 (Fanti Rasu)',
        cities: ['Ewa', 'Gulina'],
      },
      {
        name: 'Zone 5 (Hari Rasu)',
        cities: ['Dewe', 'Telalak', 'Dalifage'],
      },
    ],
  },
  {
    region: 'Amhara',
    zones: [
      {
        name: 'Bahir Dar City (Special Zone)',
        cities: ['Bahir Dar'],
      },
      {
        name: 'Agew Awi (Awi) Zone',
        cities: ['Injibara', 'Dangila'],
      },
      {
        name: 'East Gojjam Zone',
        cities: ['Debre Markos', 'Dejen', 'Dembecha'],
      },
      {
        name: 'West Gojjam Zone',
        cities: ['Finote Selam', 'Bure'],
      },
      {
        name: 'North Gondar Zone',
        cities: ['Gondar (Gonder)', 'Debark', 'Metema'],
      },
      {
        name: 'South Gondar Zone',
        cities: ['Debre Tabor', 'Nefas Mewucha'],
      },
      {
        name: 'North Shewa Zone (R3)',
        cities: ['Debre Birhan', 'Ankober', 'Debre Sina'],
      },
      {
        name: 'North Wollo Zone',
        cities: ['Weldiya (Woldia)', 'Kobo'],
      },
      {
        name: 'South Wollo Zone',
        cities: ['Dessie', 'Kombolcha'],
      },
      {
        name: 'Wag Hemra Zone',
        cities: ['Seqota (Sekota)'],
      },
      {
        name: 'Oromia Zone',
        cities: ['Kemise'],
      },
    ],
  },
  {
    region: 'Oromia',
    zones: [
      {
        name: 'East Shewa Zone',
        cities: ['Adama', 'Bishoftu', 'Batu (Ziway)', 'Mojo'],
      },
      {
        name: 'North Shewa Zone',
        cities: ['Fiche', 'Sululta', 'Garba Guracha'],
      },
      {
        name: 'West Shewa Zone',
        cities: ['Ambo', 'Guder', 'Ginchi'],
      },
      {
        name: 'Southwest Shewa Zone',
        cities: ['Waliso', 'Tulu Bolo'],
      },
      {
        name: 'East Welega Zone',
        cities: ['Nekemte', 'Diga'],
      },
      {
        name: 'West Welega Zone',
        cities: ['Gimbi', 'Nejo'],
      },
      {
        name: 'Kellem Welega Zone',
        cities: ['Dembidolo'],
      },
      {
        name: 'Horo Guduru Welega Zone',
        cities: ['Shambu'],
      },
      {
        name: 'Jimma Zone',
        cities: ['Agaro', 'Limu Genet', 'Jimma City'],
      },
      {
        name: 'Buno Bedele Zone',
        cities: ['Bedele'],
      },
      {
        name: 'Illubabor Zone',
        cities: ['Metu (Mattuu)'],
      },
      {
        name: 'Arsi Zone',
        cities: ['Asella'],
      },
      {
        name: 'West Arsi Zone',
        cities: ['Shashamane', 'Dodola'],
      },
      {
        name: 'Bale Zone',
        cities: ['Robe', 'Goba'],
      },
      {
        name: 'East Bale Zone',
        cities: ['Ginir'],
      },
      {
        name: 'Borena Zone',
        cities: ['Yabelo', 'Moyale'],
      },
      {
        name: 'East Borena Zone',
        cities: ['Arero', 'Liban'],
      },
      {
        name: 'Guji Zone',
        cities: ['Nageelle Borana', 'Adola'],
      },
      {
        name: 'West Guji Zone',
        cities: ['Bule Hora'],
      },
      {
        name: 'East Hararghe Zone',
        cities: ['Harar', 'Babile', 'Haramaya', 'Dire Dawa'],
      },
      {
        name: 'West Hararghe Zone',
        cities: ['Chiro', 'Mieso', 'Chiro Zuria'],
      },
    ],
  },
  {
    region: 'Tigray',
    zones: [
      {
        name: 'Central Zone',
        cities: ['Axum (Aksum)', 'Adwa', 'Abiy Addi', 'Yeha', 'Fremona'],
      },
      {
        name: 'Eastern Zone',
        cities: ['Adigrat', 'Wukro', 'Hawzen', 'Freweyni', 'Zalambessa', 'Atsbi'],
      },
      {
        name: 'Northwestern Zone',
        cities: ['Shire (Inda Selassie)', 'Sheraro', 'Inda Aba Guna', 'Selekleka', 'Adi Daero', 'May Tsebri'],
      },
      {
        name: 'Southern Zone',
        cities: ['Alamata', 'Maychew', 'Korem', 'Edaga Arbi'],
      },
      {
        name: 'South Eastern Zone',
        cities: ['Samre', 'Agula', 'Antalo', 'Gijet'],
      },
      {
        name: 'Western Zone',
        cities: ['Humera', 'Mai Kadra', 'Addi Remets'],
      },
      {
        name: 'Mekelle Special Zone',
        cities: ['Mekelle'],
      },
    ],
  },
  {
    region: 'Gambela',
    zones: [
      {
        name: 'Anyuak Zone',
        cities: ['Gambella', 'Abobo', 'Gog', 'Jore', 'Dimma'],
      },
      {
        name: 'Nuer Zone',
        cities: ['Nyinenyang', 'Tiergol', 'Kuach Thiang', 'Jekow', 'Lare', 'Kuergeng', 'Matar'],
      },
      {
        name: 'Mejeng Zone',
        cities: ['Meti', 'Mengesh'],
      },
      {
        name: 'Itang Special Woreda',
        cities: ['Itang'],
      },
    ],
  },
  {
    region: 'Somali',
    zones: [
      {
        name: 'Afder Zone',
        cities: ['Hargele', 'West Imey', 'Chereti'],
      },
      {
        name: 'Doollo Zone',
        cities: ['Warder', 'Geladin', 'Boh', 'Danot'],
      },
      {
        name: 'Erer Zone',
        cities: ['Erer'],
      },
      {
        name: 'Fafan Zone',
        cities: ['Jijiga', 'Babile', 'Kebribeyah', 'Awbere'],
      },
      {
        name: 'Jarar Zone',
        cities: ['Degehabur', 'Awaare', 'Birqod'],
      },
      {
        name: 'Korahe Zone',
        cities: ['Kebridehar', 'Denan', 'Shilabo'],
      },
      {
        name: 'Liben Zone',
        cities: ['Filtu', 'Dolo Odo'],
      },
      {
        name: 'Nogob Zone',
        cities: ['Fik'],
      },
      {
        name: 'Shabelle Zone',
        cities: ['Gode', 'Kelafo', 'Ferfer', 'Mustahil'],
      },
      {
        name: 'Sitti Zone',
        cities: ['Shinile', 'Aysha', 'Dewele', 'Afdem'],
      },
      {
        name: 'Dhawa Zone',
        cities: ['Lahey', 'Hudet'],
      },
    ],
  },
  {
    region: 'Sidama',
    zones: [
      {
        name: 'Central Sidama Zone',
        cities: ['Irgalem (Yirgalem)', 'Arbegona', 'Dale', 'Darara', 'Loka Abaya', 'Shafaamo', 'Wonsho'],
      },
      {
        name: 'Eastern Sidama Zone',
        cities: ['Daye', 'Harooresa', 'Bansa', 'Booni gangaawa', 'Bura', 'Chabe Gambeltu', 'Chere', "Da'ela", 'Hoko'],
      },
      {
        name: 'Northern Sidama Zone',
        cities: ['Leku', 'Bilate Zuria', 'Boricha', 'Gorche', 'Hawassi gangaawa', 'Malga', 'Shabadino', 'Wondo Genet'],
      },
      {
        name: 'Southern Sidama Zone',
        cities: ['Aleta Wendo', 'Bursa', 'Chuko', 'Dara', 'Dara Otilcho', 'Hula', 'Teticha'],
      },
      {
        name: 'Hawassa City',
        cities: ['Hawassa'],
      },
    ],
  },
  {
    region: 'South West Ethiopia',
    zones: [
      {
        name: 'Bench Sheko Zone',
        cities: ['Mizan Teferi', 'Aman', 'Debub-Bench', 'Sheko', 'Guraferda'],
      },
      {
        name: 'Keffa Zone',
        cities: ['Bonga', 'Gewata', 'Sayilem'],
      },
      {
        name: 'Dawro Zone',
        cities: ['Tarcha', 'Gesa', 'Waka'],
      },
      {
        name: 'Sheka Zone',
        cities: ['Tepi', 'Masha', 'Gecha'],
      },
      {
        name: 'Konta Zone',
        cities: ['Amaya', 'Chida'],
      },
      {
        name: 'West Omo Zone',
        cities: ['Jemu', 'Maji', 'Bachuma', 'Bero'],
      },
    ],
  },
  {
    region: 'Central Ethiopia',
    zones: [
      {
        name: 'Hadiya Zone',
        cities: ['Hosaena', 'Shone', 'Bonosha', 'Fonko', 'Jajura'],
      },
      {
        name: 'Gurage Zone',
        cities: ['Welkite', 'Emdibir', 'Agena', 'Gunchire', 'Arekit'],
      },
      {
        name: 'East Gurage Zone',
        cities: ['Butajira', 'Enseno', 'Buee'],
      },
      {
        name: "Silt'e Zone",
        cities: ['Worabe', 'Kibet', 'Wulbareg', 'Dalocha', 'Tora'],
      },
      {
        name: 'Kembata Zone',
        cities: ['Durame', 'Shinshicho', 'Angacha', 'Hadero', 'Doyogena'],
      },
      {
        name: 'Halaba Zone',
        cities: ['Halaba Kulito'],
      },
      {
        name: 'Yem Zone',
        cities: ['Saja', 'Fofa', 'Toba'],
      },
      {
        name: 'Mareko Special Woreda',
        cities: ['Koshe'],
      },
      {
        name: 'Tembaro Special Woreda',
        cities: ['Mudula'],
      },
    ],
  },
  {
    region: 'South Ethiopia',
    zones: [
      {
        name: 'Wolayita Zone',
        cities: ['Wolaita Sodo', 'Areka', 'Boditi', 'Tebela', 'Bale Hawassa', 'Gesuba', 'Gununo', 'Bedessa', 'Dimtu'],
      },
      {
        name: 'Gamo Zone',
        cities: ['Arba Minch', 'Chencha', 'Kamba', 'Selam Ber', 'Birbir', 'Geresse', 'Dorze', 'Bonke', 'Boreda', 'Mirab Abaya'],
      },
      {
        name: 'Gofa Zone',
        cities: ['Sawla', 'Bulki', 'Laha', 'Beto', 'Galma'],
      },
      {
        name: 'Gedeo Zone',
        cities: ['Dilla', 'Wonago', 'Yirgachefe', 'Chelelekitu', 'Gedeb'],
      },
      {
        name: 'South Omo Zone',
        cities: ['Dimeka', 'Omorate', 'Key Afer', 'Hanna', 'Kangaten', 'Lemo Gento'],
      },
      {
        name: 'Ari Zone',
        cities: ['Jinka', 'Gazer', 'Gelila'],
      },
      {
        name: 'Konso Zone',
        cities: ['Karati'],
      },
      {
        name: 'Gardula Zone',
        cities: ['Gidole'],
      },
      {
        name: 'Burji Zone',
        cities: ['Soyama'],
      },
      {
        name: 'Koore Zone',
        cities: ['Kele (Amaro Kelle)', 'Karma', 'Sarmale', 'Kereda', 'Jijola'],
      },
      {
        name: 'Basketo Zone',
        cities: ['Laska'],
      },
      {
        name: 'Ale Zone',
        cities: ['Kolango'],
      },
    ],
  },
  {
    region: 'Benishangul-Gumuz',
    zones: [
      {
        name: 'Asosa Zone',
        cities: ['Asosa', 'Bambasi', 'Menge', 'Kurmuk', 'Sherkole', 'Homosha', 'Abramo'],
      },
      {
        name: 'Metekel Zone',
        cities: ['Gilgel Beles', 'Manbuk', 'Guba', 'Bulen', 'Dibate', 'Dangur', 'Mandura'],
      },
      {
        name: 'Kamashi Zone',
        cities: ['Kamashi', 'Yaso', 'Sirba Abay', 'Agelo Meti', 'Belo Jegonfoy', 'Daleti'],
      },
      {
        name: 'Mao-Komo Special Woreda',
        cities: ['Tongo'],
      },
      {
        name: 'Pawe Special Woreda',
        cities: ['Pawi (Pawe)'],
      },
    ],
  },
];

// Flatten all cities into a searchable list
export const ALL_CITIES = [];

for (const regionData of ETHIOPIA_LOCATIONS_DATA) {
  for (const zoneData of regionData.zones) {
    for (const city of zoneData.cities) {
      const id = `${regionData.region}|${zoneData.name}|${city}`;
      ALL_CITIES.push({
        id,
        city,
        zone: zoneData.name,
        region: regionData.region,
        label: `${city} (${zoneData.name}, ${regionData.region})`,
      });
    }
  }
}

// Disambiguate duplicate city names and sort strictly alphabetically by city name (A-Z)
const cityCounts = {};
for (const item of ALL_CITIES) {
  cityCounts[item.city] = (cityCounts[item.city] || 0) + 1;
}

export const SORTED_CITIES = [...ALL_CITIES]
  .map((item) => ({
    ...item,
    displayName: cityCounts[item.city] > 1 ? `${item.city} (${item.zone})` : item.city,
  }))
  .sort((a, b) => a.city.localeCompare(b.city));

/**
 * Finds location by city name. If multiple exist (e.g. Moyale, Babile),
 * it matches the first or optionally accepts zone/region to disambiguate.
 */
export function findLocationByCity(cityName, zoneName, regionName) {
  if (!cityName) return null;
  const trimmed = cityName.trim().toLowerCase();

  if (zoneName && regionName) {
    const match = ALL_CITIES.find(
      (c) =>
        c.city.toLowerCase() === trimmed &&
        c.zone.toLowerCase() === zoneName.trim().toLowerCase() &&
        c.region.toLowerCase() === regionName.trim().toLowerCase()
    );
    if (match) return match;
  }

  return ALL_CITIES.find((c) => c.city.toLowerCase() === trimmed) || null;
}

export function findLocationById(id) {
  if (!id) return null;
  return ALL_CITIES.find((c) => c.id === id) || null;
}
