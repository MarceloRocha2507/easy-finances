import { useRef } from 'react';
import { Camera, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';

interface AvatarUploadProps {
  avatarUrl?: string | null;
  fullName?: string;
  email?: string;
}

export function AvatarUpload({ avatarUrl, fullName, email }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadAvatar, removeAvatar, isUploading } = useAvatarUpload();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadAvatar(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getInitials = () => {
    if (fullName) return fullName.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return 'U';
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div className="relative">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-lg"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-4xl font-semibold text-primary-foreground border-4 border-background shadow-lg">
            {getInitials()}
          </div>
        )}
        {isUploading && (
          <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-lg font-semibold text-foreground text-center sm:text-left">
          {fullName || 'Usuário'}
        </p>
        <p className="text-sm text-muted-foreground text-center sm:text-left">
          {email}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Camera className="w-4 h-4 mr-2" />
            Alterar foto
          </Button>
          {avatarUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={removeAvatar}
              disabled={isUploading}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
