import type { SegmentPreset } from "@/domain/types";
import { EXTRA_SEGMENTS } from "./segments-extra";

/** Doceria: conteúdo validado no estudo de calibração (2026-09-28). Serve de modelo para os outros. */
const BAKERY: SegmentPreset = {
  id: "bakery",
  label: { "pt-BR": "Doceria / Confeitaria", en: "Bakery / Confectionery" },
  business: "bakery and confectionery",
  logoHint: "cupcake",
  brand: "Doce Encanto",
  accent: "#E11D74",
  content: {
    "pt-BR": {
      nav: ["Painel", "Pedidos", "Encomendas", "Produtos", "Receitas", "Estoque", "Clientes", "Financeiro"],
      kpis: [
        { label: "Pedidos hoje", value: "48" },
        { label: "Faturamento do mês", value: "R$ 18.450" },
        { label: "Encomendas da semana", value: "23" },
        { label: "Ingredientes em falta", value: "5" },
      ],
      lineChart: "Vendas dos últimos 30 dias",
      donut: { title: "Mais vendidos", items: ["Bolo de chocolate", "Brigadeiro", "Torta de limão", "Brownie"] },
      table: {
        title: "Próximas entregas",
        columns: ["Cliente", "Produto", "Data", "Status"],
        statuses: ["Em preparo", "Pronto", "Entregue"],
      },
      agenda: {
        title: "Agenda de produção",
        items: [
          "07:00 Massa de pão de mel · Lote 12",
          "09:30 Bolo de casamento · Mariana",
          "13:00 Brigadeiros (100 un.) · Festa Lucas",
          "16:00 Entrega de tortas · Café Central",
        ],
      },
      form: {
        title: "Nova encomenda",
        fields: ["Cliente", "Telefone", "Produto", "Sabor", "Quantidade", "Data de entrega", "Observações"],
        primaryAction: "Salvar encomenda",
      },
      pos: {
        title: "Caixa",
        products: [
          "Bolo de chocolate R$ 89,90",
          "Brigadeiro R$ 3,50",
          "Torta de limão R$ 64,00",
          "Brownie R$ 9,00",
          "Cupcake R$ 8,50",
          "Pão de mel R$ 6,00",
        ],
        total: "R$ 142,40",
      },
      reports: {
        title: "Relatórios",
        charts: ["Faturamento por mês", "Vendas por categoria", "Ticket médio por dia da semana"],
      },
      userName: "Ana",
      mobileTabs: ["Painel", "Pedidos", "Produtos", "Estoque", "Mais"],
    },
    en: {
      nav: ["Dashboard", "Orders", "Custom Orders", "Products", "Recipes", "Inventory", "Customers", "Finance"],
      kpis: [
        { label: "Orders today", value: "48" },
        { label: "Monthly revenue", value: "$18,450" },
        { label: "Orders this week", value: "23" },
        { label: "Low-stock ingredients", value: "5" },
      ],
      lineChart: "Sales in the last 30 days",
      donut: { title: "Best sellers", items: ["Chocolate cake", "Brigadeiro", "Lemon pie", "Brownie"] },
      table: {
        title: "Upcoming deliveries",
        columns: ["Customer", "Product", "Date", "Status"],
        statuses: ["In preparation", "Ready", "Delivered"],
      },
      agenda: {
        title: "Production schedule",
        items: [
          "07:00 Honey cake dough · Batch 12",
          "09:30 Wedding cake · Mariana",
          "13:00 Brigadeiros (100 pcs) · Lucas party",
          "16:00 Pie delivery · Central Café",
        ],
      },
      form: {
        title: "New custom order",
        fields: ["Customer", "Phone", "Product", "Flavor", "Quantity", "Delivery date", "Notes"],
        primaryAction: "Save order",
      },
      pos: {
        title: "Checkout",
        products: [
          "Chocolate cake $24.90",
          "Brigadeiro $1.50",
          "Lemon pie $18.00",
          "Brownie $3.00",
          "Cupcake $2.50",
          "Honey cake $2.00",
        ],
        total: "$42.40",
      },
      reports: {
        title: "Reports",
        charts: ["Revenue by month", "Sales by category", "Average ticket by weekday"],
      },
      userName: "Ana",
      mobileTabs: ["Home", "Orders", "Products", "Inventory", "More"],
    },
  },
};

export const SEGMENTS: SegmentPreset[] = [BAKERY, ...EXTRA_SEGMENTS];

export function findSegment(id: string): SegmentPreset | undefined {
  return SEGMENTS.find((s) => s.id === id);
}
