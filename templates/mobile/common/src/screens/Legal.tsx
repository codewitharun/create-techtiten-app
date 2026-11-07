import { useLocalSearchParams } from 'expo-router';
import { app } from '__SCOPE__/config';
import { legalPages } from '__SCOPE__/shared';
import { Card, EmptyState, Header, Screen, Text } from '@/ui';

/** Privacy / terms / support / delete-account. Same text as the website (packages/shared/src/legal.ts). */
export default function Legal() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const page = legalPages({ appName: app.name, company: app.support.company, email: app.support.email }).find((p) => p.slug === slug);
  if (!page) return (<><Header title="Not found" /><Screen><EmptyState icon="help-circle-outline" title="Page not found" /></Screen></>);
  return (
    <>
      <Header title={page.title} subtitle={`Updated ${page.updated}`} />
      <Screen>
        {page.sections.map((s) => (
          <Card key={s.heading}>
            <Text weight="bold">{s.heading}</Text>
            <Text muted>{s.body}</Text>
          </Card>
        ))}
      </Screen>
    </>
  );
}
