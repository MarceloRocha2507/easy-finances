import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/Layout";
import { useAnotacoes, Anotacao } from "@/hooks/useAnotacoes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Plus,
  StickyNote,
  Loader2,
  Search,
  FileText,
  FilePlus2,
  MoreHorizontal,
  Pin,
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  List,
  CheckSquare,
  Heading1,
  Heading2,
  Heading3,
  Undo2,
  Redo2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export default function Anotacoes() {
  const { anotacoes, isLoading, createAnotacao, deleteAnotacao, toggleFixar, updateAnotacao } = useAnotacoes();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [localTitle, setLocalTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const filteredAnotacoes = anotacoes.filter(
    (a) =>
      a.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.conteudo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedNote = anotacoes.find((a) => a.id === selectedNoteId);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Underline,
      Bold,
      Italic,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder: 'Comece a escrever aqui...',
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      // O salvamento automático será via onBlur ou manual para evitar muitas chamadas
    },
  });

  useEffect(() => {
    if (selectedNote && editor) {
      setLocalTitle(selectedNote.titulo);
      // Evita resetar o cursor se o conteúdo for o mesmo
      if (editor.getHTML() !== (selectedNote.conteudo || "")) {
        editor.commands.setContent(selectedNote.conteudo || "");
      }
    } else if (!selectedNoteId) {
      setLocalTitle("");
      editor?.commands.setContent("");
    }
  }, [selectedNoteId, selectedNote, editor]);

  const handleAutoSave = useCallback(async () => {
    if (!selectedNote || !selectedNoteId || !editor) return;
    
    const currentContent = editor.getHTML();
    if (localTitle === selectedNote.titulo && currentContent === (selectedNote.conteudo || "")) return;
    
    setIsSaving(true);
    try {
      await updateAnotacao.mutateAsync({
        id: selectedNoteId,
        titulo: localTitle || "Sem título",
        conteudo: currentContent,
      });
    } finally {
      setIsSaving(false);
    }
  }, [selectedNote, selectedNoteId, editor, localTitle, updateAnotacao]);

  const handleCreateNote = async () => {
    const res = await createAnotacao.mutateAsync({
      titulo: "Nova Anotação",
      conteudo: "",
    });
    if (res?.id) {
      setSelectedNoteId(res.id);
    }
  };

  return (
    <Layout>
      <div className="flex h-[calc(100vh-8rem)] overflow-hidden border rounded-xl bg-background shadow-sm">
        {/* Sidebar Estilo Notion */}
        <div className="w-64 md:w-80 flex flex-col border-r bg-muted/20">
          <div className="p-4 border-b space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <StickyNote className="w-3 h-3" />
                Minhas Notas
              </h2>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCreateNote}>
                <FilePlus2 className="w-4 h-4" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Pesquisar..."
                className="pl-8 h-8 text-xs bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredAnotacoes.length === 0 ? (
              <p className="text-xs text-center py-8 text-muted-foreground">Nenhuma nota.</p>
            ) : (
              filteredAnotacoes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => setSelectedNoteId(note.id)}
                  className={cn(
                    "group flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors relative",
                    selectedNoteId === note.id 
                      ? "bg-accent text-accent-foreground shadow-sm" 
                      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <FileText className={cn("w-4 h-4 shrink-0", selectedNoteId === note.id ? "text-primary" : "opacity-50")} />
                  <span className="text-sm font-medium truncate flex-1">{note.titulo || "Sem título"}</span>
                  {note.fixado && <Pin className="w-3 h-3 text-primary shrink-0" />}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn(
                          "h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity",
                          selectedNoteId === note.id && "opacity-100"
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => toggleFixar.mutate({ id: note.id, fixado: note.fixado })}>
                        {note.fixado ? "Desafixar" : "Fixar"}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onClick={() => {
                          deleteAnotacao.mutate(note.id);
                          if (selectedNoteId === note.id) setSelectedNoteId(null);
                        }}
                      >
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Editor Estilo Notion */}
        <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
          <AnimatePresence mode="wait">
            {selectedNote ? (
              <motion.div 
                key={selectedNote.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex-1 overflow-y-auto"
              >
                <div className="max-w-3xl mx-auto px-8 md:px-16 py-12 space-y-6">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-widest mb-4">
                    <div className="flex items-center gap-2">
                      {format(new Date(selectedNote.created_at), "PPP", { locale: ptBR })}
                      {isSaving && (
                        <span className="flex items-center gap-1 normal-case italic">
                          <Loader2 className="w-2.5 h-2.5 animate-spin" /> Salvando...
                        </span>
                      )}
                    </div>
                  </div>

                  <input
                    className="w-full text-4xl md:text-5xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/30 focus:ring-0 px-0"
                    placeholder="Título da Página"
                    value={localTitle}
                    onChange={(e) => setLocalTitle(e.target.value)}
                    onBlur={handleAutoSave}
                  />

                  <div className="border-t border-muted/50 w-full" />

                  <textarea
                    className="w-full min-h-[500px] text-lg bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground/30 focus:ring-0 px-0 leading-relaxed"
                    placeholder="Comece a escrever aqui..."
                    value={localContent}
                    onChange={(e) => setLocalContent(e.target.value)}
                    onBlur={handleAutoSave}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center text-center p-8"
              >
                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
                  <StickyNote className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Selecione uma nota</h2>
                <p className="text-muted-foreground max-w-xs mb-6">
                  Escolha uma nota existente na barra lateral ou crie uma nova para começar.
                </p>
                <Button onClick={handleCreateNote} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Criar primeira nota
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}

