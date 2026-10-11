import { useState, type ComponentProps } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function PasswordField(props: ComponentProps<typeof Input>) {
  const [visible, setVisible] = useState(false);
  return <div className="relative">
    <Input {...props} type={visible ? 'text' : 'password'} className={`pr-12 ${props.className ?? ''}`} />
    <button type="button" aria-label={`${visible ? 'Masquer' : 'Afficher'} ${props.id === 'confirm-password' ? 'la confirmation' : 'le mot de passe'}`} aria-pressed={visible} onClick={() => setVisible(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground">
      {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
    </button>
  </div>;
}
