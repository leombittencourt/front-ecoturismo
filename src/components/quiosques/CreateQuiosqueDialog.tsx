import { useState } from 'react';
import { Plus, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { numero: number; tem_churrasqueira: boolean }) => Promise<void>;
  saving: boolean;
}

export function CreateQuiosqueDialog({ open, onOpenChange, onSave, saving }: Props) {
  const [numero, setNumero] = useState('');
  const [temChurrasqueira, setTemChurrasqueira] = useState(false);

  const handleSubmit = async () => {
    const num = parseInt(numero);
    if (isNaN(num) || num <= 0) return;
    await onSave({ numero: num, tem_churrasqueira: temChurrasqueira });
    setNumero('');
    setTemChurrasqueira(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Novo Quiosque
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do novo quiosque. Ele será adicionado ao local selecionado.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="numero">Número do quiosque</Label>
            <Input
              id="numero"
              type="number"
              min={1}
              placeholder="Ex: 15"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <Label htmlFor="churrasqueira" className="cursor-pointer">Com churrasqueira</Label>
            </div>
            <Switch
              id="churrasqueira"
              checked={temChurrasqueira}
              onCheckedChange={setTemChurrasqueira}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving || !numero || parseInt(numero) <= 0}>
            {saving ? 'Criando...' : 'Criar Quiosque'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
