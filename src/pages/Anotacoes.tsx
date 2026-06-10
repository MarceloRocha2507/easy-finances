import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useAnotacoes, Anotacao } from "@/hooks/useAnotacoes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  StickyNote,
  Trash2,
  Pin,
  PinOff,
  Search,
  Loader2,
  MoreVertical,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Anotacoes() {
  const { anotacoes, isLoading, createAnotacao, deleteAnotacao, toggleFixar, updateAnotacao } = useAnotacoes();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnotacao, setEditingAnotacao] = useState<Anotacao | null>(null);
  const [newNote, setNewNote] = useState({ titulo: "", conteudo: "" });

  const filteredAnotacoes = anotacoes.filter(
    (a) =>
      a.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.conteudo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = () => {
    if (!newNote.titulo.trim()) return;

    if (editingAnotacao) {
      updateAnotacao.mutate({
        id: editingAnotacao.id,
        titulo: newNote.titulo,
        conteudo: newNote.conteudo,
      });
    } else {
      createAnotacao.mutate(newNote);
    }

    setNewNote({ titulo: "", conteudo: "" });
    setEditingAnotacao(null);
    setIsDialogOpen(false);
  };

  const openEditDialog = (anotacao: Anotacao) => {
    setEditingAnotacao(anotacao);
    setNewNote({ titulo: anotacao.titulo, conteudo: anotacao.conteudo || "" });
    setIsDialogOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Anotações</h1>
            <p className="text-muted-foreground">
              Anote compras futuras, lembretes e observações importantes.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingAnotacao(null);
              setNewNote({ titulo: "", conteudo: "" });
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nova Anotação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingAnotacao ? "Editar Anotação" : "Nova Anotação"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Input
                    placeholder="Título da anotação"
                    value={newNote.titulo}
                    onChange={(e) => setNewNote({ ...newNote, titulo: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Textarea
                    placeholder="Conteúdo da anotação..."
                    rows={5}
                    value={newNote.conteudo}
                    onChange={(e) => setNewNote({ ...newNote, conteudo: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave} disabled={createAnotacao.isPending || updateAnotacao.isPending}>
                  {createAnotacao.isPending || updateAnotacao.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Salvar"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar anotações..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredAnotacoes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
            <StickyNote className="w-12 h-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">Nenhuma anotação encontrada.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAnotacoes.map((anotacao) => (
              <Card key={anotacao.id} className="relative group hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="space-y-1 pr-8">
                    <CardTitle className="text-base font-semibold leading-tight">
                      {anotacao.titulo}
                    </CardTitle>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {format(new Date(anotacao.created_at), "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => toggleFixar.mutate({ id: anotacao.id, fixado: anotacao.fixado })}
                    >
                      {anotacao.fixado ? (
                        <Pin className="h-4 w-4 text-[hsl(var(--accent-violet))]" />
                      ) : (
                        <PinOff className="h-4 w-4" />
                      )}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(anotacao)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => deleteAnotacao.mutate(anotacao.id)}
                        >
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">
                    {anotacao.conteudo}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
