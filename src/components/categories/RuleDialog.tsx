import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useCategories, Category } from '@/hooks/useCategories';
import { useCreateCategoryRule, useUpdateCategoryRule, CategoryRule } from '@/hooks/useCategoryRules';
import { Package, DollarSign, Wallet, Briefcase, ShoppingCart, Home, Car, Utensils, Heart, GraduationCap, Gift, Plane, Gamepad2, Shirt, Pill, Book, Zap, TrendingUp, Tag } from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  'dollar-sign': DollarSign,
  'wallet': Wallet,
  'briefcase': Briefcase,
  'shopping-cart': ShoppingCart,
  'home': Home,
  'car': Car,
  'utensils': Utensils,
  'heart': Heart,
  'graduation-cap': GraduationCap,
  'gift': Gift,
  'plane': Plane,
  'gamepad': Gamepad2,
  'shirt': Shirt,
  'pill': Pill,
  'book': Book,
  'package': Package,
  'zap': Zap,
  'trending-up': TrendingUp,
  'tag': Tag,
};

function getIconComponent(iconValue: string) {
  return ICON_MAP[iconValue] || Package;
}

interface RuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRule?: CategoryRule | null;
}

export function RuleDialog({ open, onOpenChange, editingRule }: RuleDialogProps) {
  const [categoryId, setCategoryId] = useState<string>('');
  const [keywords, setKeywords] = useState<string>('');
  const [caseInsensitive, setCaseInsensitive] = useState<boolean>(true);

  const { data: categories } = useCategories();
  const createMutation = useCreateCategoryRule();
  const updateMutation = useUpdateCategoryRule();

  const isEditing = !!editingRule;

  useEffect(() => {
    if (editingRule) {
      setCategoryId(editingRule.category_id);
      setKeywords(editingRule.keywords.join(', '));
      setCaseInsensitive(editingRule.case_insensitive);
    } else {
      setCategoryId('');
      setKeywords('');
      setCaseInsensitive(true);
    }
  }, [editingRule, open]);

  const handleSubmit = () => {
    const keywordList = keywords
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    if (!categoryId || keywordList.length === 0) return;

    if (isEditing && editingRule) {
      updateMutation.mutate(
        {
          id: editingRule.id,
          category_id: categoryId,
          keywords: keywordList,
          case_insensitive: caseInsensitive,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        }
      );
    } else {
      createMutation.mutate(
        {
          category_id: categoryId,
          keywords: keywordList,
          case_insensitive: caseInsensitive,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        }
      );
    }
  };

  const selectedCategory = categories?.find(c => c.id === categoryId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-medium">
            {isEditing ? 'Editar Regra' : 'Nova Regra de Categorização'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Category Select */}
          <div className="space-y-2">
            <Label className="text-sm">Categoria *</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat) => {
                  const IconComp = getIconComponent(cat.icon || 'package');
                  return (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <IconComp className="w-4 h-4" style={{ color: cat.color || '#64748b' }} />
                        <span>{cat.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({cat.type === 'income' ? 'Receita' : 'Despesa'})
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Keywords */}
          <div className="space-y-2">
            <Label className="text-sm">Palavras-chave *</Label>
            <Input
              placeholder="uber, 99, cabify"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Separe as palavras-chave por vírgula
            </p>
          </div>

          {/* Case Insensitive */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="case-insensitive"
              checked={caseInsensitive}
              onCheckedChange={(checked) => setCaseInsensitive(checked === true)}
            />
            <Label htmlFor="case-insensitive" className="text-sm font-normal cursor-pointer">
              Ignorar maiúsculas/minúsculas
            </Label>
          </div>

          {/* Preview */}
          {selectedCategory && keywords && (
            <div className="space-y-2">
              <Label className="text-sm">Prévia</Label>
              <div className="p-3 rounded-md bg-secondary/50 text-sm">
                <p className="text-muted-foreground">
                  Transações contendo{' '}
                  <span className="font-medium text-foreground">
                    "{keywords.split(',').map(k => k.trim()).filter(Boolean).join('" ou "')}"
                  </span>{' '}
                  serão categorizadas como{' '}
                  <span className="font-medium" style={{ color: selectedCategory.color || '#64748b' }}>
                    {selectedCategory.name}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!categoryId || !keywords.trim() || createMutation.isPending || updateMutation.isPending}
          >
            {isEditing ? 'Salvar' : 'Criar Regra'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
