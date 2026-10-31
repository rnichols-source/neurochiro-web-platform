export type SetupFields = {
  photo: boolean;
  bio: boolean;
  address: boolean;
  services: boolean;
  slug: string | null;
};

export type AttentionItem = {
  id: string;
  title: string;
  detail: string;
  phone?: string | null;
  kind: 'request' | 'message' | 'lead';
  href?: string;
};
