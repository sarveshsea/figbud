export interface Migration {
  version: number;
  name: string;
  up: (db: any) => Promise<void>;
  down?: (db: any) => Promise<void>;
}