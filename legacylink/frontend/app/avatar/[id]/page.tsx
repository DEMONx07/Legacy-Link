import AvatarClient from './AvatarClient';

export function generateStaticParams() {
  return [
    { id: '550e8400-e29b-41d4-a716-446655440001' },
    { id: '550e8400-e29b-41d4-a716-446655440002' },
    { id: '550e8400-e29b-41d4-a716-446655440003' },
  ];
}

export default function AvatarPage({ params }: { params: { id: string } }) {
  return <AvatarClient params={params} />;
}
