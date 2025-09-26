import { useSeoMeta } from '@unhead/react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { EditProfileForm } from '@/components/EditProfileForm';

export default function EditProfilePage() {
  const navigate = useNavigate();

  useSeoMeta({
    title: 'Edit Profile - Sleek',
    description: 'Edit your Nostr profile information',
  });

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/profile')}
            className="h-9 w-9 mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">Edit Profile</h1>
        </div>
      </div>

      <div className="p-4">
        <EditProfileForm />
      </div>
    </div>
  );
}