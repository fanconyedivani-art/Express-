import fs from 'fs';
import path from 'path';
import {
  User,
  Station,
  Route,
  Train,
  Trip,
  Seat,
  Booking,
  PaymentReceipt,
  Ticket,
  TouristDestination,
  SystemNotification,
  AuditLog,
  AdminStats
} from '../src/types/index.ts';

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'ekumbi_db.json');

export interface DatabaseSchema {
  users: User[];
  stations: Station[];
  routes: Route[];
  trains: Train[];
  trips: Trip[];
  seats: Seat[];
  bookings: Booking[];
  receipts: PaymentReceipt[];
  tickets: Ticket[];
  touristDestinations: TouristDestination[];
  notifications: SystemNotification[];
  auditLogs: AuditLog[];
}

// 10-digit unique numeric code generator
export function generate10DigitCode(): string {
  // Generate random 10 digits
  let code = '';
  for (let i = 0; i < 10; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  // Ensure starts with non-zero
  if (code.startsWith('0')) {
    code = '8' + code.slice(1);
  }
  return code;
}

// Booking reference generator
export function generateBookingCode(): string {
  const year = new Date().getFullYear();
  const num = Math.floor(10000 + Math.random() * 90000);
  return `EK-${year}-${num}`;
}

const INITIAL_STATIONS: Station[] = [
  {
    id: 'st-luanda-bungo',
    name: 'Estação Central do Bungo',
    code: 'BUN',
    city: 'Luanda',
    province: 'Luanda',
    isMainHub: true,
    latitude: -8.8083,
    longitude: 13.2355,
    lineName: 'CFL - Caminho de Ferro de Luanda',
    description: 'Estação central e histórica de passageiros no coração de Luanda.'
  },
  {
    id: 'st-luanda-viana',
    name: 'Estação de Viana',
    code: 'VIA',
    city: 'Viana',
    province: 'Luanda',
    isMainHub: false,
    latitude: -8.9056,
    longitude: 13.3725,
    lineName: 'CFL - Caminho de Ferro de Luanda',
    description: 'Hub de correspondência multimodal no município industrial de Viana.'
  },
  {
    id: 'st-dondo',
    name: 'Estação do Dondo',
    code: 'DON',
    city: 'Dondo (Cambambe)',
    province: 'Cuanza Norte',
    isMainHub: false,
    latitude: -9.6931,
    longitude: 14.4267,
    lineName: 'CFL - Caminho de Ferro de Luanda',
    description: 'Porta de entrada no Vale do Kwanza e centro de transbordo histórico.'
  },
  {
    id: 'st-ndalatando',
    name: 'Estação de Ndalatando',
    code: 'NDL',
    city: 'Ndalatando',
    province: 'Cuanza Norte',
    isMainHub: true,
    latitude: -9.2981,
    longitude: 14.9114,
    lineName: 'CFL - Caminho de Ferro de Luanda',
    description: 'Capital verdejante do Cuanza Norte, famosa pelas suas serras e orquidários.'
  },
  {
    id: 'st-malanje',
    name: 'Estação Central de Malanje',
    code: 'MAL',
    city: 'Malanje',
    province: 'Malanje',
    isMainHub: true,
    latitude: -9.5401,
    longitude: 16.3411,
    lineName: 'CFL - Caminho de Ferro de Luanda',
    description: 'Términus oriental do CFL, cidade das magníficas Quedas de Kalandula e Pungo Andongo.'
  },
  {
    id: 'st-lobito',
    name: 'Estação do Lobito',
    code: 'LOB',
    city: 'Lobito',
    province: 'Benguela',
    isMainHub: true,
    latitude: -12.3533,
    longitude: 13.5456,
    lineName: 'CFB - Caminho de Ferro de Benguela',
    description: 'Ponto de partida do Corredor do Lobito e do Atlântico.'
  },
  {
    id: 'st-benguela',
    name: 'Estação de Benguela',
    code: 'BEN',
    city: 'Benguela',
    province: 'Benguela',
    isMainHub: true,
    latitude: -12.5763,
    longitude: 13.4055,
    lineName: 'CFB - Caminho de Ferro de Benguela',
    description: 'Estação nobre da cidade das acácias rubras e praias caribenhas de Angola.'
  },
  {
    id: 'st-huambo',
    name: 'Estação Central do Huambo',
    code: 'HBA',
    city: 'Huambo',
    province: 'Huambo',
    isMainHub: true,
    latitude: -12.7761,
    longitude: 15.7392,
    lineName: 'CFB - Caminho de Ferro de Benguela',
    description: 'O planalto central de Angola, com clima ameno e arquitetura imponente.'
  },
  {
    id: 'st-lubango',
    name: 'Estação do Lubango',
    code: 'LUB',
    city: 'Lubango',
    province: 'Huíla',
    isMainHub: true,
    latitude: -14.9172,
    longitude: 13.5042,
    lineName: 'CFM - Caminho de Ferro de Moçâmedes',
    description: 'A metrópole do Sul, cidade do Cristo Rei e dos miradouros da Serra da Leba.'
  },
  {
    id: 'st-namibe',
    name: 'Estação de Moçâmedes',
    code: 'NAM',
    city: 'Moçâmedes',
    province: 'Namibe',
    isMainHub: true,
    latitude: -15.1961,
    longitude: 12.1522,
    lineName: 'CFM - Caminho de Ferro de Moçâmedes',
    description: 'Estação costeira e desértica do Namibe, terra da Welwitschia Mirabilis.'
  }
];

const INITIAL_ROUTES: Route[] = [
  {
    id: 'route-luanda-malanje',
    name: 'Linha do Sol Poente (Luanda ➔ Malanje)',
    originStationId: 'st-luanda-bungo',
    originStationName: 'Estação Central do Bungo (Luanda)',
    destinationStationId: 'st-malanje',
    destinationStationName: 'Estação Central de Malanje',
    distanceKm: 424,
    estimatedDurationMinutes: 390, // 6h 30m
    line: 'CFL - Caminho de Ferro de Luanda',
    active: true,
    stops: [
      { stationId: 'st-luanda-bungo', stationName: 'Estação Central do Bungo', province: 'Luanda', stopOrder: 1, arrivalOffsetMinutes: 0, departureOffsetMinutes: 0, distanceKm: 0 },
      { stationId: 'st-luanda-viana', stationName: 'Estação de Viana', province: 'Luanda', stopOrder: 2, arrivalOffsetMinutes: 35, departureOffsetMinutes: 45, distanceKm: 30, touristHighlight: 'Mercado de Viana & Polo Industrial' },
      { stationId: 'st-dondo', stationName: 'Estação do Dondo', province: 'Cuanza Norte', stopOrder: 3, arrivalOffsetMinutes: 180, departureOffsetMinutes: 195, distanceKm: 185, touristHighlight: 'Rio Kwanza & Ruínas de Cambambe' },
      { stationId: 'st-ndalatando', stationName: 'Estação de Ndalatando', province: 'Cuanza Norte', stopOrder: 4, arrivalOffsetMinutes: 245, departureOffsetMinutes: 260, distanceKm: 248, touristHighlight: 'Jardim Botânico de Ndalatando' },
      { stationId: 'st-malanje', stationName: 'Estação Central de Malanje', province: 'Malanje', stopOrder: 5, arrivalOffsetMinutes: 390, departureOffsetMinutes: 390, distanceKm: 424, touristHighlight: 'Quedas de Kalandula & Pedras Negras' }
    ]
  },
  {
    id: 'route-malanje-luanda',
    name: 'Linha da Aurora Kwanza (Malanje ➔ Luanda)',
    originStationId: 'st-malanje',
    originStationName: 'Estação Central de Malanje',
    destinationStationId: 'st-luanda-bungo',
    destinationStationName: 'Estação Central do Bungo (Luanda)',
    distanceKm: 424,
    estimatedDurationMinutes: 390,
    line: 'CFL - Caminho de Ferro de Luanda',
    active: true,
    stops: [
      { stationId: 'st-malanje', stationName: 'Estação Central de Malanje', province: 'Malanje', stopOrder: 1, arrivalOffsetMinutes: 0, departureOffsetMinutes: 0, distanceKm: 0 },
      { stationId: 'st-ndalatando', stationName: 'Estação de Ndalatando', province: 'Cuanza Norte', stopOrder: 2, arrivalOffsetMinutes: 130, departureOffsetMinutes: 145, distanceKm: 176, touristHighlight: 'Cultura Kwanza & Orquídeas' },
      { stationId: 'st-dondo', stationName: 'Estação do Dondo', province: 'Cuanza Norte', stopOrder: 3, arrivalOffsetMinutes: 195, departureOffsetMinutes: 210, distanceKm: 239, touristHighlight: 'História Colonial & Peixe do Rio' },
      { stationId: 'st-luanda-viana', stationName: 'Estação de Viana', province: 'Luanda', stopOrder: 4, arrivalOffsetMinutes: 345, departureOffsetMinutes: 355, distanceKm: 394 },
      { stationId: 'st-luanda-bungo', stationName: 'Estação Central do Bungo', province: 'Luanda', stopOrder: 5, arrivalOffsetMinutes: 390, departureOffsetMinutes: 390, distanceKm: 424, touristHighlight: 'Baía de Luanda & Fortaleza' }
    ]
  },
  {
    id: 'route-lobito-huambo',
    name: 'Expresso das Acácias (Lobito ➔ Huambo)',
    originStationId: 'st-lobito',
    originStationName: 'Estação do Lobito',
    destinationStationId: 'st-huambo',
    destinationStationName: 'Estação Central do Huambo',
    distanceKm: 398,
    estimatedDurationMinutes: 360,
    line: 'CFB - Caminho de Ferro de Benguela',
    active: true,
    stops: [
      { stationId: 'st-lobito', stationName: 'Estação do Lobito', province: 'Benguela', stopOrder: 1, arrivalOffsetMinutes: 0, departureOffsetMinutes: 0, distanceKm: 0, touristHighlight: 'Restinga do Lobito' },
      { stationId: 'st-benguela', stationName: 'Estação de Benguela', province: 'Benguela', stopOrder: 2, arrivalOffsetMinutes: 40, departureOffsetMinutes: 50, distanceKm: 33, touristHighlight: 'Praia da Baía Azul & Acácias' },
      { stationId: 'st-huambo', stationName: 'Estação Central do Huambo', province: 'Huambo', stopOrder: 3, arrivalOffsetMinutes: 360, departureOffsetMinutes: 360, distanceKm: 398, touristHighlight: 'Morro do Moco & Parque da Serra' }
    ]
  },
  {
    id: 'route-namibe-lubango',
    name: 'Comboio da Serra da Leba (Moçâmedes ➔ Lubango)',
    originStationId: 'st-namibe',
    originStationName: 'Estação de Moçâmedes (Namibe)',
    destinationStationId: 'st-lubango',
    destinationStationName: 'Estação do Lubango',
    distanceKm: 246,
    estimatedDurationMinutes: 240,
    line: 'CFM - Caminho de Ferro de Moçâmedes',
    active: true,
    stops: [
      { stationId: 'st-namibe', stationName: 'Estação de Moçâmedes', province: 'Namibe', stopOrder: 1, arrivalOffsetMinutes: 0, departureOffsetMinutes: 0, distanceKm: 0, touristHighlight: 'Deserto do Namibe & Welwitschia' },
      { stationId: 'st-lubango', stationName: 'Estação do Lubango', province: 'Huíla', stopOrder: 2, arrivalOffsetMinutes: 240, departureOffsetMinutes: 240, distanceKm: 246, touristHighlight: 'Cristo Rei & Fenda da Tundavala' }
    ]
  }
];

const INITIAL_TRAINS: Train[] = [
  {
    id: 'train-ekumbi-01',
    name: 'EKUMBI Veloz Kwanza 01',
    code: 'EK-VEL-01',
    model: 'Stadler FLIRT Aerodinâmico Tropicalizado',
    active: true,
    totalCarriages: 4,
    totalCapacity: 160,
    carriages: [
      { id: 'carr-01-primeira', trainId: 'train-ekumbi-01', carriageNumber: 1, travelClass: 'primeira', capacity: 24, seatRows: 6, seatsPerRow: 4, amenities: ['Wi-Fi 5G', 'Bebidas Cortesia', 'Tomadas USB-C', 'Mesas de Carvalho', 'Serviço Atencioso'], active: true },
      { id: 'carr-02-executiva', trainId: 'train-ekumbi-01', carriageNumber: 2, travelClass: 'executiva', capacity: 40, seatRows: 10, seatsPerRow: 4, amenities: ['Assentos em Pele Reclináveis', 'Wi-Fi', 'Luz de Leitura', 'Tomadas'], active: true },
      { id: 'carr-03-turistica', trainId: 'train-ekumbi-01', carriageNumber: 3, travelClass: 'turistica', capacity: 48, seatRows: 12, seatsPerRow: 4, amenities: ['Ar Condicionado Climatizado', 'Janelas Panorâmicas', 'Som Ambiente'], active: true },
      { id: 'carr-04-turistica', trainId: 'train-ekumbi-01', carriageNumber: 4, travelClass: 'turistica', capacity: 48, seatRows: 12, seatsPerRow: 4, amenities: ['Ar Condicionado', 'Suporte de Bagagem', 'Restaurante Acesso'], active: true }
    ]
  },
  {
    id: 'train-ekumbi-02',
    name: 'EKUMBI Expresso das Quedas 02',
    code: 'EK-EXP-02',
    model: 'Bombardier Bi-Level Modern Express',
    active: true,
    totalCarriages: 3,
    totalCapacity: 120,
    carriages: [
      { id: 'carr-21-primeira', trainId: 'train-ekumbi-02', carriageNumber: 1, travelClass: 'primeira', capacity: 24, seatRows: 6, seatsPerRow: 4, amenities: ['Lounge VIP', 'Catering Gourmet', 'Ecrãs Individuais'], active: true },
      { id: 'carr-22-executiva', trainId: 'train-ekumbi-02', carriageNumber: 2, travelClass: 'executiva', capacity: 48, seatRows: 12, seatsPerRow: 4, amenities: ['Ar Condicionado', 'Tomadas', 'Lanche'], active: true },
      { id: 'carr-23-turistica', trainId: 'train-ekumbi-02', carriageNumber: 3, travelClass: 'turistica', capacity: 48, seatRows: 12, seatsPerRow: 4, amenities: ['Conforto Panorâmico', 'Ar Climatizado'], active: true }
    ]
  }
];

const INITIAL_TOURIST_DESTINATIONS: TouristDestination[] = [
  {
    id: 'tourist-kalandula',
    name: 'Quedas de Kalandula',
    province: 'Malanje',
    category: 'natural',
    shortDescription: 'Uma das maiores e mais impressionantes cataratas de África com mais de 105 metros de altura.',
    fullDescription: 'As imponentes Quedas de Kalandula situam-se no rio Lucala, um afluente crucial do Rio Kwanza. O espetáculo do caudal tempestuoso cercado por uma exuberante floresta equatorial cria nevoeiros místicos e arco-íris permanentes ao amanhecer.',
    mainAttractions: ['Miradouro Central das Quedas', 'Trilho Verde do Rio Lucala', 'Feira de Artesanato em Pedra e Madeira'],
    localCulture: 'Tradição do povo Matamba, lendas ancestrais da Rainha Nzinga e gastronomia rica em Quifufutila e Mukua.',
    curiosities: ['Segunda maior catarata em extensão no continente africano após Victoria Falls.', 'Águas ricas em peixe de água doce endémico.'],
    imageUrl: '/src/assets/images/tourist_calandula_falls_1794439205229.jpg',
    nearStationId: 'st-malanje',
    nearStationName: 'Estação Central de Malanje'
  },
  {
    id: 'tourist-miradouro-lua',
    name: 'Miradouro da Lua',
    province: 'Luanda',
    category: 'natural',
    shortDescription: 'Cenário geológico de desfiladeiros lunares que desaguam dramaticamente nas falésias do Atlântico.',
    fullDescription: 'Localizado a sul de Luanda no município da Belas, o Miradouro da Lua é uma das paisagens mais fotografadas de Angola. A erosão das chuvas e ventos esculpiu ravina após ravina em argilas coloridas que vão do ocre vivo ao branco puro.',
    mainAttractions: ['Passadiço do Pôr-do-Sol', 'Falésias da Praia da Onça', 'Mirante Geológico'],
    localCulture: 'Cultura piscatória da orla costeira luandense, ritmos de Semba e hospitalidade acolhedora.',
    curiosities: ['Foi cenário para o aclamado filme angolano "O Miradouro da Lua" (1993).', 'A coloração das argilas varia consoante a hora do sol.'],
    imageUrl: '/src/assets/images/tourist_miradouro_lua_1794439205816.jpg',
    nearStationId: 'st-luanda-bungo',
    nearStationName: 'Estação Central do Bungo (Luanda)'
  },
  {
    id: 'tourist-pedras-negras',
    name: 'Pedras Negras de Pungo Andongo',
    province: 'Malanje',
    category: 'historico',
    shortDescription: 'Monumentais monólitos negros erguendo-se sobre a savana verdejante, berço histórico da Rainha Nzinga.',
    fullDescription: 'Pungo Andongo abriga formações rochosas gigantescas com milhões de anos de idade, impregnadas de misticismo e bravura histórica. Aqui ficava a fortaleza natural do reino do Ndongo.',
    mainAttractions: ['Pegadas da Rainha Nzinga gravadas na rocha', 'Pico Panorâmico de Pungo Andongo', 'Vila Histórica'],
    localCulture: 'Ritos sagrados do Reino do Ndongo, memória dos guerreiros Mbundu e festivais folclóricos.',
    curiosities: ['As marcas de passos petrificadas na rocha foram deixadas pela Rainha Nzinga durante as suas estratégias contra os colonizadores.'],
    imageUrl: '/src/assets/images/hero_ekumbi_train_1794439205262.jpg',
    nearStationId: 'st-malanje',
    nearStationName: 'Estação Central de Malanje'
  },
  {
    id: 'tourist-rio-kwanza',
    name: 'Vale do Rio Kwanza & Cambambe',
    province: 'Cuanza Norte',
    category: 'natural',
    shortDescription: 'O maior rio genuinamente angolano que dá nome à moeda nacional, cercado por desfiladeiros e história naval.',
    fullDescription: 'Ao passar pelo Dondo, o comboio EKUMBI EXPRESS cruza o imponente Rio Kwanza. As margens férteis contam a história da navegação a vapor no século XIX e a riqueza das terras de Cambambe.',
    mainAttractions: ['Passeios fluviais de barco no Kwanza', 'Fortaleza histórica de Cambambe', 'Feira do Dondo'],
    localCulture: 'Gastronomia de peixe Cacusso grelhado com funge e molho de gindungo, tambores tradicionais.',
    curiosities: ['O Rio Kwanza tem 960 km de extensão e desagua no Oceano Atlântico em Barra do Kwanza.'],
    imageUrl: '/src/assets/images/train_luxury_interior_1794439205805.jpg',
    nearStationId: 'st-dondo',
    nearStationName: 'Estação do Dondo'
  }
];

class DatabaseService {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(fileContent);
      }
    } catch (e) {
      console.error('Error loading DB file, fallback to initial state', e);
    }

    const initial = this.generateInitialData();
    this.saveData(initial);
    return initial;
  }

  private generateInitialData(): DatabaseSchema {
    const today = new Date();
    const formatDate = (offsetDays: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() + offsetDays);
      return d.toISOString().split('T')[0];
    };

    const initialTrips: Trip[] = [
      {
        id: 'trip-001',
        trainId: 'train-ekumbi-01',
        trainName: 'EKUMBI Veloz Kwanza 01',
        trainCode: 'EK-VEL-01',
        routeId: 'route-luanda-malanje',
        originStation: 'Estação Central do Bungo',
        originProvince: 'Luanda',
        destinationStation: 'Estação Central de Malanje',
        destinationProvince: 'Malanje',
        departureDate: formatDate(0), // Today
        departureTime: '06:30',
        arrivalDate: formatDate(0),
        arrivalTime: '13:00',
        estimatedDuration: '6h 30m',
        status: 'programada',
        prices: {
          turistica: 8500, // 8.500 AOA
          executiva: 16000, // 16.000 AOA
          primeira: 28000  // 28.000 AOA
        },
        stops: [
          { stationName: 'Estação de Viana', province: 'Luanda', arrivalTime: '07:05', departureTime: '07:15', touristSpot: 'Polo Industrial' },
          { stationName: 'Estação do Dondo', province: 'Cuanza Norte', arrivalTime: '09:30', departureTime: '09:45', touristSpot: 'Rio Kwanza' },
          { stationName: 'Estação de Ndalatando', province: 'Cuanza Norte', arrivalTime: '10:35', departureTime: '10:50', touristSpot: 'Jardim Botânico' },
          { stationName: 'Estação Central de Malanje', province: 'Malanje', arrivalTime: '13:00', departureTime: '13:00', touristSpot: 'Quedas de Kalandula' }
        ],
        totalSeats: 160,
        availableSeats: 142
      },
      {
        id: 'trip-002',
        trainId: 'train-ekumbi-02',
        trainName: 'EKUMBI Expresso das Quedas 02',
        trainCode: 'EK-EXP-02',
        routeId: 'route-malanje-luanda',
        originStation: 'Estação Central de Malanje',
        originProvince: 'Malanje',
        destinationStation: 'Estação Central do Bungo',
        destinationProvince: 'Luanda',
        departureDate: formatDate(0), // Today afternoon
        departureTime: '14:30',
        arrivalDate: formatDate(0),
        arrivalTime: '21:00',
        estimatedDuration: '6h 30m',
        status: 'programada',
        prices: {
          turistica: 8500,
          executiva: 16000,
          primeira: 28000
        },
        stops: [
          { stationName: 'Estação de Ndalatando', province: 'Cuanza Norte', arrivalTime: '16:40', departureTime: '16:55' },
          { stationName: 'Estação do Dondo', province: 'Cuanza Norte', arrivalTime: '17:45', departureTime: '18:00' },
          { stationName: 'Estação de Viana', province: 'Luanda', arrivalTime: '20:15', departureTime: '20:25' },
          { stationName: 'Estação Central do Bungo', province: 'Luanda', arrivalTime: '21:00', departureTime: '21:00' }
        ],
        totalSeats: 120,
        availableSeats: 108
      },
      {
        id: 'trip-003',
        trainId: 'train-ekumbi-01',
        trainName: 'EKUMBI Veloz Kwanza 01',
        trainCode: 'EK-VEL-01',
        routeId: 'route-luanda-malanje',
        originStation: 'Estação Central do Bungo',
        originProvince: 'Luanda',
        destinationStation: 'Estação Central de Malanje',
        destinationProvince: 'Malanje',
        departureDate: formatDate(1), // Tomorrow morning
        departureTime: '06:30',
        arrivalDate: formatDate(1),
        arrivalTime: '13:00',
        estimatedDuration: '6h 30m',
        status: 'programada',
        prices: {
          turistica: 8500,
          executiva: 16000,
          primeira: 28000
        },
        stops: [
          { stationName: 'Estação de Viana', province: 'Luanda', arrivalTime: '07:05', departureTime: '07:15' },
          { stationName: 'Estação do Dondo', province: 'Cuanza Norte', arrivalTime: '09:30', departureTime: '09:45' },
          { stationName: 'Estação de Ndalatando', province: 'Cuanza Norte', arrivalTime: '10:35', departureTime: '10:50' },
          { stationName: 'Estação Central de Malanje', province: 'Malanje', arrivalTime: '13:00', departureTime: '13:00' }
        ],
        totalSeats: 160,
        availableSeats: 154
      },
      {
        id: 'trip-004',
        trainId: 'train-ekumbi-02',
        trainName: 'EKUMBI Expresso das Acácias 02',
        trainCode: 'EK-EXP-02',
        routeId: 'route-lobito-huambo',
        originStation: 'Estação do Lobito',
        originProvince: 'Benguela',
        destinationStation: 'Estação Central do Huambo',
        destinationProvince: 'Huambo',
        departureDate: formatDate(1),
        departureTime: '07:00',
        arrivalDate: formatDate(1),
        arrivalTime: '13:00',
        estimatedDuration: '6h 00m',
        status: 'programada',
        prices: {
          turistica: 7000,
          executiva: 14000,
          primeira: 24000
        },
        stops: [
          { stationName: 'Estação de Benguela', province: 'Benguela', arrivalTime: '07:40', departureTime: '07:50' },
          { stationName: 'Estação Central do Huambo', province: 'Huambo', arrivalTime: '13:00', departureTime: '13:00' }
        ],
        totalSeats: 120,
        availableSeats: 115
      }
    ];

    const initialUsers: User[] = [
      {
        id: 'usr-admin-01',
        name: 'Administrador EKUMBI',
        email: 'admin@ekumbiexpress.ao',
        phone: '+244 922 050 257',
        role: 'admin',
        biNumber: '000192837LA042',
        birthDate: '1985-05-14',
        gender: 'M',
        nationality: 'Angolana',
        address: 'Avenida 4 de Fevereiro, Marginal de Luanda',
        province: 'Luanda',
        municipality: 'Luanda',
        locality: 'Ingombota',
        status: 'activo',
        createdAt: '2026-01-01T08:00:00Z',
        lastLoginAt: new Date().toISOString(),
        loginCount: 48
      },
      {
        id: 'usr-validador-01',
        name: 'Fiscal de Bordo Kwanza',
        email: 'fiscal@ekumbiexpress.ao',
        phone: '+244 923 111 222',
        role: 'validador',
        biNumber: '003847291LN038',
        nationality: 'Angolana',
        status: 'activo',
        createdAt: '2026-01-10T08:00:00Z',
        loginCount: 19
      },
      {
        id: 'usr-cliente-demo',
        name: 'João Pedro da Silva',
        email: 'joao.silva@gmail.com',
        phone: '+244 923 456 789',
        role: 'cliente',
        biNumber: '008472918LA042',
        birthDate: '1992-09-22',
        gender: 'M',
        nationality: 'Angolana',
        address: 'Rua Rainha Ginga, nº 45',
        province: 'Luanda',
        municipality: 'Luanda',
        locality: 'Maianga',
        status: 'activo',
        createdAt: '2026-02-15T10:30:00Z',
        lastLoginAt: new Date().toISOString(),
        loginCount: 12
      }
    ];

    const sampleTicketCode1 = '8492019384';
    const sampleTicketCode2 = '7291048261';

    const initialBookings: Booking[] = [
      {
        id: 'book-sample-01',
        bookingCode: 'EK-2026-78412',
        userId: 'usr-cliente-demo',
        userFullName: 'João Pedro da Silva',
        userEmail: 'joao.silva@gmail.com',
        userPhone: '+244 923 456 789',
        tripId: 'trip-001',
        tripName: 'EKUMBI Veloz Kwanza 01',
        originStation: 'Estação Central do Bungo',
        destinationStation: 'Estação Central de Malanje',
        travelDate: formatDate(0),
        departureTime: '06:30',
        arrivalTime: '13:00',
        trainName: 'EKUMBI Veloz Kwanza 01',
        travelClass: 'executiva',
        passengers: [
          {
            id: 'pass-01',
            fullName: 'João Pedro da Silva',
            biNumber: '008472918LA042',
            phone: '+244 923 456 789',
            email: 'joao.silva@gmail.com',
            seatNumber: '05',
            carriageNumber: 2,
            travelClass: 'executiva',
            price: 16000
          }
        ],
        totalAmount: 16000,
        paymentMethod: 'transferencia_bancaria',
        paymentStatus: 'pagamento_confirmado',
        paymentReference: 'EK-REF-48190',
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        expiresAt: new Date(Date.now() + 3600000 * 48).toISOString()
      }
    ];

    const initialTickets: Ticket[] = [
      {
        id: 'tkt-001',
        bookingId: 'book-sample-01',
        passengerId: 'pass-01',
        numericCode: sampleTicketCode1,
        qrToken: `EKUMBI:TKT:${sampleTicketCode1}:SEC7841`,
        passengerName: 'João Pedro da Silva',
        passengerBi: '008472918LA042',
        tripId: 'trip-001',
        trainName: 'EKUMBI Veloz Kwanza 01',
        originStation: 'Estação Central do Bungo',
        destinationStation: 'Estação Central de Malanje',
        travelDate: formatDate(0),
        departureTime: '06:30',
        arrivalTime: '13:00',
        carriageNumber: 2,
        seatNumber: '05',
        travelClass: 'executiva',
        amountPaid: 16000,
        status: 'valido',
        issuedAt: new Date(Date.now() - 3600000 * 20).toISOString()
      }
    ];

    const initialAuditLogs: AuditLog[] = [
      {
        id: 'log-01',
        adminId: 'usr-admin-01',
        adminName: 'Administrador EKUMBI',
        action: 'CONFIRMACAO_PAGAMENTO',
        targetType: 'pagamento',
        targetId: 'book-sample-01',
        details: 'Comprovativo bancário validado com sucesso após verificação do crédito na conta BAI.',
        timestamp: new Date(Date.now() - 3600000 * 20).toISOString()
      }
    ];

    const initialNotifications: SystemNotification[] = [
      {
        id: 'notif-01',
        userId: 'usr-cliente-demo',
        title: 'Bilhete Emitido com Sucesso!',
        message: 'O seu bilhete digital para Malanje já está disponível para download em PDF ou imagem.',
        type: 'sucesso',
        targetRole: 'cliente',
        createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
        read: false
      },
      {
        id: 'notif-admin-01',
        title: 'Boas-vindas ao Sistema EKUMBI EXPRESS',
        message: 'Painel administrativo operacional com controlo de comboios, validação e pagamentos.',
        type: 'info',
        targetRole: 'admin',
        createdAt: new Date().toISOString(),
        read: false
      }
    ];

    return {
      users: initialUsers,
      stations: INITIAL_STATIONS,
      routes: INITIAL_ROUTES,
      trains: INITIAL_TRAINS,
      trips: initialTrips,
      seats: [],
      bookings: initialBookings,
      receipts: [],
      tickets: initialTickets,
      touristDestinations: INITIAL_TOURIST_DESTINATIONS,
      notifications: initialNotifications,
      auditLogs: initialAuditLogs
    };
  }

  private saveData(data: DatabaseSchema): void {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving DB file:', e);
    }
  }

  public getDb(): DatabaseSchema {
    return this.data;
  }

  public commit(): void {
    this.saveData(this.data);
  }

  // --- SEAT MANAGEMENT & AVAILABILITY ---
  public getSeatsForTrip(tripId: string): Seat[] {
    const trip = this.data.trips.find(t => t.id === tripId);
    if (!trip) return [];

    const train = this.data.trains.find(t => t.id === trip.trainId) || this.data.trains[0];
    const existingBookedTickets = this.data.tickets.filter(
      t => t.tripId === tripId && t.status !== 'cancelado'
    );

    // Filter pending/temporary reservations
    const now = Date.now();
    const activeBookings = this.data.bookings.filter(b => {
      if (b.tripId !== tripId || b.paymentStatus === 'pagamento_rejeitado' || b.paymentStatus === 'pagamento_expirado') {
        return false;
      }
      if (b.paymentStatus === 'aguardando_pagamento' && new Date(b.expiresAt).getTime() < now) {
        return false;
      }
      return true;
    });

    const bookedSeatKeys = new Set<string>();
    for (const tkt of existingBookedTickets) {
      bookedSeatKeys.add(`C0${tkt.carriageNumber}-${tkt.seatNumber}`);
    }

    const lockedSeatKeys = new Map<string, string>();
    for (const b of activeBookings) {
      if (b.paymentStatus === 'aguardando_pagamento' || b.paymentStatus === 'comprovativo_recebido' || b.paymentStatus === 'em_analise') {
        for (const p of b.passengers) {
          lockedSeatKeys.set(`C0${p.carriageNumber}-${p.seatNumber}`, b.expiresAt);
        }
      }
    }

    const seats: Seat[] = [];
    for (const carr of train.carriages) {
      const carrPrefix = carr.carriageNumber < 10 ? `C0${carr.carriageNumber}` : `C${carr.carriageNumber}`;
      for (let i = 1; i <= carr.capacity; i++) {
        const seatNum = i < 10 ? `0${i}` : `${i}`;
        const key = `${carrPrefix}-${seatNum}`;

        let status: 'disponivel' | 'ocupado' | 'bloqueado' = 'disponivel';
        let lockedUntil: string | undefined = undefined;

        if (bookedSeatKeys.has(key)) {
          status = 'ocupado';
        } else if (lockedSeatKeys.has(key)) {
          status = 'bloqueado';
          lockedUntil = lockedSeatKeys.get(key);
        }

        seats.push({
          id: key,
          carriageId: carr.id,
          carriageNumber: carr.carriageNumber,
          seatNumber: seatNum,
          travelClass: carr.travelClass,
          status,
          lockedUntil
        });
      }
    }

    return seats;
  }

  // --- STATS COMPUTATION ---
  public getAdminStats(): AdminStats {
    const clients = this.data.users.filter(u => u.role === 'cliente');
    const totalLogins = this.data.users.reduce((acc, u) => acc + (u.loginCount || 0), 0);
    const confirmedBookings = this.data.bookings.filter(b => b.paymentStatus === 'pagamento_confirmado');
    const totalRevenue = confirmedBookings.reduce((acc, b) => acc + (b.totalAmount || 0), 0);
    const totalPassengers = this.data.bookings.reduce((acc, b) => acc + (b.passengers?.length || 0), 0);
    const totalTicketsIssued = this.data.tickets.length;
    const pendingPayments = this.data.bookings.filter(b => b.paymentStatus === 'aguardando_pagamento').length;
    const receiptsInReview = this.data.bookings.filter(b => b.paymentStatus === 'comprovativo_recebido' || b.paymentStatus === 'em_analise').length;

    const monthlyMap: Record<string, { bookings: number; revenue: number }> = {
      'Jan': { bookings: 14, revenue: 198000 },
      'Fev': { bookings: 22, revenue: 312000 },
      'Mar': { bookings: 31, revenue: 480000 },
      'Abr': { bookings: 45, revenue: 640000 },
      'Mai': { bookings: 58, revenue: 890000 },
      'Jun': { bookings: 76, revenue: 1150000 },
      'Jul': { bookings: 92, revenue: 1420000 },
      'Ago': { bookings: 104, revenue: 1680000 },
      'Set': { bookings: 88, revenue: 1390000 },
      'Out': { bookings: 110, revenue: 1820000 },
      'Nov': { bookings: 125, revenue: 2150000 }
    };

    const popularRoutes = [
      { route: 'Luanda ➔ Malanje', passengers: 420 },
      { route: 'Malanje ➔ Luanda', passengers: 380 },
      { route: 'Lobito ➔ Huambo', passengers: 210 },
      { route: 'Moçâmedes ➔ Lubango', passengers: 165 },
      { route: 'Luanda ➔ Dondo', passengers: 95 }
    ];

    const popularDestinations = [
      { destination: 'Malanje (Kalandula)', count: 520 },
      { destination: 'Luanda (Capital)', count: 480 },
      { destination: 'Huambo (Planalto)', count: 260 },
      { destination: 'Ndalatando (Cuanza N.)', count: 180 },
      { destination: 'Lubango (Huíla)', count: 175 }
    ];

    const paymentsByMethod = [
      { method: 'Transferência Bancária / Multicaixa', count: 185, total: 3200000 },
      { method: 'Depósito Direto em Balcão', count: 64, total: 980000 },
      { method: 'Cartão Multicaixa / Visa', count: 112, total: 1920000 }
    ];

    return {
      totalClients: clients.length,
      totalLogins,
      totalBookings: this.data.bookings.length,
      totalTripsScheduled: this.data.trips.filter(t => t.status === 'programada').length,
      totalTripsCompleted: this.data.trips.filter(t => t.status === 'concluida').length,
      totalPassengers,
      totalTicketsIssued,
      totalPaymentsConfirmed: confirmedBookings.length,
      pendingPaymentsCount: pendingPayments,
      receiptsInReviewCount: receiptsInReview,
      cancelledTripsCount: this.data.trips.filter(t => t.status === 'cancelada').length,
      totalConfirmedRevenue: totalRevenue + 5800000, // including baseline historical turnover
      bookingsByMonth: Object.entries(monthlyMap).map(([month, val]) => ({ month, ...val })),
      popularRoutes,
      popularDestinations,
      paymentsByMethod
    };
  }
}

export const dbService = new DatabaseService();
