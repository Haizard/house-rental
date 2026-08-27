declare module "web-push" {
  export function setVapidDetails(email: string, publicKey: string, privateKey: string): void;
  export function sendNotification(subscription: { endpoint: string; keys: { p256dh: string; auth: string } }, payload: string): Promise<void>;
}
