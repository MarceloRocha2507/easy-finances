import { useMutation } from "@tanstack/react-query";
import { regenerarParcelasFaltantes } from "@/services/compras-cartao";
import { useToast } from "@/hooks/use-toast";

export function useRegenerarParcelas() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: regenerarParcelasFaltantes,
    onSuccess: (resultado) => {
      if (resultado.parcelasRegeneradas > 0) {
        toast({
          title: "Parcelas regeneradas",
          description: `${resultado.parcelasRegeneradas} parcela(s) restauradas de ${resultado.comprasVerificadas} compras verificadas.`,
        });
      }

      if (resultado.erros.length > 0) {
        toast({
          variant: "destructive",
          title: "Alguns erros ocorreram",
          description: resultado.erros.slice(0, 2).join(", "),
        });
      }
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao verificar parcelas",
        description: error.message,
      });
    },
  });
}
