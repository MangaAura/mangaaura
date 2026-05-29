import { redirect } from 'next/navigation';

export default async function ConversationPage() {
  redirect('/messages');
}
