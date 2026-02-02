import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Wand2, Package, DollarSign, Wallet, Briefcase, ShoppingCart, Home, Car, Utensils, Heart, GraduationCap, Gift, Plane, Gamepad2, Shirt, Pill, Book, Zap, TrendingUp, Tag } from 'lucide-react';
import { useCategoryRules, useDeleteCategoryRule, CategoryRule } from '@/hooks/useCategoryRules';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { PlanLimitAlert, PlanLimitBadge } from '@/components/ui/plan-limit-alert';
import { RuleDialog } from './RuleDialog';
import { toast } from 'sonner';

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

export function RulesList() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<CategoryRule | null>(null);

  const { data: rules, isLoading } = useCategoryRules();
  const deleteMutation = useDeleteCategoryRule();

  const { canCreate, isLimitReached, usage, limits } = usePlanLimits();
  const limiteRegrasAtingido = isLimitReached("regrasCategorizacao");

  const handleOpenDialog = () => {
    if (limiteRegrasAtingido) {
      toast.error("Limite de regras atingido. Faça upgrade do seu plano.");
      return;
    }
    setEditingRule(null);
    setDialogOpen(true);
  };

  const handleEdit = (rule: CategoryRule) => {
    setEditingRule(rule);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-20 bg-muted rounded animate-pulse" />
        <div className="h-20 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-medium text-foreground">Regras de Categorização</h2>
            </div>
            <PlanLimitBadge usado={usage.regrasCategorizacao} limite={limits.regrasCategorizacao} />
          </div>
          <p className="text-sm text-muted-foreground">Categorize transações automaticamente</p>
        </div>
        <Button onClick={handleOpenDialog} disabled={limiteRegrasAtingido}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Regra
        </Button>
      </div>

      {limiteRegrasAtingido && (
        <PlanLimitAlert
          recurso="regras de categorização"
          usado={usage.regrasCategorizacao}
          limite={limits.regrasCategorizacao}
          onUpgrade={() => toast.info("Contate o administrador para fazer upgrade do seu plano")}
        />
      )}

      {/* Rules List */}
      {!rules || rules.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <Wand2 className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-sm font-medium text-foreground mb-1">Nenhuma regra criada</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Crie regras para categorizar suas transações automaticamente baseado em palavras-chave.
            </p>
            <Button onClick={handleOpenDialog} variant="outline" disabled={limiteRegrasAtingido}>
              <Plus className="w-4 h-4 mr-2" />
              Criar primeira regra
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {rules.map((rule) => {
            const IconComponent = rule.category ? getIconComponent(rule.category.icon || 'package') : Package;
            
            return (
              <div
                key={rule.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className="w-10 h-10 rounded-md flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${rule.category?.color || '#64748b'}15` }}
                  >
                    <IconComponent
                      className="w-5 h-5"
                      style={{ color: rule.category?.color || '#64748b' }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {rule.category?.name || 'Categoria removida'}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {rule.keywords.slice(0, 3).map((keyword, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                      {rule.keywords.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{rule.keywords.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {!rule.is_active && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      Inativa
                    </Badge>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(rule)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Excluir a regra para "{rule.category?.name}"? Novas transações não serão mais categorizadas automaticamente com base nessa regra.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(rule.id)}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <RuleDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingRule(null);
        }}
        editingRule={editingRule}
      />
    </div>
  );
}
