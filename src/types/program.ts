export interface Program {
  id: string;
  org_id : string;
  title : string;
  description : string;
  start_date : string;
  end_date : string;
  status : 'draft' | 'open' | 'closed';
  created_at : string;
  updated_at : string;
}
export interface CreateProgramData {
  title: string
  description?: string
  start_date: string
  end_date: string
  status?: 'draft' | 'open' | 'closed'
}
export interface UpdateProgramData extends Partial<CreateProgramData>{id : string}