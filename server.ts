import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { dbService, generate10DigitCode, generateBookingCode } from './server/db.ts';
import { analyzePaymentReceipt } from './server/geminiOcr.ts';
import {
  Booking,
  Ticket,
  AuditLog,
  SystemNotification,
  User,
  Route,
  Train,
  Trip
} from './src/types/index.ts';

dotenv.config();

const app = express();
const PORT = 3000;

// Body parsing with generous limit for base64 receipt uploads
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Memory session cache (null = guest passenger without login)
let currentUserSession: User | null = null;

// Logging store for simulated SMS and WhatsApp dispatches
export interface OutgoingCommunication {
  id: string;
  channel: 'whatsapp' | 'sms' | 'email';
  recipient: string;
  subject?: string;
  message: string;
  status: 'enviado' | 'pendente' | 'falha';
  sentAt: string;
  metadata?: any;
}

const communicationLogs: OutgoingCommunication[] = [];

// Helper to log and dispatch notifications
function dispatchAlert(
  channel: 'whatsapp' | 'sms' | 'email',
  recipient: string,
  message: string,
  subject?: string,
  metadata?: any
): OutgoingCommunication {
  const comm: OutgoingCommunication = {
    id: `comm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    channel,
    recipient,
    subject,
    message,
    status: 'enviado',
    sentAt: new Date().toISOString(),
    metadata
  };
  communicationLogs.unshift(comm);
  return comm;
}

// ----------------------------------------------------
// AUTHENTICATION & PROFILE ROUTES
// ----------------------------------------------------

app.post('/api/auth/register', (req, res) => {
  const {
    name,
    email,
    phone,
    password,
    biNumber,
    birthDate,
    gender,
    nationality,
    address,
    province,
    municipality,
    locality,
    latitude,
    longitude,
    locationPermission
  } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: 'Nome, e-mail, telefone e palavra-passe são obrigatórios.' });
  }

  const db = dbService.getDb();
  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'Já existe uma conta associada a este endereço de e-mail.' });
  }

  const newUser: User & { password?: string } = {
    id: `usr-${Date.now()}`,
    name,
    email,
    phone,
    password,
    role: 'cliente',
    biNumber: biNumber || '',
    birthDate: birthDate || '',
    gender: gender || 'Outro',
    nationality: nationality || 'Angolana',
    address: address || '',
    province: province || 'Luanda',
    municipality: municipality || 'Luanda',
    locality: locality || '',
    latitude: latitude || undefined,
    longitude: longitude || undefined,
    locationPermission: !!locationPermission,
    status: 'activo',
    createdAt: new Date().toISOString(),
    loginCount: 0
  };

  db.users.push(newUser);

  // Welcome notification
  db.notifications.push({
    id: `notif-${Date.now()}`,
    userId: newUser.id,
    title: 'Bem-vindo ao EKUMBI EXPRESS!',
    message: `Olá ${newUser.name}, a sua conta foi criada com sucesso. Faça login para reservar a sua próxima viagem.`,
    type: 'sucesso',
    targetRole: 'cliente',
    createdAt: new Date().toISOString(),
    read: false
  });

  dbService.commit();
  currentUserSession = null;
  res.json({
    requiresLogin: true,
    email: newUser.email,
    message: 'Cadastro realizado com sucesso! Agora faça o login para continuar.'
  });
});

const ADMIN_REGISTRATION_CODE = 'EXPRESS-ANGOLA2026';

app.post('/api/auth/verify-admin-code', (req, res) => {
  const { code } = req.body;
  if (!code || String(code).trim() !== ADMIN_REGISTRATION_CODE) {
    return res.status(403).json({
      valid: false,
      error: 'Código de autorização inválido. Acesso negado ao cadastro de administrador.'
    });
  }
  res.json({ valid: true, message: 'Código verificado com sucesso.' });
});

app.post('/api/auth/register-admin', (req, res) => {
  const {
    accessCode,
    name,
    email,
    phone,
    password,
    biNumber,
    province
  } = req.body;

  if (!accessCode || String(accessCode).trim() !== ADMIN_REGISTRATION_CODE) {
    return res.status(403).json({
      error: 'Código de autorização inválido. Acesso negado ao cadastro de administrador.'
    });
  }

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: 'Nome, e-mail, telefone e palavra-passe são obrigatórios.' });
  }

  const db = dbService.getDb();
  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'Já existe uma conta associada a este endereço de e-mail.' });
  }

  const newAdmin: User & { password?: string } = {
    id: `adm-${Date.now()}`,
    name,
    email,
    phone,
    password,
    role: 'admin',
    biNumber: biNumber || '',
    nationality: 'Angolana',
    province: province || 'Luanda',
    municipality: 'Luanda',
    status: 'activo',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    loginCount: 1
  };

  db.users.push(newAdmin);

  db.auditLogs.unshift({
    id: `log-${Date.now()}`,
    adminId: newAdmin.id,
    adminName: newAdmin.name,
    action: 'CADASTRO_ADMINISTRADOR',
    targetType: 'cliente',
    targetId: newAdmin.id,
    details: `Novo administrador registado: ${newAdmin.name} (${newAdmin.email}).`,
    timestamp: new Date().toISOString()
  });

  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    userId: newAdmin.id,
    title: 'Conta de Administrador Activada',
    message: `Bem-vindo(a), ${newAdmin.name}. O seu acesso administrativo à EKUMBI EXPRESS está ativo.`,
    type: 'sucesso',
    targetRole: 'admin',
    createdAt: new Date().toISOString(),
    read: false
  });

  dbService.commit();
  currentUserSession = newAdmin;
  res.json({ user: newAdmin, message: 'Administrador cadastrado com sucesso!' });
});

app.post('/api/auth/login', (req, res) => {
  const { identifier, password } = req.body; // email or phone
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Informe o seu e-mail/telefone e palavra-passe.' });
  }

  const db = dbService.getDb();
  const cleanId = identifier.trim().toLowerCase();
  const user = db.users.find(
    u => (u.email.toLowerCase() === cleanId || u.phone.replace(/\s+/g, '') === cleanId.replace(/\s+/g, ''))
  ) as (User & { password?: string }) | undefined;

  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas. Verifique o seu e-mail/telefone e palavra-passe.' });
  }

  if (user.status === 'suspenso') {
    return res.status(403).json({ error: 'Esta conta está temporariamente suspensa pela administração.' });
  }

  if (user.password && user.password !== password) {
    return res.status(401).json({ error: 'Palavra-passe incorreta. Verifique e tente novamente.' });
  }

  user.lastLoginAt = new Date().toISOString();
  user.loginCount = (user.loginCount || 0) + 1;
  dbService.commit();

  const { password: _pwd, ...safeUser } = user;
  currentUserSession = safeUser;
  res.json({ user: safeUser, message: 'Sessão iniciada com sucesso!' });
});

app.post('/api/auth/login-admin', (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Informe o e-mail/telefone e a palavra-passe.' });
  }

  const db = dbService.getDb();
  const cleanId = String(identifier).trim().toLowerCase();
  const user = db.users.find(
    u => u.email.toLowerCase() === cleanId || u.phone.replace(/\s+/g, '') === cleanId.replace(/\s+/g, '')
  ) as (User & { password?: string }) | undefined;

  if (!user) {
    return res.status(401).json({ error: 'Administrador não encontrado. Verifique as credenciais.' });
  }

  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Esta conta não possui privilégios de administrador.' });
  }

  if (user.status === 'suspenso') {
    return res.status(403).json({ error: 'Esta conta administrativa está temporariamente suspensa.' });
  }

  if (user.password && user.password !== password) {
    return res.status(401).json({ error: 'Palavra-passe incorreta.' });
  }

  user.lastLoginAt = new Date().toISOString();
  user.loginCount = (user.loginCount || 0) + 1;

  db.auditLogs.unshift({
    id: `log-${Date.now()}`,
    adminId: user.id,
    adminName: user.name,
    action: 'LOGIN_ADMINISTRADOR',
    targetType: 'cliente',
    targetId: user.id,
    details: `Sessão administrativa iniciada por ${user.name} (${user.email}).`,
    timestamp: new Date().toISOString()
  });

  dbService.commit();
  currentUserSession = user;
  res.json({ user, message: 'Sessão de administrador iniciada com sucesso!' });
});

app.get('/api/auth/me', (req, res) => {
  res.json({ user: currentUserSession });
});

app.post('/api/auth/logout', (req, res) => {
  currentUserSession = null;
  res.json({ user: null, message: 'Sessão encerrada.' });
});

app.post('/api/auth/switch-user', (req, res) => {
  const { role } = req.body;
  const db = dbService.getDb();
  let target = db.users.find(u => u.role === role);
  if (!target) {
    target = db.users[0];
  }
  currentUserSession = target || null;
  res.json({ user: currentUserSession });
});

// ----------------------------------------------------
// PASSENGER BI LOOKUP & QUICK REGISTRATION
// ----------------------------------------------------

const ANGOLA_BI_PROVINCES: Record<string, string> = {
  LA: 'Luanda',
  BG: 'Benguela',
  MJ: 'Malanje',
  HB: 'Huambo',
  HL: 'Huíla',
  CN: 'Cuanza Norte',
  CS: 'Cuanza Sul',
  NB: 'Namibe',
  CB: 'Cabinda',
  UG: 'Uíge',
  ZR: 'Zaire',
  BO: 'Bengo',
  BI: 'Bié',
  MX: 'Moxico',
  CC: 'Cuando Cubango',
  CU: 'Cunene',
  LN: 'Lunda Norte',
  LS: 'Lunda Sul'
};

app.get('/api/passengers/lookup-bi/:biNumber', async (req, res) => {
  const bi = decodeURIComponent(req.params.biNumber || '').trim().toUpperCase();
  if (!bi || bi.length < 6) {
    return res.json({ found: false, validFormat: false });
  }

  // 1. Query institutional Angola BI / KYC API if configured in environment
  const biApiUrl = process.env.ANGOLA_BI_API_URL?.trim();
  const biApiToken = process.env.ANGOLA_BI_API_TOKEN?.trim();
  if (biApiUrl) {
    try {
      const endpoint = `${biApiUrl.replace(/\/+$/, '')}/${encodeURIComponent(bi)}`;
      const apiRes = await fetch(endpoint, {
        headers: biApiToken ? { Authorization: `Bearer ${biApiToken}` } : undefined
      });
      if (apiRes.ok) {
        const external: any = await apiRes.json();
        const extName = external.name || external.fullName || external.nome_completo || external.nome;
        const extAddress = external.address || external.morada || external.residencia || '';
        if (extName) {
          return res.json({
            found: true,
            validFormat: true,
            source: 'official_api',
            name: String(extName),
            address: String(extAddress),
            currentLocation: String(external.currentLocation || external.locality || external.localidade || external.province || external.provincia || ''),
            province: String(external.province || external.provincia || ''),
            phone: String(external.phone || external.telefone || ''),
            email: String(external.email || '')
          });
        }
      }
    } catch (err) {
      console.warn('Erro ao consultar API institucional de BI:', err);
    }
  }

  const db = dbService.getDb();

  // 2. Check real registered users in DB
  const matchedUser = db.users.find(u => u.biNumber && u.biNumber.trim().toUpperCase() === bi);
  if (matchedUser) {
    const locParts = [matchedUser.locality, matchedUser.municipality, matchedUser.province].filter(Boolean);
    const uniqueLoc = Array.from(new Set(locParts)).join(', ');
    return res.json({
      found: true,
      validFormat: true,
      source: 'database',
      name: matchedUser.name,
      address: matchedUser.address || '',
      currentLocation: uniqueLoc,
      province: matchedUser.province || '',
      phone: matchedUser.phone || '',
      email: matchedUser.email || ''
    });
  }

  // 3. Check real previous bookings passengers in DB
  for (const booking of db.bookings) {
    const pass = booking.passengers.find(p => p.biNumber && p.biNumber.trim().toUpperCase() === bi);
    if (pass) {
      return res.json({
        found: true,
        validFormat: true,
        source: 'database',
        name: pass.fullName,
        address: '',
        currentLocation: '',
        province: '',
        phone: pass.phone || '',
        email: pass.email || ''
      });
    }
  }

  // 4. Validate real Angolan BI format & issuing province without fabricating personal data
  const biMatch = bi.match(/^(\d{9})([A-Z]{2})(\d{3})$/);
  if (biMatch) {
    const provCode = biMatch[2];
    const province = ANGOLA_BI_PROVINCES[provCode] || '';
    return res.json({
      found: false,
      validFormat: Boolean(province),
      province
    });
  }

  return res.json({ found: false, validFormat: false });
});

app.post('/api/passengers/register', (req, res) => {
  const {
    biNumber,
    name,
    address,
    currentLocation,
    latitude,
    longitude,
    phone,
    email
  } = req.body;

  if (!biNumber || !name || !address || !phone || !email) {
    return res.status(400).json({
      error: 'Preencha todos os campos obrigatórios: BI, Nome, Morada, Telefone e E-mail.'
    });
  }

  const db = dbService.getDb();
  const normalizedBi = String(biNumber).trim().toUpperCase();
  const normalizedEmail = String(email).trim().toLowerCase();

  const existing = db.users.find(
    u =>
      (u.email && u.email.toLowerCase() === normalizedEmail) ||
      (u.biNumber && u.biNumber.trim().toUpperCase() === normalizedBi)
  );

  if (existing && existing.role !== 'cliente') {
    return res.status(400).json({
      error: 'Este e-mail ou BI já está associado a uma conta de equipa. Utilize outros dados de passageiro.'
    });
  }

  if (existing) {
    existing.name = name.trim();
    existing.biNumber = normalizedBi;
    existing.address = address.trim();
    existing.phone = phone.trim();
    existing.email = email.trim();
    if (currentLocation) existing.locality = String(currentLocation).trim();
    if (latitude !== undefined) existing.latitude = latitude;
    if (longitude !== undefined) existing.longitude = longitude;
    existing.locationPermission = !!(latitude && longitude);
    existing.lastLoginAt = new Date().toISOString();
    existing.loginCount = (existing.loginCount || 0) + 1;

    dbService.commit();
    currentUserSession = existing;
    return res.json({
      user: existing,
      message: 'Cadastro de passageiro atualizado com sucesso!'
    });
  }

  const newPassenger: User = {
    id: `usr-${Date.now()}`,
    name: name.trim(),
    email: email.trim(),
    phone: phone.trim(),
    role: 'cliente',
    biNumber: normalizedBi,
    nationality: 'Angolana',
    address: address.trim(),
    province: 'Luanda',
    municipality: 'Luanda',
    locality: currentLocation ? String(currentLocation).trim() : '',
    latitude: latitude || undefined,
    longitude: longitude || undefined,
    locationPermission: !!(latitude && longitude),
    status: 'activo',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    loginCount: 1
  };

  db.users.push(newPassenger);
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    userId: newPassenger.id,
    title: 'Passageiro Cadastrado com Sucesso!',
    message: `Olá ${newPassenger.name}, o seu cadastro ferroviário com BI ${newPassenger.biNumber} foi concluído.`,
    type: 'sucesso',
    targetRole: 'cliente',
    createdAt: new Date().toISOString(),
    read: false
  });

  dbService.commit();
  currentUserSession = newPassenger;
  res.json({
    user: newPassenger,
    message: 'Passageiro cadastrado com sucesso!'
  });
});

app.put('/api/auth/profile', (req, res) => {
  if (!currentUserSession) {
    return res.status(401).json({ error: 'Inicie sessão ou cadastre-se como passageiro para atualizar o perfil.' });
  }
  const db = dbService.getDb();
  const user = db.users.find(u => u.id === currentUserSession!.id);
  if (!user) {
    return res.status(404).json({ error: 'Utilizador não encontrado.' });
  }

  const {
    name,
    phone,
    biNumber,
    birthDate,
    gender,
    nationality,
    address,
    province,
    municipality,
    locality,
    latitude,
    longitude,
    locationPermission
  } = req.body;

  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (biNumber !== undefined) user.biNumber = biNumber;
  if (birthDate !== undefined) user.birthDate = birthDate;
  if (gender !== undefined) user.gender = gender;
  if (nationality !== undefined) user.nationality = nationality;
  if (address !== undefined) user.address = address;
  if (province !== undefined) user.province = province;
  if (municipality !== undefined) user.municipality = municipality;
  if (locality !== undefined) user.locality = locality;
  if (latitude !== undefined) user.latitude = latitude;
  if (longitude !== undefined) user.longitude = longitude;
  if (locationPermission !== undefined) user.locationPermission = locationPermission;

  dbService.commit();
  currentUserSession = user;
  res.json({ user, message: 'Perfil atualizado com sucesso.' });
});

// ----------------------------------------------------
// TRIPS, STATIONS & SEARCH
// ----------------------------------------------------

app.get('/api/stations', (req, res) => {
  res.json(dbService.getDb().stations);
});

app.get('/api/routes', (req, res) => {
  res.json(dbService.getDb().routes);
});

app.post('/api/routes', (req, res) => {
  const db = dbService.getDb();
  const newRoute: Route = {
    id: `route-${Date.now()}`,
    ...req.body,
    active: true
  };
  db.routes.push(newRoute);
  dbService.commit();
  res.json(newRoute);
});

app.get('/api/trains', (req, res) => {
  res.json(dbService.getDb().trains);
});

app.get('/api/trips', (req, res) => {
  const { origin, destination, date, travelClass } = req.query;
  const db = dbService.getDb();
  let trips = [...db.trips];

  if (origin && typeof origin === 'string' && origin !== 'todos') {
    trips = trips.filter(t => t.originStation.toLowerCase().includes(origin.toLowerCase()));
  }

  if (destination && typeof destination === 'string' && destination !== 'todos') {
    trips = trips.filter(t => t.destinationStation.toLowerCase().includes(destination.toLowerCase()));
  }

  if (date && typeof date === 'string') {
    trips = trips.filter(t => t.departureDate === date);
  }

  res.json(trips);
});

app.get('/api/trips/:id', (req, res) => {
  const trip = dbService.getDb().trips.find(t => t.id === req.params.id);
  if (!trip) return res.status(404).json({ error: 'Viagem não encontrada.' });
  res.json(trip);
});

app.post('/api/trips', (req, res) => {
  const db = dbService.getDb();
  const newTrip: Trip = {
    id: `trip-${Date.now()}`,
    ...req.body,
    status: 'programada'
  };
  db.trips.push(newTrip);
  dbService.commit();
  res.json(newTrip);
});

app.put('/api/trips/:id', (req, res) => {
  const db = dbService.getDb();
  const idx = db.trips.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Viagem não encontrada.' });
  db.trips[idx] = { ...db.trips[idx], ...req.body };
  dbService.commit();
  res.json(db.trips[idx]);
});

app.delete('/api/trips/:id', (req, res) => {
  const db = dbService.getDb();
  const trip = db.trips.find(t => t.id === req.params.id);
  if (!trip) return res.status(404).json({ error: 'Viagem não encontrada.' });
  trip.status = 'cancelada';

  // Notify affected confirmed passengers in real time
  const affectedBookings = db.bookings.filter(
    b => b.tripId === trip.id && (b.paymentStatus === 'pagamento_confirmado' || b.paymentStatus === 'comprovativo_recebido')
  );
  for (const booking of affectedBookings) {
    const msg = `A sua viagem ${trip.trainName} (${trip.originStation} ➔ ${trip.destinationStation}) prevista para ${trip.departureDate} às ${trip.departureTime} foi cancelada pela administração. Aceda à sua conta para solicitar reembolso ou reagendamento.`;
    db.notifications.unshift({
      id: `notif-cancel-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: booking.userId,
      title: `Viagem Cancelada: ${trip.trainName}`,
      message: msg,
      type: 'urgente',
      targetRole: 'cliente',
      createdAt: new Date().toISOString(),
      read: false,
      actionUrl: `/minha-conta?tab=viagens`
    });
    dispatchAlert('email', booking.userEmail, msg, `[EKUMBI EXPRESS] Cancelamento da Viagem ${trip.trainName}`, { bookingCode: booking.bookingCode, tripId: trip.id });
    dispatchAlert('sms', booking.userPhone, `[EKUMBI EXPRESS] Viagem Cancelada: ${trip.trainName} (${trip.departureDate}). Consulte a sua conta para reembolso.`, undefined, { bookingCode: booking.bookingCode, tripId: trip.id });
  }

  db.auditLogs.unshift({
    id: `log-${Date.now()}`,
    adminId: currentUserSession?.id || 'admin',
    adminName: currentUserSession?.name || 'Administração EKUMBI',
    action: 'CANCELAMENTO_VIAGEM',
    targetType: 'viagem',
    targetId: trip.id,
    details: `Viagem ${trip.trainName} (${trip.departureDate}) cancelada. ${affectedBookings.length} passageiros notificados.`,
    timestamp: new Date().toISOString()
  });

  dbService.commit();
  res.json({ message: 'Viagem cancelada com sucesso e passageiros notificados.' });
});

