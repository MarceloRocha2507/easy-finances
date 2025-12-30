import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, Category, CategoryInsert } from '@/hooks/useCategories';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

const EMOJI_OPTIONS = ['💰', '💼', '📈', '🏷️', '💵', '🍔', '🚗', '🏠', '💡', '🎮', '🛒', '💊', '📚', '📦', '✈️', '👕', '💄', '🎁', '🏋️', '🎬'];
const COLOR_OPTIONS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9', '#6366f1', '#a855f7', '#ec4899'];

interface CategoryFormData {
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
}

const initialFormData: CategoryFormData = {
  name: '',
  icon: '📦',
  color: '#6366f1',
  type: 'expense',
};

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
      icon: category.icon || '📦',
      color: category.color || '#6366f1',
      type: category.type,
    });
    setEditingId(category.id);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const CategoryCard = ({ category }: { category: Category }) => (
    <div 
      className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
          style={{ backgroundColor: `${category.color}20` }}
        >
          {category.icon}
        </div>
        <div>
          <p className="font-medium text-foreground">{category.name}</p>
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
          className="w-4 h-4 rounded-full" 
          style={{ backgroundColor: category.color || '#6366f1' }}
        />
        {!category.is_default && (
          <>
            <Button variant="ghost" size="icon" onClick={() => handleEdit(category)}>
              <Pencil className="w-4 h-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir a categoria "{category.name}"? Transações vinculadas ficarão sem categoria.
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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Categorias</h1>
            <p className="text-muted-foreground">Organize suas transações por categorias</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Type Toggle */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={formData.type === 'income' ? 'default' : 'outline'}
                    className={formData.type === 'income' ? 'gradient-income flex-1' : 'flex-1'}
                    onClick={() => setFormData({ ...formData, type: 'income' })}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Receita
                  </Button>
                  <Button
                    type="button"
                    variant={formData.type === 'expense' ? 'default' : 'outline'}
                    className={formData.type === 'expense' ? 'gradient-expense flex-1' : 'flex-1'}
                    onClick={() => setFormData({ ...formData, type: 'expense' })}
                  >
                    <TrendingDown className="w-4 h-4 mr-2" />
                    Despesa
                  </Button>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <Label>Nome da Categoria</Label>
                  <Input
                    placeholder="Ex: Alimentação"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                {/* Emoji Picker */}
                <div className="space-y-2">
                  <Label>Ícone</Label>
                  <div className="flex flex-wrap gap-2">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: emoji })}
                        className={cn(
                          "w-10 h-10 rounded-lg text-lg flex items-center justify-center border-2 transition-all",
                          formData.icon === emoji 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Picker */}
                <div className="space-y-2">
                  <Label>Cor</Label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 transition-all",
                          formData.color === color ? 'ring-2 ring-primary ring-offset-2' : ''
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="space-y-2">
                  <Label>Pré-visualização</Label>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${formData.color}20` }}
                    >
                      {formData.icon}
                    </div>
                    <span className="font-medium">{formData.name || 'Nome da categoria'}</span>
                    <div 
                      className="w-4 h-4 rounded-full ml-auto" 
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
                  className="gradient-primary"
                >
                  {editingId ? 'Salvar' : 'Criar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Categories Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <Card key={i} className="border-0 shadow-lg animate-pulse">
                <CardContent className="p-6">
                  <div className="h-48 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Income Categories */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-income">
                  <TrendingUp className="w-5 h-5" />
                  Categorias de Receita
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {incomeCategories.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Nenhuma categoria de receita</p>
                ) : (
                  incomeCategories.map((category) => (
                    <CategoryCard key={category.id} category={category} />
                  ))
                )}
              </CardContent>
            </Card>

            {/* Expense Categories */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-expense">
                  <TrendingDown className="w-5 h-5" />
                  Categorias de Despesa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {expenseCategories.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Nenhuma categoria de despesa</p>
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
