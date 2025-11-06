export type Transaction = {
  id: number;
  qty: number;
  itemId: number;
  setId?: number | null;
  setName?: string | null;
  item: {
    id: number;
    name: string | null;
    brand: string | null;
    model: string | null;
    typology: string | null;
  };
};

export type ProductionCheckout = {
  id: number;
  productionName: string;
  name: string;
  surname: string;
  ente: string;
  email: string;
  telephone: string;
  pickupDate: Date | string;
  status: "OPEN" | "CLOSED";
  restitutionDate: Date | string;
  techPerson: string | null;
  type: string;
  createdAt: Date | string;
  transactions: Array<{
    id: number;
    qty: number;
    item: {
      id: number;
      name: string | null;
      brand: string | null;
      model: string | null;
      quantity: number;
    };
  }>;
  user?: {
    id: number;
    username: string;
    name: string | null;
  } | null;
};