// ----------------------------------------------------
// REAL-TIME TRAVEL STATUS NOTIFICATION SYSTEM
// Dispatches alerts via Email, SMS & App for delays, platform changes, boarding calls
// ----------------------------------------------------

app.post('/api/trips/:id/operational-alert', (req, res) => {
  const {
    alertType, // 'embarque' | 'atraso' | 'horario' | 'plataforma' | 'geral'
    title,
    message,
    newDepartureTime,
    delayMinutes,
    platformNumber,
    sendEmail,
    sendSms,
    sendWhatsapp
  } = req.body;

  const db = dbService.getDb();
  const trip = db.trips.find(t => t.id === req.params.id);
  if (!trip) return res.status(404).json({ error: 'Viagem não encontrada.' });

  // Update trip state if applicable
  if (alertType === 'atraso' && delayMinutes) {
    trip.status = 'programada';
    // Append delay note
    (trip as any).delayMinutes = delayMinutes;
  } else if (alertType === 'embarque') {
    (trip as any).boardingStatus = 'embarque_iniciado';
  } else if (alertType === 'horario' && newDepartureTime) {
    trip.departureTime = newDepartureTime;
  }
  if (platformNumber) {
    (trip as any).platformNumber = platformNumber;
  }

  // Find all passengers/bookings for this trip
  const affectedBookings = db.bookings.filter(b => b.tripId === trip.id && b.paymentStatus === 'pagamento_confirmado');

  const dispatchedAlerts: any[] = [];

  for (const booking of affectedBookings) {
    // 1. In-App Notification
    const notif: SystemNotification = {
      id: `notif-alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: booking.userId,
      title: title || `Alerta de Viagem: ${trip.trainName}`,
      message: `${message} (Reserva: ${booking.bookingCode} | ${trip.originStation} ➔ ${trip.destinationStation})`,
      type: alertType === 'atraso' ? 'aviso' : alertType === 'embarque' ? 'urgente' : 'info',
      targetRole: 'cliente',
      createdAt: new Date().toISOString(),
      read: false,
      actionUrl: `/minha-conta?tab=viagens`
    };
    db.notifications.unshift(notif);

    // 2. Email Notification simulation
    if (sendEmail !== false) {
      const emailRecord = dispatchAlert(
        'email',
        booking.userEmail,
        `Prezado(a) ${booking.userFullName},\n\n${message}\n\nDetalhes da Viagem:\nComboio: ${trip.trainName}\nPercurso: ${trip.originStation} ➔ ${trip.destinationStation}\nData: ${trip.departureDate}\nPartida Atualizada: ${trip.departureTime}\nPlataforma: ${platformNumber || 'Plataforma 1'}\n\nEKUMBI EXPRESS - Um novo horizonte em cada viagem.`,
        `[EKUMBI EXPRESS] ${title || 'Atualização Importante da Sua Viagem'}`,
        { bookingCode: booking.bookingCode, tripId: trip.id }
      );
      dispatchedAlerts.push(emailRecord);
    }

    // 3. SMS Notification simulation
    if (sendSms) {
      const smsRecord = dispatchAlert(
        'sms',
        booking.userPhone,
        `[EKUMBI EXPRESS] ${title}: ${message}. Comboio ${trip.trainName}. Saída: ${trip.departureDate} às ${trip.departureTime}. Plataforma: ${platformNumber || '1'}.`,
        undefined,
        { bookingCode: booking.bookingCode, tripId: trip.id }
      );
      dispatchedAlerts.push(smsRecord);
    }

    // 4. WhatsApp alert
    if (sendWhatsapp) {
      const waRecord = dispatchAlert(
        'whatsapp',
        booking.userPhone,
        `🚄 *EKUMBI EXPRESS - ATUALIZAÇÃO DA SUA VIAGEM*\n\nOlá ${booking.userFullName}!\n\n${message}\n\n*Reserva:* ${booking.bookingCode}\n*Comboio:* ${trip.trainName}\n*Partida:* ${trip.departureDate} às ${trip.departureTime}\n*Plataforma:* ${platformNumber || 'Plataforma 1'}\n\nTenha uma excelente viagem com a EKUMBI EXPRESS!`,
        undefined,
        { bookingCode: booking.bookingCode, tripId: trip.id }
      );
      dispatchedAlerts.push(waRecord);
    }
  }

  // Audit log
  db.auditLogs.unshift({
    id: `log-${Date.now()}`,
    adminId: currentUserSession?.id || 'admin',
    adminName: currentUserSession?.name || 'Administração EKUMBI',
    action: 'DISPARO_ALERTA_VIAGEM',
    targetType: 'viagem',
    targetId: trip.id,
    details: `Alerta "${title}" disparado para ${affectedBookings.length} passageiros confirmados. Tipo: ${alertType}.`,
    timestamp: new Date().toISOString()
  });

  dbService.commit();

  res.json({
    success: true,
    message: `Alerta disparado com sucesso para ${affectedBookings.length} passageiros da viagem ${trip.trainName}.`,
    affectedCount: affectedBookings.length,
    dispatchedAlerts
  });
});

// ----------------------------------------------------
// SEATS & AVAILABILITY
// ----------------------------------------------------

app.get('/api/trips/:id/seats', (req, res) => {
  const seats = dbService.getSeatsForTrip(req.params.id);
  res.json(seats);
});

// ----------------------------------------------------
// BOOKINGS & RESERVATIONS
// ----------------------------------------------------

app.post('/api/bookings', (req, res) => {
  if (!currentUserSession) {
    return res.status(401).json({
      error: 'Apenas passageiros cadastrados podem reservar viagens e comprar bilhetes.'
    });
  }

  const {
    tripId,
    travelClass,
    passengers,
    paymentMethod
  } = req.body;

  const db = dbService.getDb();
  const trip = db.trips.find(t => t.id === tripId);
  if (!trip) return res.status(404).json({ error: 'Viagem não encontrada.' });

  const totalAmount = passengers.reduce((sum: number, p: any) => sum + (p.price || trip.prices[travelClass as 'turistica'] || 8500), 0);

  const bookingCode = generateBookingCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15-minute temporary hold

  const primaryPassenger = passengers[0] || {};
  const guestUserId = currentUserSession?.id || `guest-${Date.now()}`;
  const bookingName = currentUserSession?.name || primaryPassenger.fullName || 'Passageiro EKUMBI';
  const bookingEmail = currentUserSession?.email || primaryPassenger.email || 'passageiro@ekumbi.ao';
  const bookingPhone = currentUserSession?.phone || primaryPassenger.phone || '+244 900 000 000';

  const newBooking: Booking = {
    id: `book-${Date.now()}`,
    bookingCode,
    userId: guestUserId,
    userFullName: bookingName,
    userEmail: bookingEmail,
    userPhone: bookingPhone,
    tripId: trip.id,
    tripName: trip.trainName,
    originStation: trip.originStation,
    destinationStation: trip.destinationStation,
    travelDate: trip.departureDate,
    departureTime: trip.departureTime,
    arrivalTime: trip.arrivalTime,
    trainName: trip.trainName,
    travelClass,
    passengers: passengers.map((p: any, idx: number) => ({
      id: `pass-${Date.now()}-${idx}`,
      fullName: p.fullName || bookingName,
      biNumber: p.biNumber || currentUserSession?.biNumber || '000000000LA000',
      phone: p.phone || bookingPhone,
      email: p.email || bookingEmail,
      seatNumber: p.seatNumber,
      carriageNumber: p.carriageNumber,
      travelClass,
      price: p.price || trip.prices[travelClass as 'turistica'] || 8500
    })),
    totalAmount,
    paymentMethod: paymentMethod || 'transferencia_bancaria',
    paymentStatus: 'aguardando_pagamento',
    createdAt: new Date().toISOString(),
    expiresAt
  };

  db.bookings.unshift(newBooking);

  // In-app notification for booking creation
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    userId: guestUserId,
    title: 'Reserva Efetuada com Sucesso!',
    message: `A sua reserva ${bookingCode} para ${trip.destinationStation} foi registada. Efetue o pagamento em até 15 minutos para garantir o seu assento.`,
    type: 'info',
    targetRole: 'cliente',
    createdAt: new Date().toISOString(),
    read: false,
    actionUrl: `/pagamento/${newBooking.id}`
  });

  dbService.commit();
  res.json(newBooking);
});

app.get('/api/bookings/my', (req, res) => {
  if (!currentUserSession) {
    return res.json([]);
  }
  const db = dbService.getDb();
  const bookings = db.bookings.filter(b => b.userId === currentUserSession!.id);
  res.json(bookings);
});

app.get('/api/bookings/:id', (req, res) => {
  const db = dbService.getDb();
  const booking = db.bookings.find(b => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: 'Reserva não encontrada.' });
  res.json(booking);
});

app.post('/api/bookings/:id/cancel-request', (req, res) => {
  const { reason } = req.body;
  const db = dbService.getDb();
  const booking = db.bookings.find(b => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: 'Reserva não encontrada.' });

  booking.refundStatus = 'em_analise';
  booking.cancellationReason = reason || 'Solicitado pelo cliente';
  booking.cancelledAt = new Date().toISOString();

  // Notify admin
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    title: 'Novo Pedido de Cancelamento / Reembolso',
    message: `O cliente ${booking.userFullName} solicitou cancelamento da reserva ${booking.bookingCode}. Motivo: ${reason}`,
    type: 'aviso',
    targetRole: 'admin',
    createdAt: new Date().toISOString(),
    read: false
  });

  dbService.commit();
  res.json({ message: 'Pedido de cancelamento enviado para análise administrativa.' });
});

// ----------------------------------------------------
// PAYMENTS & RECEIPT UPLOADS (OCR & WHATSAPP)
// ----------------------------------------------------

// Process direct credit/debit card payment
app.post('/api/payments/card', (req, res) => {
  if (!currentUserSession) {
    return res.status(401).json({
      error: 'Apenas passageiros cadastrados podem comprar bilhetes.'
    });
  }
  const { bookingId, cardHolder, last4, expDate } = req.body;
  const db = dbService.getDb();
  const booking = db.bookings.find(b => b.id === bookingId);
  if (!booking) return res.status(404).json({ error: 'Reserva não encontrada.' });

  booking.paymentStatus = 'pagamento_confirmado';
  booking.paymentReference = `CARD-${Date.now()}-${last4 || 'MCX'}`;

  // Issue digital tickets immediately
  const issuedTickets: Ticket[] = [];
  for (const passenger of booking.passengers) {
    const numericCode = generate10DigitCode();
    const qrToken = `EKUMBI:TKT:${numericCode}:${booking.bookingCode}`;

    const newTicket: Ticket = {
      id: `tkt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      bookingId: booking.id,
      passengerId: passenger.id,
      numericCode,
      qrToken,
      passengerName: passenger.fullName,
      passengerBi: passenger.biNumber,
      tripId: booking.tripId,
      trainName: booking.trainName,
      originStation: booking.originStation,
      destinationStation: booking.destinationStation,
      travelDate: booking.travelDate,
      departureTime: booking.departureTime,
      arrivalTime: booking.arrivalTime,
      carriageNumber: passenger.carriageNumber,
      seatNumber: passenger.seatNumber,
      travelClass: passenger.travelClass,
      amountPaid: passenger.price,
      status: 'valido',
      issuedAt: new Date().toISOString()
    };

    db.tickets.push(newTicket);
    issuedTickets.push(newTicket);
  }

  // Audit log
  db.auditLogs.unshift({
    id: `log-${Date.now()}`,
    adminId: 'SYSTEM',
    adminName: 'Gateway de Pagamento Automatizado',
    action: 'CONFIRMACAO_CARTAO',
    targetType: 'pagamento',
    targetId: booking.id,
    details: `Pagamento com cartão (final ${last4}) confirmado. ${issuedTickets.length} bilhetes emitidos.`,
    timestamp: new Date().toISOString()
  });

  // Client notification
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    userId: booking.userId,
    title: 'Pagamento Confirmado - Bilhete Emitido!',
    message: `O pagamento da reserva ${booking.bookingCode} foi confirmado. Os seus bilhetes estão disponíveis para download.`,
    type: 'sucesso',
    targetRole: 'cliente',
    createdAt: new Date().toISOString(),
    read: false,
    actionUrl: `/minha-conta?tab=bilhetes`
  });

  dbService.commit();
  res.json({ success: true, booking, tickets: issuedTickets });
});

