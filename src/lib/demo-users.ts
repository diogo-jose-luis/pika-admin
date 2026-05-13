/** Contas de demonstração — apenas para ambiente de demo. */
export const DEMO_ADMIN_USERS: { email: string; password: string }[] = [
  { email: "diogo.luis@equalizador.ao", password: "123456" },
  { email: "rogerio.seca@pika.ao", password: "123456" },
  { email: "ednilson.araujo@pika.ao", password: "123456" },
  { email: "benjamim.uquino@equalizador.ao", password: "123456" },
];

export function isDemoLoginValid(email: string, password: string): boolean {
  const e = email.trim().toLowerCase();
  return DEMO_ADMIN_USERS.some(
    (u) => u.email.toLowerCase() === e && u.password === password,
  );
}
