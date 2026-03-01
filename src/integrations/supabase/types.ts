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
      atrativos: {
        Row: {
          capacidade_maxima: number
          created_at: string
          descricao: string | null
          id: string
          imagem: string | null
          municipio_id: string
          nome: string
          ocupacao_atual: number
          status: Database["public"]["Enums"]["atrativo_status"]
          tipo: Database["public"]["Enums"]["atrativo_tipo"]
          updated_at: string
        }
        Insert: {
          capacidade_maxima: number
          created_at?: string
          descricao?: string | null
          id?: string
          imagem?: string | null
          municipio_id: string
          nome: string
          ocupacao_atual?: number
          status?: Database["public"]["Enums"]["atrativo_status"]
          tipo: Database["public"]["Enums"]["atrativo_tipo"]
          updated_at?: string
        }
        Update: {
          capacidade_maxima?: number
          created_at?: string
          descricao?: string | null
          id?: string
          imagem?: string | null
          municipio_id?: string
          nome?: string
          ocupacao_atual?: number
          status?: Database["public"]["Enums"]["atrativo_status"]
          tipo?: Database["public"]["Enums"]["atrativo_tipo"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "atrativos_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
        ]
      }
      banners: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          imagem_url: string
          link: string | null
          ordem: number
          subtitulo: string | null
          titulo: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          imagem_url: string
          link?: string | null
          ordem?: number
          subtitulo?: string | null
          titulo?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          imagem_url?: string
          link?: string | null
          ordem?: number
          subtitulo?: string | null
          titulo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      configuracoes_sistema: {
        Row: {
          chave: string
          descricao: string | null
          id: string
          updated_at: string
          valor: string | null
        }
        Insert: {
          chave: string
          descricao?: string | null
          id?: string
          updated_at?: string
          valor?: string | null
        }
        Update: {
          chave?: string
          descricao?: string | null
          id?: string
          updated_at?: string
          valor?: string | null
        }
        Relationships: []
      }
      municipios: {
        Row: {
          created_at: string
          id: string
          logo: string | null
          nome: string
          uf: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo?: string | null
          nome: string
          uf: string
        }
        Update: {
          created_at?: string
          id?: string
          logo?: string | null
          nome?: string
          uf?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          atrativo_id: string | null
          created_at: string
          email: string
          id: string
          municipio_id: string | null
          nome: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          atrativo_id?: string | null
          created_at?: string
          email: string
          id: string
          municipio_id?: string | null
          nome: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          atrativo_id?: string | null
          created_at?: string
          email?: string
          id?: string
          municipio_id?: string | null
          nome?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_atrativo_id_fkey"
            columns: ["atrativo_id"]
            isOneToOne: false
            referencedRelation: "atrativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_municipio_id_fkey"
            columns: ["municipio_id"]
            isOneToOne: false
            referencedRelation: "municipios"
            referencedColumns: ["id"]
          },
        ]
      }
      quiosques: {
        Row: {
          atrativo_id: string | null
          created_at: string
          id: string
          numero: number
          posicao_x: number
          posicao_y: number
          status: Database["public"]["Enums"]["quiosque_status"]
          tem_churrasqueira: boolean
          updated_at: string
        }
        Insert: {
          atrativo_id?: string | null
          created_at?: string
          id?: string
          numero: number
          posicao_x?: number
          posicao_y?: number
          status?: Database["public"]["Enums"]["quiosque_status"]
          tem_churrasqueira?: boolean
          updated_at?: string
        }
        Update: {
          atrativo_id?: string | null
          created_at?: string
          id?: string
          numero?: number
          posicao_x?: number
          posicao_y?: number
          status?: Database["public"]["Enums"]["quiosque_status"]
          tem_churrasqueira?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiosques_atrativo_id_fkey"
            columns: ["atrativo_id"]
            isOneToOne: false
            referencedRelation: "atrativos"
            referencedColumns: ["id"]
          },
        ]
      }
      reservas: {
        Row: {
          atrativo_id: string
          cidade_origem: string
          cpf: string
          created_at: string
          data: string
          data_fim: string | null
          email: string
          id: string
          nome_visitante: string
          quantidade_pessoas: number
          quiosque_id: string | null
          status: Database["public"]["Enums"]["reserva_status"]
          tipo: Database["public"]["Enums"]["reserva_tipo"]
          token: string
          uf_origem: string
        }
        Insert: {
          atrativo_id: string
          cidade_origem: string
          cpf: string
          created_at?: string
          data: string
          data_fim?: string | null
          email: string
          id?: string
          nome_visitante: string
          quantidade_pessoas?: number
          quiosque_id?: string | null
          status?: Database["public"]["Enums"]["reserva_status"]
          tipo?: Database["public"]["Enums"]["reserva_tipo"]
          token: string
          uf_origem: string
        }
        Update: {
          atrativo_id?: string
          cidade_origem?: string
          cpf?: string
          created_at?: string
          data?: string
          data_fim?: string | null
          email?: string
          id?: string
          nome_visitante?: string
          quantidade_pessoas?: number
          quiosque_id?: string | null
          status?: Database["public"]["Enums"]["reserva_status"]
          tipo?: Database["public"]["Enums"]["reserva_tipo"]
          token?: string
          uf_origem?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservas_atrativo_id_fkey"
            columns: ["atrativo_id"]
            isOneToOne: false
            referencedRelation: "atrativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_quiosque_id_fkey"
            columns: ["quiosque_id"]
            isOneToOne: false
            referencedRelation: "quiosques"
            referencedColumns: ["id"]
          },
        ]
      }
      validacoes: {
        Row: {
          atrativo_id: string | null
          created_at: string
          id: string
          operador_id: string | null
          reserva_id: string | null
          token: string
          valido: boolean
        }
        Insert: {
          atrativo_id?: string | null
          created_at?: string
          id?: string
          operador_id?: string | null
          reserva_id?: string | null
          token: string
          valido: boolean
        }
        Update: {
          atrativo_id?: string | null
          created_at?: string
          id?: string
          operador_id?: string | null
          reserva_id?: string | null
          token?: string
          valido?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "validacoes_atrativo_id_fkey"
            columns: ["atrativo_id"]
            isOneToOne: false
            referencedRelation: "atrativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "validacoes_operador_id_fkey"
            columns: ["operador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "validacoes_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: false
            referencedRelation: "reservas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      atrativo_status: "ativo" | "inativo" | "manutencao"
      atrativo_tipo: "balneario" | "cachoeira" | "trilha" | "parque" | "camping"
      quiosque_status: "disponivel" | "reservado" | "ocupado" | "manutencao"
      reserva_status: "confirmada" | "cancelada" | "utilizada"
      reserva_tipo: "day_use" | "camping"
      user_role: "admin" | "prefeitura" | "balneario" | "publico"
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
      atrativo_status: ["ativo", "inativo", "manutencao"],
      atrativo_tipo: ["balneario", "cachoeira", "trilha", "parque", "camping"],
      quiosque_status: ["disponivel", "reservado", "ocupado", "manutencao"],
      reserva_status: ["confirmada", "cancelada", "utilizada"],
      reserva_tipo: ["day_use", "camping"],
      user_role: ["admin", "prefeitura", "balneario", "publico"],
    },
  },
} as const