// Upload bank deposit/transfer receipt with AI OCR and WhatsApp notification
app.post('/api/payments/receipt', async (req, res) => {
  if (!currentUserSession) {
    return res.status(401).json({
      error: 'Apenas passageiros cadastrados podem efetuar pagamentos e comprar bilhetes.'
    });
  }
  const { bookingId, fileName, fileData, fileSize, mimeType } = req.body;
  const db = dbService.getDb();
  const booking = db.bookings.find(b => b.id === bookingId);
  if (!booking) return res.status(404).json({ error: 'Reserva não encontrada.' });

  // 1. Analyze document using Gemini AI OCR
  const analysis = await analyzePaymentReceipt(
    fileData || fileName,
    booking.totalAmount,
    booking.bookingCode,
    booking.userFullName
  );

  // 2. Register receipt record
  const receiptRecord = {
    id: `rec-${Date.now()}`,
    bookingId: booking.id,
    userId: booking.userId,
    fileName: fileName || 'comprovativo_pagamento.pdf',
    fileUrl: fileData ? fileData.slice(0, 200) + '...' : '/uploads/receipt.pdf',
    fileSize: fileSize || 245000,
    mimeType: mimeType || 'application/pdf',
    uploadedAt: new Date().toISOString(),
    analysis,
    status: 'comprovativo_recebido' as const
  };

  db.receipts.unshift(receiptRecord);
  booking.paymentStatus = 'comprovativo_recebido';

  // 3. Format mandatory WhatsApp Notification message for +244 922 050 257
  const primaryPassenger = booking.passengers[0];
  const whatsAppMessage = `EKUMBI EXPRESS – NOVA SOLICITAÇÃO DE PAGAMENTO

Recebemos uma nova solicitação de confirmação de pagamento.

Nome do cliente: ${booking.userFullName}
Contacto: ${booking.userPhone}
Código da reserva: ${booking.bookingCode}
Origem: ${booking.originStation}
Destino: ${booking.destinationStation}
Data da viagem: ${booking.travelDate}
Carruagem: ${primaryPassenger?.carriageNumber || 1}
Assento: ${primaryPassenger?.seatNumber || '01'}
Valor: ${booking.totalAmount.toLocaleString('pt-AO')} Kz
Estado: AGUARDANDO VALIDAÇÃO.

Aceda ao painel administrativo para analisar o comprovativo e confirmar ou rejeitar o pagamento.`;

  const waRecord = dispatchAlert(
    'whatsapp',
    '+244 922 050 257',
    whatsAppMessage,
    'EKUMBI EXPRESS – NOVA SOLICITAÇÃO DE PAGAMENTO',
    { bookingId: booking.id, bookingCode: booking.bookingCode, receiptId: receiptRecord.id }
  );

  // 4. Notify admin in-app
  db.notifications.unshift({
    id: `notif-admin-${Date.now()}`,
    title: 'Novo Comprovativo de Pagamento',
    message: `Reserva ${booking.bookingCode} (${booking.userFullName}) - Valor: ${booking.totalAmount.toLocaleString('pt-AO')} Kz. Notificação WhatsApp despachada para +244 922 050 257.`,
    type: 'aviso',
    targetRole: 'admin',
    createdAt: new Date().toISOString(),
    read: false,
    actionUrl: `/admin/pagamentos`
  });

  // 5. Notify customer
  db.notifications.unshift({
    id: `notif-cust-${Date.now()}`,
    userId: booking.userId,
    title: 'Comprovativo Recebido com Sucesso',
    message: 'Recebemos o seu comprovativo bancário. A nossa equipa financeira está a analisar a operação.',
    type: 'info',
    targetRole: 'cliente',
    createdAt: new Date().toISOString(),
    read: false
  });

  dbService.commit();

  res.json({
    success: true,
    message: 'Comprovativo recebido e analisado com sucesso.',
    receipt: receiptRecord,
    whatsAppNotification: {
      destination: '+244 922 050 257',
      status: waRecord.status,
      text: whatsAppMessage,
      whatsappDirectLink: `https://wa.me/244922050257?text=${encodeURIComponent(whatsAppMessage)}`
    }
  });
});

