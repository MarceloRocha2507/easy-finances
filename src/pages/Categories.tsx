import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, Category, CategoryInsert } from '@/hooks/useCategories';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, Lock, ShoppingCart, Home, Car, Utensils, Briefcase, Heart, GraduationCap, Gift, Plane, Gamepad2, Shirt, Pill, Book, Package, Zap, DollarSign, Wallet, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICON_OPTIONS = [
  { value: 'dollar-sign', label: 'Dinheiro', icon: DollarSign },
  { value: 'wallet', label: 'Carteira', icon: Wallet },
  { value: 'briefcase', label: 'Trabalho', icon: Briefcase },
  { value: 'shopping-cart', label: 'Compras', icon: ShoppingCart },
  { value: 'home', label: 'Casa', icon: Home },
  { value: 'car', label: 'Transporte', icon: Car },
  { value: 'utensils', label: 'Alimentação', icon: Utensils },
  { value: 'heart', label: 'Saúde', icon: Heart },
  { value: 'graduation-cap', label: 'Educação', icon: GraduationCap },
  { value: 'gift', label: 'Presente', icon: Gift },
  { value: 'plane', label: 'Viagem', icon: Plane },
  { value: 'gamepad', label: 'Lazer', icon: Gamepad2 },
  { value: 'shirt', label: 'Vestuário', icon: Shirt },
  { value: 'pill', label: 'Farmácia', icon: Pill },
  { value: 'book', label: 'Livros', icon: Book },
  { value: 'package', label: 'Outros', icon: Package },
  { value: 'zap', label: 'Serviços', icon: Zap },
  { value: 'trending-up', label: 'Crescimento', icon: TrendingUp },
  { value: 'tag', label: 'Etiqueta', icon: Tag },
];

const COLOR_OPTIONS = ['#64748b', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#ec4899', '#0ea5e9', '#f97316'];

interface CategoryFormData {
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
}

const initialFormData: CategoryFormData = {
  name: '',
  icon: 'package',
  color: '#64748b',
  type: 'expense',
};

function getIconComponent(iconValue: string) {
  const iconData = ICON_OPTIONS.find(i => i.value === iconValue);
  return iconData?.icon || Package;
}

export default function Categories() {
  const [formData, setFormData] = useState<CategoryFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: categories, isLoading } = useCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const incomeCategories = categories?.filter((c) => c.type === 'income') || [];
  const expenseCategories = categories?.filter((c) => c.type === 'expense') || [];

  const handleSubmit = () => {
    const data: CategoryInsert = {
      name: formData.name,
      icon: formData.icon,
      color: formData.color,
      type: formData.type,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...data }, {
        onSuccess: () => {
          setDialogOpen(false);
          resetForm();
        },
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          setDialogOpen(false);
          resetForm();
        },
      });
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingId(null);
  };

  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      icon: category.icon || 'package',
      color: category.color || '#64748b',
      type: category.type,
    });
    setEditingId(category.id);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const CategoryCard = ({ category }: { category: Category }) => {
    const IconComponent = getIconComponent(category.icon || 'package');
    
    return (
      <div className="flex items-center justify-between p-3 rounded-md border hover:bg-secondary/30 transition-colors">
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-md flex items-center justify-center"
            style={{ backgroundColor: `${category.color}15` }}
          >
            <IconComponent className="w-4 h-4" style={{ color: category.color || '#64748b' }} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{category.name}</p>
            {category.is_default && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Padrão
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: category.color || '#64748b' }}
          />
          {!category.is_default && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(category)}>
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
                      Excluir a categoria "{category.name}"? Transações vinculadas ficarão sem categoria.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(category.id)} className="bg-destructive text-destructive-foreground">
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>
    );
  };

  const SelectedIcon = getIconComponent(formData.icon);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Categorias</h1>
            <p className="text-sm text-muted-foreground">Organize suas transações</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base font-medium">
                  {editingId ? 'Editar Categoria' : 'Nova Categoria'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Type Toggle */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={formData.type === 'income' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setFormData({ ...formData, type: 'income' })}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Receita
                  </Button>
                  <Button
                    type="button"
                    variant={formData.type === 'expense' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setFormData({ ...formData, type: 'expense' })}
                  >
                    <TrendingDown className="w-4 h-4 mr-2" />
                    Despesa
                  </Button>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <Label className="text-sm">Nome</Label>
                  <Input
                    placeholder="Ex: Alimentação"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                {/* Icon Picker */}
                <div className="space-y-2">
                  <Label className="text-sm">Ícone</Label>
                  <div className="flex flex-wrap gap-2">
                    {ICON_OPTIONS.map((item) => {
                      const IconComp = item.icon;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, icon: item.value })}
                          className={cn(
                            "w-9 h-9 rounded-md flex items-center justify-center border transition-all",
                            formData.icon === item.value 
                              ? 'border-primary bg-primary/10' 
                              : 'border-border hover:border-primary/50'
                          )}
                          title={item.label}
                        >
                          <IconComp className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Color Picker */}
                <div className="space-y-2">
                  <Label className="text-sm">Cor</Label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={cn(
                          "w-7 h-7 rounded-full transition-all",
                          formData.color === color ? 'ring-2 ring-primary ring-offset-2' : ''
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="space-y-2">
                  <Label className="text-sm">Prévia</Label>
                  <div className="flex items-center gap-3 p-3 rounded-md bg-secondary/50">
                    <div 
                      className="w-8 h-8 rounded-md flex items-center justify-center"
                      style={{ backgroundColor: `${formData.color}15` }}
                    >
                      <SelectedIcon className="w-4 h-4" style={{ color: formData.color }} />
                    </div>
                    <span className="text-sm font-medium">{formData.name || 'Nome da categoria'}</span>
                    <div 
                      className="w-3 h-3 rounded-full ml-auto" 
                      style={{ backgroundColor: formData.color }}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button 
                  onClick={handleSubmit} 
                  disabled={!formData.name || createMutation.isPending || updateMutation.isPending}
                >
                  {editingId ? 'Salvar' : 'Criar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Categories Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
              <Card key={i} className="border animate-pulse">
                <CardContent className="p-6">
                  <div className="h-40 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Income Categories */}
            <Card className="border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2 text-income">
                  <TrendingUp className="w-4 h-4" />
                  Receitas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {incomeCategories.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhuma categoria</p>
                ) : (
                  incomeCategories.map((category) => (
                    <CategoryCard key={category.id} category={category} />
                  ))
                )}
              </CardContent>
            </Card>

            {/* Expense Categories */}
            <Card className="border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2 text-expense">
                  <TrendingDown className="w-4 h-4" />
                  Despesas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {expenseCategories.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhuma categoria</p>
                ) : (
                  expenseCategories.map((category) => (
                    <CategoryCard key={category.id} category={category} />
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
