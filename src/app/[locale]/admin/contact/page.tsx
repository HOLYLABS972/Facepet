import { redirect } from 'next/navigation';

export default async function ContactPage() {
  // Redirect to the new settings page
  redirect('/admin/settings');
}