// Admin approval of payment
app.post('/api/payments/:bookingId/approve', (req, res) => {
  const db = dbService.getDb();
  const booking = db.bookings.find(b => b.id === req.params.bookingId);
  if (!booking) return res.status(404).json({ error: 'Reserva não encontrada.' });

  booking.paymentStatus = 'pagamento_confirmado';

  // Update receipt if present
  const receipt = db.receipts.find(r => r.bookingId === booking.id);
  if (receipt) {
    receipt.status = 'pagamento_confirmado';
    receipt.reviewedByAdminId = currentUserSession?.id || 'admin';
    receipt.reviewedAt = new Date().toISOString();
  }

  // Issue digital tickets
  const issuedTickets: Ticket[] = [];
  for (const passenger of booking.passengers) {
    const numericCode = generate10DigitCode();
    const qrToken = `EKUMBI:TKT:${numericCode}:${booking.bookingCode}`;

    const newTicket: Ticket = {
      id: `tkt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      bookingId: booking.id,
      passengerId: passenger.id,
      numericCode,
      qrToken,
      passengerName: passenger.fullName,
      passengerBi: passenger.biNumber,
      tripId: booking.tripId,
      trainName: booking.trainName,
      originStation: booking.originStation,
      destinationStation: booking.destinationStation,
      travelDate: booking.travelDate,
      departureTime: booking.departureTime,
      arrivalTime: booking.arrivalTime,
      carriageNumber: passenger.carriageNumber,
      seatNumber: passenger.seatNumber,
      travelClass: passenger.travelClass,
      amountPaid: passenger.price,
      status: 'valido',
      issuedAt: new Date().toISOString()
    };

    db.tickets.push(newTicket);
    issuedTickets.push(newTicket);
  }

  // Audit log
  db.auditLogs.unshift({
    id: `log-${Date.now()}`,
    adminId: currentUserSession?.id || 'admin',
    adminName: currentUserSession?.name || 'Administração EKUMBI',
    action: 'APROVACAO_COMPROVATIVO',
    targetType: 'pagamento',
    targetId: booking.id,
    details: `Pagamento validado pelo administrador ${currentUserSession?.name || 'Administração EKUMBI'}. ${issuedTickets.length} bilhetes emitidos.`,
    timestamp: new Date().toISOString()
  });

  // Client notification (In-App + Email + SMS)
  const confirmMsg = `A sua transferência para a reserva ${booking.bookingCode} foi validada. O bilhete está pronto para descarregar em PDF ou imagem.`;
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    userId: booking.userId,
    title: 'Pagamento Aprovado e Bilhete Emitido!',
    message: confirmMsg,
    type: 'sucesso',
    targetRole: 'cliente',
    createdAt: new Date().toISOString(),
    read: false,
    actionUrl: `/minha-conta?tab=bilhetes`
  });

  dispatchAlert('email', booking.userEmail, confirmMsg, `[EKUMBI EXPRESS] Bilhete Emitido - Reserva ${booking.bookingCode}`, { bookingCode: booking.bookingCode });
  dispatchAlert('sms', booking.userPhone, `[EKUMBI EXPRESS] Pagamento confirmado para reserva ${booking.bookingCode}. O seu bilhete já está disponível na sua conta.`, undefined, { bookingCode: booking.bookingCode });

  dbService.commit();
  res.json({ success: true, booking, tickets: issuedTickets });
});

// Admin rejection of payment
app.post('/api/payments/:bookingId/reject', (req, res) => {
  const { reason } = req.body;
  const db = dbService.getDb();
  const booking = db.bookings.find(b => b.id === req.params.bookingId);
  if (!booking) return res.status(404).json({ error: 'Reserva não encontrada.' });

  booking.paymentStatus = 'pagamento_rejeitado';

  const receipt = db.receipts.find(r => r.bookingId === booking.id);
  if (receipt) {
    receipt.status = 'pagamento_rejeitado';
    receipt.reviewedByAdminId = currentUserSession?.id || 'admin';
    receipt.reviewedAt = new Date().toISOString();
    receipt.rejectionReason = reason || 'Comprovativo não reconhecido ou valor divergente.';
  }

  // Audit log
  db.auditLogs.unshift({
    id: `log-${Date.now()}`,
    adminId: currentUserSession?.id || 'admin',
    adminName: currentUserSession?.name || 'Administração EKUMBI',
    action: 'REJEICAO_PAGAMENTO',
    targetType: 'pagamento',
    targetId: booking.id,
    details: `Pagamento rejeitado pelo administrador. Motivo: ${reason || 'Comprovativo não reconhecido ou valor divergente.'}`,
    timestamp: new Date().toISOString()
  });

  // Client notification (In-App + Email + SMS)
  const rejectMsg = `O comprovativo da reserva ${booking.bookingCode} foi rejeitado. Motivo: ${reason || 'Valor não localizado no extracto bancário.'}. Por favor tente novamente.`;
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    userId: booking.userId,
    title: 'Comprovativo Rejeitado',
    message: rejectMsg,
    type: 'aviso',
    targetRole: 'cliente',
    createdAt: new Date().toISOString(),
    read: false,
    actionUrl: `/pagamento/${booking.id}`
  });

  dispatchAlert('email', booking.userEmail, rejectMsg, `[EKUMBI EXPRESS] Comprovativo Rejeitado - Reserva ${booking.bookingCode}`, { bookingCode: booking.bookingCode });
  dispatchAlert('sms', booking.userPhone, `[EKUMBI EXPRESS] Comprovativo rejeitado para reserva ${booking.bookingCode}. Motivo: ${reason || 'Verifique na sua conta'}.`, undefined, { bookingCode: booking.bookingCode });

  dbService.commit();
  res.json({ success: true, booking });
});

// ----------------------------------------------------
// TICKETS & BOARDING VALIDATION
// ----------------------------------------------------

app.get('/api/tickets/my', (req, res) => {
  if (!currentUserSession) {
    return res.json([]);
  }
  const db = dbService.getDb();
  const userBookings = db.bookings.filter(b => b.userId === currentUserSession!.id).map(b => b.id);
  const tickets = db.tickets.filter(t => userBookings.includes(t.bookingId));
  res.json(tickets);
});

app.get('/api/tickets/:id', (req, res) => {
  const ticket = dbService.getDb().tickets.find(t => t.id === req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Bilhete não encontrado.' });
  res.json(ticket);
});

app.get('/api/tickets/code/:numericCode', (req, res) => {
  const ticket = dbService.getDb().tickets.find(t => t.numericCode === req.params.numericCode);
  if (!ticket) return res.status(404).json({ error: 'Bilhete não encontrado.' });
  res.json(ticket);
});

// Atomic Boarding Validation Endpoint (for station staff / fiscais de bordo)
app.post('/api/tickets/validate', (req, res) => {
  const { codeOrQr } = req.body;
  if (!codeOrQr) {
    return res.status(400).json({ error: 'Código numérico de 10 dígitos ou QR Code é obrigatório.' });
  }

  const db = dbService.getDb();
  const clean = codeOrQr.trim();

  // Search by exact 10-digit numeric code or by QR token
  const ticket = db.tickets.find(t => t.numericCode === clean || t.qrToken === clean || (clean.startsWith('EKUMBI:TKT:') && clean.includes(t.numericCode)));

  if (!ticket) {
    return res.json({
      valid: false,
      status: 'inexistente',
      message: 'PASSAGEM NÃO ENCONTRADA.',
      details: 'O código informado não corresponde a nenhum bilhete emitido pelo EKUMBI EXPRESS.'
    });
  }

  if (ticket.status === 'cancelado') {
    return res.json({
      valid: false,
      status: 'cancelado',
      message: 'PASSAGEM CANCELADA.',
      details: 'Este bilhete foi cancelado e não confere direito a embarque.',
      ticket
    });
  }

  if (ticket.status === 'utilizado') {
    return res.json({
      valid: false,
      status: 'utilizado',
      message: 'PASSAGEM JÁ UTILIZADA.',
      details: `Este bilhete já foi validado em ${ticket.usedAt ? new Date(ticket.usedAt).toLocaleString('pt-AO') : 'data anterior'}. Embarque recusado para evitar duplicação.`,
      ticket
    });
  }

  // ATOMIC VALIDATION: Mark as used
  ticket.status = 'utilizado';
  ticket.usedAt = new Date().toISOString();
  ticket.validatedBy = currentUserSession?.name || 'Administrador EKUMBI';

  // Log validation in audit
  db.auditLogs.unshift({
    id: `log-${Date.now()}`,
    adminId: currentUserSession?.id || 'admin',
    adminName: currentUserSession?.name || 'Administrador EKUMBI',
    action: 'VALIDACAO_EMBARQUE',
    targetType: 'bilhete',
    targetId: ticket.id,
    details: `Passageiro: ${ticket.passengerName} (BI: ${ticket.passengerBi}) | Assento: Carruagem ${ticket.carriageNumber}, Lugar ${ticket.seatNumber} | Código: ${ticket.numericCode}`,
    timestamp: new Date().toISOString()
  });

  dbService.commit();

  return res.json({
    valid: true,
    status: 'valido',
    message: 'PASSAGEM VÁLIDA – EMBARQUE AUTORIZADO.',
    details: 'Validação concluída com sucesso. Embarque autorizado.',
    ticket
  });
});

// ----------------------------------------------------
// NOTIFICATIONS & TOURISM
// ----------------------------------------------------

app.get('/api/notifications/my', (req, res) => {
  const db = dbService.getDb();
  const notifs = currentUserSession
    ? db.notifications.filter(
        n => !n.userId || n.userId === currentUserSession!.id || (n.targetRole && n.targetRole === currentUserSession!.role)
      )
    : db.notifications.filter(n => !n.userId && (!n.targetRole || n.targetRole === 'cliente'));
  res.json(notifs);
});

app.post('/api/notifications/:id/read', (req, res) => {
  const db = dbService.getDb();
  const notif = db.notifications.find(n => n.id === req.params.id);
  if (notif) notif.read = true;
  dbService.commit();
  res.json({ success: true });
});

app.post('/api/notifications/mark-all-read', (req, res) => {
  const db = dbService.getDb();
  for (const notif of db.notifications) {
    const matches = currentUserSession
      ? !notif.userId || notif.userId === currentUserSession.id || (notif.targetRole && notif.targetRole === currentUserSession.role)
      : !notif.userId && (!notif.targetRole || notif.targetRole === 'cliente');
    if (matches) {
      notif.read = true;
    }
  }
  dbService.commit();
  res.json({ success: true });
});

app.get('/api/tourism', (req, res) => {
  res.json(dbService.getDb().touristDestinations);
});

// ----------------------------------------------------
// ADMIN DASHBOARD & MANAGEMENT
// ----------------------------------------------------

app.get('/api/admin/stats', (req, res) => {
  res.json(dbService.getAdminStats());
});

app.get('/api/admin/bookings', (req, res) => {
  const db = dbService.getDb();
  const enriched = db.bookings.map(b => ({
    ...b,
    receipt: db.receipts.find(r => r.bookingId === b.id) || null
  }));
  res.json(enriched);
});

app.get('/api/admin/tickets', (req, res) => {
  res.json(dbService.getDb().tickets);
});

app.post('/api/admin/tickets/:id/cancel', (req, res) => {
  const { reason } = req.body;
  const db = dbService.getDb();
  const ticket = db.tickets.find(t => t.id === req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Bilhete não encontrado.' });

  ticket.status = 'cancelado';
  db.auditLogs.unshift({
    id: `log-${Date.now()}`,
    adminId: currentUserSession?.id || 'admin',
    adminName: currentUserSession?.name || 'Administração EKUMBI',
    action: 'CANCELAMENTO_BILHETE',
    targetType: 'bilhete',
    targetId: ticket.id,
    details: `Bilhete ${ticket.numericCode} (${ticket.passengerName}) cancelado. Motivo: ${reason || 'Solicitação administrativa'}.`,
    timestamp: new Date().toISOString()
  });

  dbService.commit();
  res.json({ success: true, ticket });
});

app.post('/api/admin/bookings/:id/refund-decision', (req, res) => {
  const { decision, refundAmount, notes } = req.body; // 'aprovado' | 'rejeitado'
  const db = dbService.getDb();
  const booking = db.bookings.find(b => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: 'Reserva não encontrada.' });

  booking.refundStatus = decision;
  if (decision === 'aprovado') {
    booking.paymentStatus = 'reembolso';
    booking.refundAmount = typeof refundAmount === 'number' ? refundAmount : booking.totalAmount;
    // Cancel tickets to release seats
    for (const t of db.tickets) {
      if (t.bookingId === booking.id) {
        t.status = 'cancelado';
      }
    }
  }

  db.auditLogs.unshift({
    id: `log-${Date.now()}`,
    adminId: currentUserSession?.id || 'admin',
    adminName: currentUserSession?.name || 'Administração EKUMBI',
    action: decision === 'aprovado' ? 'APROVACAO_REEMBOLSO' : 'REJEICAO_REEMBOLSO',
    targetType: 'reembolso',
    targetId: booking.id,
    details: `Pedido de cancelamento/reembolso da reserva ${booking.bookingCode} ${decision}. ${notes || ''}`,
    timestamp: new Date().toISOString()
  });

  const msg = decision === 'aprovado'
    ? `O seu pedido de cancelamento e reembolso para a reserva ${booking.bookingCode} foi aprovado (Valor: ${(booking.refundAmount || booking.totalAmount).toLocaleString('pt-AO')} Kz). Os assentos foram libertados.`
    : `O seu pedido de cancelamento para a reserva ${booking.bookingCode} não pôde ser aprovado. ${notes || ''}`;

  db.notifications.unshift({
    id: `notif-ref-${Date.now()}`,
    userId: booking.userId,
    title: decision === 'aprovado' ? 'Cancelamento e Reembolso Aprovados' : 'Pedido de Cancelamento Rejeitado',
    message: msg,
    type: decision === 'aprovado' ? 'info' : 'aviso',
    targetRole: 'cliente',
    createdAt: new Date().toISOString(),
    read: false
  });

  dispatchAlert('email', booking.userEmail, msg, `[EKUMBI EXPRESS] Atualização de Reembolso - ${booking.bookingCode}`, { bookingCode: booking.bookingCode });

  dbService.commit();
  res.json({ success: true, booking });
});

app.get('/api/admin/clients', (req, res) => {
  const clients = dbService.getDb().users.filter(u => u.role === 'cliente');
  res.json(clients);
});

app.put('/api/admin/clients/:id/status', (req, res) => {
  const { status } = req.body;
  const db = dbService.getDb();
  const client = db.users.find(u => u.id === req.params.id);
  if (!client) return res.status(404).json({ error: 'Cliente não encontrado.' });
  client.status = status;
  dbService.commit();
  res.json(client);
});

app.get('/api/admin/audit-logs', (req, res) => {
  res.json(dbService.getDb().auditLogs);
});

app.get('/api/admin/communication-logs', (req, res) => {
  res.json(communicationLogs);
});

// ----------------------------------------------------
// VITE INTEGRATION FOR DEV / STATIC SERVE FOR PROD
// ----------------------------------------------------

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚂 EKUMBI EXPRESS server running on port ${PORT} (dev mode: ${isDev})`);
  });
}

startServer().catch(err => {
  console.error('Failed to start EKUMBI EXPRESS server:', err);
});
