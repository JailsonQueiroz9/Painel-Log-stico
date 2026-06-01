
export enum AWBStatus {
  EM_TRANSITO = 'EM TRÂNSITO',
  DISPONIVEL = 'DISPONIVEL',
  ENTREGUE = 'ENTREGUE',
  ATRASADO = 'ATRASADO',
  AGUARDANDO_AWB = 'AGUARDANDO AWB',
  COLETA_ERRADA = 'COLETA ERRADA',
  OK = 'OK'
}

export type ViewType = 'dashboard' | 'reports' | 'chat' | 'settings' | 'follow-up' | 'follow-up-pre' | 'history' | 'users' | 'gmail';

export interface FilterState {
  statuses: AWBStatus[];
  period: 'hoje' | 'semana' | 'mes' | 'todos';
}

export interface ChatMessage {
  id: string;
  user: string;
  text: string;
  img?: string;
  timestamp: string;
  type: 'text' | 'image';
  edited?: boolean;
}

export interface ChatGroup {
  id?: string;
  name: string;
  sheetName: string;
  type: 'group' | 'dm' | 'google-chat';
  unreadCount: number;
  lastReadCount: number;
  members: string[];
}

export interface GroupCreatePayload {
  name: string;
  members: string[];
}

export interface AWBRecord {
  id: string;
  ID: string;
  fornecedor: string;
  saida: string;
  nfs: string;
  awbNumber: string;
  status: AWBStatus;
  chegada: string;
  marca: string;
  material: string;
  observacao: string;
  rastreio: string;
  documentos: string;
  
  Fornecedor?: string;
  Saída?: string;
  "NF's"?: string;
  AWB?: string;
  Status?: AWBStatus;
  Chegada?: string;
  Marca?: string;
  Material?: string;
  Observação?: string;
  Rastreio?: string;
  Documentos?: string;

  "Previsão Agend."?: string;
  "Link Agendamento"?: string;

  [key: string]: any;
}

export interface User {
  id: string;
  ID?: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'ativo' | 'inativo';
  allowedViews: ViewType[];
  profileImage?: string;
  cargo?: string;
  USUÁRIO?: string;
  "E-MAIL"?: string;
  SENHA?: string;
  senha?: string;
  PAPEL?: string;
  STATUS?: string;
  bio?: string;
  location?: string;
  birthday?: string;
  Bio?: string;
  Location?: string;
  Birthday?: string;
  Cargo?: string;
}
