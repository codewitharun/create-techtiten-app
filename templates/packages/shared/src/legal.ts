// Play Store pages: privacy policy, terms, account deletion, support.
// The phone app (Settings -> Legal) and the website render the same text.
// This is a plain-language starting point, not legal advice: read it, fix what your app
// actually collects, and update `updated` when you change it.
export type LegalPage = { slug: 'privacy' | 'terms' | 'delete-account' | 'support'; title: string; updated: string; sections: { heading: string; body: string }[] };
export type LegalInfo = { appName: string; company: string; email: string; updated?: string };

export function legalPages(i: LegalInfo): LegalPage[] {
  const updated = i.updated ?? '__TODAY__';
  return [
    {
      slug: 'privacy', title: 'Privacy policy', updated,
      sections: [
        { heading: 'What we collect', body: `${i.appName} stores the data you add in the app (for example your notes and settings). If you sign in, we store your email and name. We collect basic crash and usage information to fix bugs.` },
        { heading: 'How we use it', body: 'Only to run the app: save your data, sync it across your devices and improve the app. We do not sell your data.' },
        { heading: 'Who we share it with', body: 'Service providers that host the app for us (for example cloud hosting and databases), only as needed to run it. If ads are shown, the ad provider may use device identifiers as described in its own policy.' },
        { heading: 'Your choices', body: `You can delete your account and data at any time (see "Delete account"). Questions: ${i.email}.` },
      ],
    },
    {
      slug: 'terms', title: 'Terms of use', updated,
      sections: [
        { heading: 'Using the app', body: `By using ${i.appName} you agree to use it lawfully and not to misuse or attack the service.` },
        { heading: 'Your content', body: 'You own what you add. You give us permission to store and process it to run the app for you.' },
        { heading: 'No warranty', body: `${i.appName} is provided "as is". We work hard to keep it running and correct, but we can't promise it will always be error-free.` },
        { heading: 'Contact', body: `${i.company}, ${i.email}` },
      ],
    },
    {
      slug: 'delete-account', title: 'Delete your account', updated,
      sections: [
        { heading: 'In the app', body: 'Open Settings -> Delete account. Your account and data are deleted right away.' },
        { heading: 'By email', body: `Can't open the app? Email ${i.email} from the address you signed up with, with the subject "Delete my account". We delete it within 7 days and confirm by email.` },
        { heading: 'What gets deleted', body: 'Your profile and everything you created in the app. Anonymous crash logs may be kept for up to 90 days.' },
      ],
    },
    {
      slug: 'support', title: 'Support', updated,
      sections: [
        { heading: 'Get help', body: `Email ${i.email}. We usually reply within 2 working days.` },
        { heading: 'Found a bug?', body: 'Tell us what you did, what you expected and what happened instead. A screenshot helps a lot.' },
      ],
    },
  ];
}
