import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: 'client' | 'attorney' | 'org_admin' | 'staff' | 'super_admin';
      organizationId: string;
      organizationName?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    role: 'client' | 'attorney' | 'org_admin' | 'staff' | 'super_admin';
    organizationId: string;
    organizationName?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: 'client' | 'attorney' | 'org_admin' | 'staff' | 'super_admin';
    organizationId: string;
    organizationName?: string;
  }
}
