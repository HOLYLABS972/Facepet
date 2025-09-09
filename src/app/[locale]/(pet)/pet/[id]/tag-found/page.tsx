import TagFoundPage from '@/components/TagFoundPage';

interface TagFoundPageProps {
  params: {
    id: string;
    locale: string;
  };
}

export default async function TagFound({ params }: TagFoundPageProps) {
  const { id } = await params;
  
  return <TagFoundPage petId={id} />;
}
