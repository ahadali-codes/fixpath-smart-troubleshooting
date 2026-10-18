export interface User {
  id: string;
  name: string;
  email: string;
  is_admin: boolean;
}
export interface Problem {
  id: string;
  title: string;
  description: string;
}
export interface Device {
  id: string;
  label: string;
  problems: Problem[];
}
export interface Node {
  id: string;
  key: string;
  question: string;
  explanation: string;
  safety: string;
  component: string;
  terminal: boolean;
  result: string;
  recommendation: string;
  options: string[];
  answer?: string;
  answered_at?: string;
}
export interface RepairCase {
  id: string;
  title: string;
  symptoms: string;
  status: string;
  version: number;
  device: string;
  problem: string;
  problem_id: string;
  created_at: string;
  updated_at: string;
  current: Node;
  path: Node[];
  events: { id: number; kind: string; text: string; created_at: string }[];
  notes: { id: string; text: string; created_at: string }[];
  graph: {
    nodes: Node[];
    edges: { from: string; to: string; answer: string }[];
  };
}
export interface CommunityCase {
  id: string;
  title: string;
  device: string;
  symptoms: string;
  fixes: string;
  outcome: string;
  resolved: boolean;
  sample: boolean;
  helpful: number;
  created_at: string;
  mine?: boolean;
  hidden?: boolean;
}
export interface Cost {
  id: string;
  repair: string;
  extra: string;
  total_repair: string;
  replacement: string;
  difference: string;
  age: string;
  warranty: string;
  session_id: string | null;
  created_at: string;
}
