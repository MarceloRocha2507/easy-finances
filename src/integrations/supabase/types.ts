export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      acertos_fatura: {
        Row: {
          cartao_id: string
          created_at: string
          data_acerto: string | null
          id: string
          mes_referencia: string
          observacao: string | null
          responsavel_id: string
          status: string
          user_id: string
          valor_devido: number
          valor_pago: number
        }
        Insert: {
          cartao_id: string
          created_at?: string
          data_acerto?: string | null
          id?: string
          mes_referencia: string
          observacao?: string | null
          responsavel_id: string
          status?: string
          user_id: string
          valor_devido?: number
          valor_pago?: number
        }
        Update: {
          cartao_id?: string
          created_at?: string
          data_acerto?: string | null
          id?: string
          mes_referencia?: string
          observacao?: string | null
          responsavel_id?: string
          status?: string
          user_id?: string
          valor_devido?: number
          valor_pago?: number
        }
        Relationships: [
          {
            foreignKeyName: "acertos_fatura_cartao_id_fkey"
            columns: ["cartao_id"]
            isOneToOne: false
            referencedRelation: "cartoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acertos_fatura_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "responsaveis"
            referencedColumns: ["id"]
          },
        ]
      }
      cartoes: {
        Row: {
          bandeira: string | null
          cor: string
          created_at: string
          dia_fechamento: number
          dia_vencimento: number
          id: string
          limite: number
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bandeira?: string | null
          cor?: string
          created_at?: string
          dia_fechamento?: number
          dia_vencimento?: number
          id?: string
          limite?: number
          nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bandeira?: string | null
          cor?: string
          created_at?: string
          dia_fechamento?: number
          dia_vencimento?: number
          id?: string
          limite?: number
          nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      compras_cartao: {
        Row: {
          ativo: boolean
          cartao_id: string
          categoria_id: string | null
          created_at: string
          data_compra: string | null
          descricao: string
          id: string
          mes_inicio: string
          parcela_inicial: number
          parcelas: number
          responsavel_id: string | null
          tipo_lancamento: string
          user_id: string
          valor_total: number
        }
        Insert: {
          ativo?: boolean
          cartao_id: string
          categoria_id?: string | null
          created_at?: string
          data_compra?: string | null
          descricao: string
          id?: string
          mes_inicio?: string
          parcela_inicial?: number
          parcelas?: number
          responsavel_id?: string | null
          tipo_lancamento?: string
          user_id: string
          valor_total: number
        }
        Update: {
          ativo?: boolean
          cartao_id?: string
          categoria_id?: string | null
          created_at?: string
          data_compra?: string | null
          descricao?: string
          id?: string
          mes_inicio?: string
          parcela_inicial?: number
          parcelas?: number
          responsavel_id?: string | null
          tipo_lancamento?: string
          user_id?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "compras_cartao_cartao_id_fkey"
            columns: ["cartao_id"]
            isOneToOne: false
            referencedRelation: "cartoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_cartao_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_cartao_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "responsaveis"
            referencedColumns: ["id"]
          },
        ]
      }
      metas: {
        Row: {
          concluida: boolean
          cor: string
          created_at: string
          data_limite: string | null
          icone: string
          id: string
          titulo: string
          updated_at: string
          user_id: string
          valor_alvo: number
          valor_atual: number
        }
        Insert: {
          concluida?: boolean
          cor?: string
          created_at?: string
          data_limite?: string | null
          icone?: string
          id?: string
          titulo: string
          updated_at?: string
          user_id: string
          valor_alvo?: number
          valor_atual?: number
        }
        Update: {
          concluida?: boolean
          cor?: string
          created_at?: string
          data_limite?: string | null
          icone?: string
          id?: string
          titulo?: string
          updated_at?: string
          user_id?: string
          valor_alvo?: number
          valor_atual?: number
        }
        Relationships: []
      }
      orcamentos: {
        Row: {
          category_id: string
          created_at: string
          id: string
          mes_referencia: string
          updated_at: string
          user_id: string
          valor_limite: number
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          mes_referencia: string
          updated_at?: string
          user_id: string
          valor_limite?: number
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          mes_referencia?: string
          updated_at?: string
          user_id?: string
          valor_limite?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      parcelas_cartao: {
        Row: {
          ativo: boolean
          compra_id: string
          created_at: string
          id: string
          mes_referencia: string
          numero_parcela: number
          paga: boolean
          tipo_recorrencia: string
          total_parcelas: number
          valor: number
        }
        Insert: {
          ativo?: boolean
          compra_id: string
          created_at?: string
          id?: string
          mes_referencia: string
          numero_parcela: number
          paga?: boolean
          tipo_recorrencia?: string
          total_parcelas: number
          valor: number
        }
        Update: {
          ativo?: boolean
          compra_id?: string
          created_at?: string
          id?: string
          mes_referencia?: string
          numero_parcela?: number
          paga?: boolean
          tipo_recorrencia?: string
          total_parcelas?: number
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "parcelas_cartao_compra_id_fkey"
            columns: ["compra_id"]
            isOneToOne: false
            referencedRelation: "compras_cartao"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          saldo_inicial: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          saldo_inicial?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          saldo_inicial?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      responsaveis: {
        Row: {
          apelido: string | null
          ativo: boolean
          created_at: string
          id: string
          is_titular: boolean
          nome: string
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          apelido?: string | null
          ativo?: boolean
          created_at?: string
          id?: string
          is_titular?: boolean
          nome: string
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          apelido?: string | null
          ativo?: boolean
          created_at?: string
          id?: string
          is_titular?: boolean
          nome?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          date: string
          description: string | null
          due_date: string | null
          id: string
          is_recurring: boolean | null
          paid_date: string | null
          recurrence_day: number | null
          status: string
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          date?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_recurring?: boolean | null
          paid_date?: string | null
          recurrence_day?: number | null
          status?: string
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          date?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_recurring?: boolean | null
          paid_date?: string | null
          recurrence_day?: number | null
          status?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      transaction_type: "income" | "expense"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      transaction_type: ["income", "expense"],
    },
  },
} as const
