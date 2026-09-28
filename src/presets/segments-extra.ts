import type { SegmentPreset } from "@/domain/types";

// Segmentos adicionais no mesmo formato da Doceria (ver segments.ts).
// Marcas inventadas; cada nome foi pesquisado na web em 2026-09-28 sem encontrar empresa, rede ou marca com o mesmo nome.

const TOOL_INVENTORY: SegmentPreset = {
  id: "tool-inventory",
  label: { "pt-BR": "Gestão de Ferramentas", en: "Tool Management" },
  business: "industrial tool crib and warehouse",
  logoHint: "toolbox",
  brand: "Metalúrgica Boa Liga",
  accent: "#EA580C",
  content: {
    "pt-BR": {
      nav: ["Painel", "Ferramentas", "Empréstimos", "Calibração", "Manutenção", "Estoque", "Colaboradores", "Relatórios"],
      kpis: [
        { label: "Ferramentas emprestadas", value: "37" },
        { label: "Valor do inventário", value: "R$ 286.900" },
        { label: "Calibrações a vencer", value: "6" },
        { label: "Em manutenção", value: "9" },
      ],
      lineChart: "Empréstimos dos últimos 30 dias",
      donut: { title: "Mais emprestadas", items: ["Furadeiras", "Torquímetros", "Multímetros", "Esmerilhadeiras"] },
      table: {
        title: "Controle de ferramentas",
        columns: ["Ferramenta", "Código", "Responsável", "Status"],
        statuses: ["Emprestada", "Disponível", "Em manutenção"],
      },
      agenda: {
        title: "Agenda do almoxarifado",
        items: [
          "07:30 Retirada de kit elétrico · Leandro",
          "10:00 Calibração de torquímetros · Metrologia",
          "13:30 Devolução de esmerilhadeira · Pedro",
          "16:00 Manutenção preventiva · Compressor 02",
        ],
      },
      form: {
        title: "Novo empréstimo",
        fields: ["Colaborador", "Setor", "Ferramenta", "Código", "Data de retirada", "Previsão de devolução", "Observações"],
        primaryAction: "Registrar empréstimo",
      },
      pos: {
        title: "Requisição de materiais",
        products: [
          "Disco de corte R$ 12,90",
          "Broca 8 mm R$ 18,50",
          "Luva de vaqueta R$ 16,90",
          "Fita isolante R$ 7,90",
          "Trena 5 m R$ 34,90",
          "Alicate universal R$ 49,90",
        ],
        total: "R$ 135,30",
      },
      reports: {
        title: "Relatórios",
        charts: ["Empréstimos por setor", "Custo de manutenção por mês", "Ferramentas mais utilizadas"],
      },
      userName: "Carlos",
      mobileTabs: ["Painel", "Ferramentas", "Empréstimos", "Estoque", "Mais"],
    },
    en: {
      nav: ["Dashboard", "Tools", "Checkouts", "Calibration", "Maintenance", "Inventory", "Employees", "Reports"],
      kpis: [
        { label: "Tools checked out", value: "37" },
        { label: "Inventory value", value: "$286,900" },
        { label: "Calibrations due", value: "6" },
        { label: "Tools in repair", value: "9" },
      ],
      lineChart: "Checkouts in the last 30 days",
      donut: { title: "Most checked out", items: ["Drills", "Torque wrenches", "Multimeters", "Angle grinders"] },
      table: {
        title: "Tool tracking",
        columns: ["Tool", "Asset ID", "Assigned to", "Status"],
        statuses: ["Checked out", "Available", "In repair"],
      },
      agenda: {
        title: "Tool crib schedule",
        items: [
          "07:30 Electrical kit pickup · Leandro",
          "10:00 Torque wrench calibration · Metrology lab",
          "13:30 Grinder return · Pedro",
          "16:00 Preventive maintenance · Compressor 02",
        ],
      },
      form: {
        title: "New checkout",
        fields: ["Employee", "Department", "Tool", "Asset ID", "Checkout date", "Expected return", "Notes"],
        primaryAction: "Confirm checkout",
      },
      pos: {
        title: "Supply requisition",
        products: [
          "Cutting wheel $3.50",
          "Drill bit $6.90",
          "Work gloves $8.90",
          "Electrical tape $2.90",
          "Tape measure $14.90",
          "Pliers $12.90",
        ],
        total: "$44.70",
      },
      reports: {
        title: "Reports",
        charts: ["Checkouts by department", "Monthly maintenance cost", "Most used tools"],
      },
      userName: "Carlos",
      mobileTabs: ["Home", "Tools", "Checkouts", "Inventory", "More"],
    },
  },
};

const BEAUTY_SALON: SegmentPreset = {
  id: "beauty-salon",
  label: { "pt-BR": "Salão de Beleza", en: "Beauty Salon" },
  business: "beauty salon",
  logoHint: "stylized scissors and comb",
  brand: "Studio Ondas de Mel",
  accent: "#9333EA",
  content: {
    "pt-BR": {
      nav: ["Painel", "Agenda", "Clientes", "Serviços", "Profissionais", "Produtos", "Comissões", "Financeiro"],
      kpis: [
        { label: "Atendimentos hoje", value: "32" },
        { label: "Faturamento do mês", value: "R$ 24.780" },
        { label: "Taxa de ocupação", value: "86%" },
        { label: "Novos clientes", value: "18" },
      ],
      lineChart: "Faturamento dos últimos 30 dias",
      donut: { title: "Serviços mais procurados", items: ["Corte", "Coloração", "Manicure", "Escova"] },
      table: {
        title: "Próximos atendimentos",
        columns: ["Cliente", "Serviço", "Profissional", "Status"],
        statuses: ["Confirmado", "Em atendimento", "Concluído"],
      },
      agenda: {
        title: "Agenda de hoje",
        items: [
          "09:00 Corte e escova · Vanessa",
          "10:30 Coloração · Tatiane",
          "13:00 Manicure e pedicure · Luana",
          "15:30 Escova progressiva · Carla",
        ],
      },
      form: {
        title: "Novo agendamento",
        fields: ["Cliente", "Telefone", "Serviço", "Profissional", "Data", "Horário", "Observações"],
        primaryAction: "Confirmar agendamento",
      },
      pos: {
        title: "Caixa",
        products: [
          "Corte feminino R$ 90,00",
          "Escova R$ 55,00",
          "Coloração R$ 180,00",
          "Manicure R$ 35,00",
          "Hidratação R$ 70,00",
          "Máscara capilar R$ 69,90",
        ],
        total: "R$ 195,00",
      },
      reports: {
        title: "Relatórios",
        charts: ["Faturamento por profissional", "Serviços por categoria", "Taxa de retorno de clientes"],
      },
      userName: "Juliana",
      mobileTabs: ["Painel", "Agenda", "Clientes", "Caixa", "Mais"],
    },
    en: {
      nav: ["Dashboard", "Calendar", "Clients", "Services", "Staff", "Products", "Commissions", "Finance"],
      kpis: [
        { label: "Appointments today", value: "32" },
        { label: "Monthly revenue", value: "$24,780" },
        { label: "Booking rate", value: "86%" },
        { label: "New clients", value: "18" },
      ],
      lineChart: "Revenue in the last 30 days",
      donut: { title: "Top services", items: ["Haircut", "Color", "Manicure", "Blowout"] },
      table: {
        title: "Upcoming appointments",
        columns: ["Client", "Service", "Stylist", "Status"],
        statuses: ["Confirmed", "In progress", "Completed"],
      },
      agenda: {
        title: "Today's schedule",
        items: [
          "09:00 Cut & blowout · Vanessa",
          "10:30 Hair color · Tatiane",
          "13:00 Mani-pedi · Luana",
          "15:30 Keratin treatment · Carla",
        ],
      },
      form: {
        title: "New appointment",
        fields: ["Client", "Phone", "Service", "Stylist", "Date", "Time", "Notes"],
        primaryAction: "Book appointment",
      },
      pos: {
        title: "Checkout",
        products: [
          "Women's haircut $65.00",
          "Blowout $45.00",
          "Hair color $120.00",
          "Manicure $25.00",
          "Deep conditioning $40.00",
          "Hair mask $24.90",
        ],
        total: "$130.00",
      },
      reports: {
        title: "Reports",
        charts: ["Revenue by stylist", "Services by category", "Client return rate"],
      },
      userName: "Juliana",
      mobileTabs: ["Home", "Calendar", "Clients", "Checkout", "More"],
    },
  },
};

const BARBERSHOP: SegmentPreset = {
  id: "barbershop",
  label: { "pt-BR": "Barbearia", en: "Barbershop" },
  business: "barbershop",
  logoHint: "straight razor",
  brand: "Navalha de Cobre",
  accent: "#CA8A04",
  content: {
    "pt-BR": {
      nav: ["Painel", "Agenda", "Clientes", "Serviços", "Barbeiros", "Assinaturas", "Produtos", "Financeiro"],
      kpis: [
        { label: "Atendimentos hoje", value: "27" },
        { label: "Faturamento do mês", value: "R$ 28.940" },
        { label: "Assinantes ativos", value: "64" },
        { label: "Ticket médio", value: "R$ 48,90" },
      ],
      lineChart: "Atendimentos dos últimos 30 dias",
      donut: { title: "Serviços mais vendidos", items: ["Corte", "Barba", "Corte + barba", "Sobrancelha"] },
      table: {
        title: "Próximos clientes",
        columns: ["Cliente", "Serviço", "Barbeiro", "Status"],
        statuses: ["Aguardando", "Em atendimento", "Finalizado"],
      },
      agenda: {
        title: "Horários de hoje",
        items: [
          "09:00 Corte degradê · Lucas",
          "10:00 Barba · Diego",
          "11:30 Corte + barba · Thiago",
          "14:00 Platinado · Gabriel",
        ],
      },
      form: {
        title: "Cadastro de cliente",
        fields: ["Nome completo", "Telefone", "Data de nascimento", "Barbeiro preferido", "Plano", "Observações"],
        primaryAction: "Salvar cliente",
      },
      pos: {
        title: "Caixa",
        products: [
          "Corte R$ 45,00",
          "Barba R$ 35,00",
          "Corte + barba R$ 70,00",
          "Sobrancelha R$ 15,00",
          "Pomada modeladora R$ 39,90",
          "Óleo para barba R$ 34,90",
        ],
        total: "R$ 109,90",
      },
      reports: {
        title: "Relatórios",
        charts: ["Faturamento por barbeiro", "Atendimentos por dia da semana", "Evolução de assinantes"],
      },
      userName: "Rafael",
      mobileTabs: ["Painel", "Agenda", "Clientes", "Caixa", "Mais"],
    },
    en: {
      nav: ["Dashboard", "Calendar", "Clients", "Services", "Barbers", "Memberships", "Products", "Finance"],
      kpis: [
        { label: "Appointments today", value: "27" },
        { label: "Monthly revenue", value: "$19,860" },
        { label: "Active members", value: "64" },
        { label: "Average ticket", value: "$33.50" },
      ],
      lineChart: "Appointments in the last 30 days",
      donut: { title: "Top services", items: ["Haircut", "Beard trim", "Cut & beard", "Hot towel shave"] },
      table: {
        title: "Next in line",
        columns: ["Client", "Service", "Barber", "Status"],
        statuses: ["Waiting", "In the chair", "Done"],
      },
      agenda: {
        title: "Today's bookings",
        items: [
          "09:00 Skin fade · Lucas",
          "10:00 Beard trim · Diego",
          "11:30 Cut & beard · Thiago",
          "14:00 Hot towel shave · Gabriel",
        ],
      },
      form: {
        title: "New client",
        fields: ["Full name", "Phone", "Birthday", "Preferred barber", "Membership", "Notes"],
        primaryAction: "Save client",
      },
      pos: {
        title: "Checkout",
        products: [
          "Haircut $30.00",
          "Beard trim $20.00",
          "Cut & beard $45.00",
          "Hot towel shave $35.00",
          "Styling pomade $18.00",
          "Beard oil $16.00",
        ],
        total: "$63.00",
      },
      reports: {
        title: "Reports",
        charts: ["Revenue by barber", "Appointments by weekday", "Membership growth"],
      },
      userName: "Rafael",
      mobileTabs: ["Home", "Calendar", "Clients", "Checkout", "More"],
    },
  },
};

const CLINIC: SegmentPreset = {
  id: "clinic",
  label: { "pt-BR": "Clínica / Consultório", en: "Clinic / Practice" },
  business: "medical clinic and doctor's office",
  logoHint: "stethoscope",
  brand: "Clínica Serra Clara",
  accent: "#0D9488",
  content: {
    "pt-BR": {
      nav: ["Painel", "Agenda", "Pacientes", "Prontuários", "Convênios", "Profissionais", "Financeiro", "Relatórios"],
      kpis: [
        { label: "Consultas hoje", value: "42" },
        { label: "Faturamento do mês", value: "R$ 68.900" },
        { label: "Taxa de faltas", value: "7%" },
        { label: "Novos pacientes", value: "56" },
      ],
      lineChart: "Consultas dos últimos 30 dias",
      donut: { title: "Consultas por especialidade", items: ["Clínica geral", "Cardiologia", "Dermatologia", "Pediatria"] },
      table: {
        title: "Pacientes do dia",
        columns: ["Paciente", "Profissional", "Horário", "Status"],
        statuses: ["Aguardando", "Em consulta", "Atendido"],
      },
      agenda: {
        title: "Agenda do dia",
        items: [
          "08:00 Consulta de rotina · Helena",
          "09:30 Retorno · Jorge",
          "11:00 Eletrocardiograma · Sandra",
          "14:30 Primeira consulta · Roberto",
        ],
      },
      form: {
        title: "Cadastro de paciente",
        fields: ["Nome completo", "CPF", "Data de nascimento", "Telefone", "E-mail", "Convênio", "Nº da carteirinha"],
        primaryAction: "Cadastrar paciente",
      },
      pos: {
        title: "Caixa",
        products: [
          "Consulta particular R$ 250,00",
          "Teleconsulta R$ 180,00",
          "Eletrocardiograma R$ 120,00",
          "Holter 24h R$ 280,00",
          "Vacina da gripe R$ 110,00",
          "Curativo R$ 60,00",
        ],
        total: "R$ 370,00",
      },
      reports: {
        title: "Relatórios",
        charts: ["Atendimentos por profissional", "Faturamento por convênio", "Taxa de faltas por mês"],
      },
      userName: "Fernanda",
      mobileTabs: ["Painel", "Agenda", "Pacientes", "Prontuários", "Mais"],
    },
    en: {
      nav: ["Dashboard", "Schedule", "Patients", "Medical records", "Insurance", "Providers", "Billing", "Reports"],
      kpis: [
        { label: "Appointments today", value: "42" },
        { label: "Monthly revenue", value: "$112,400" },
        { label: "No-show rate", value: "7%" },
        { label: "New patients", value: "56" },
      ],
      lineChart: "Appointments in the last 30 days",
      donut: { title: "Visits by specialty", items: ["Primary care", "Cardiology", "Dermatology", "Pediatrics"] },
      table: {
        title: "Today's patients",
        columns: ["Patient", "Provider", "Time", "Status"],
        statuses: ["Waiting", "In exam", "Completed"],
      },
      agenda: {
        title: "Today's schedule",
        items: [
          "08:00 Annual checkup · Helena",
          "09:30 Follow-up visit · Jorge",
          "11:00 EKG · Sandra",
          "14:30 New patient visit · Roberto",
        ],
      },
      form: {
        title: "New patient",
        fields: ["Full name", "Date of birth", "Phone", "Email", "Address", "Insurance provider", "Member ID"],
        primaryAction: "Save patient",
      },
      pos: {
        title: "Checkout",
        products: [
          "Office visit $150.00",
          "Telehealth visit $95.00",
          "EKG $80.00",
          "Holter monitor $210.00",
          "Flu shot $40.00",
          "Wound dressing $45.00",
        ],
        total: "$230.00",
      },
      reports: {
        title: "Reports",
        charts: ["Visits by provider", "Revenue by insurance plan", "Monthly no-show rate"],
      },
      userName: "Fernanda",
      mobileTabs: ["Home", "Schedule", "Patients", "Records", "More"],
    },
  },
};

const GYM: SegmentPreset = {
  id: "gym",
  label: { "pt-BR": "Academia", en: "Gym / Fitness" },
  business: "gym and fitness center",
  logoHint: "dumbbell",
  brand: "Academia Ponto de Força",
  accent: "#DC2626",
  content: {
    "pt-BR": {
      nav: ["Painel", "Alunos", "Planos", "Aulas", "Treinos", "Avaliações", "Financeiro", "Relatórios"],
      kpis: [
        { label: "Alunos ativos", value: "486" },
        { label: "Faturamento do mês", value: "R$ 53.460" },
        { label: "Check-ins hoje", value: "213" },
        { label: "Inadimplência", value: "4,8%" },
      ],
      lineChart: "Check-ins dos últimos 30 dias",
      donut: { title: "Alunos por plano", items: ["Mensal", "Trimestral", "Semestral", "Anual"] },
      table: {
        title: "Matrículas recentes",
        columns: ["Aluno", "Plano", "Vencimento", "Status"],
        statuses: ["Ativo", "Pendente", "Vencido"],
      },
      agenda: {
        title: "Aulas de hoje",
        items: [
          "07:00 Bike indoor · Prof. Rodrigo",
          "10:00 Avaliação física · Bianca",
          "18:30 Funcional · Prof. Aline",
          "19:30 Muay Thai · Prof. Diego",
        ],
      },
      form: {
        title: "Nova matrícula",
        fields: ["Nome completo", "CPF", "Data de nascimento", "Telefone", "Plano", "Forma de pagamento", "Objetivo"],
        primaryAction: "Confirmar matrícula",
      },
      pos: {
        title: "Caixa",
        products: [
          "Plano mensal R$ 119,90",
          "Diária R$ 30,00",
          "Avaliação física R$ 60,00",
          "Whey protein 900 g R$ 149,90",
          "Barra de proteína R$ 12,90",
          "Squeeze R$ 29,90",
        ],
        total: "R$ 269,80",
      },
      reports: {
        title: "Relatórios",
        charts: ["Matrículas por mês", "Frequência por horário", "Cancelamentos por mês"],
      },
      userName: "Bruno",
      mobileTabs: ["Painel", "Alunos", "Aulas", "Treinos", "Mais"],
    },
    en: {
      nav: ["Dashboard", "Members", "Plans", "Classes", "Workouts", "Assessments", "Billing", "Reports"],
      kpis: [
        { label: "Active members", value: "486" },
        { label: "Monthly revenue", value: "$23,810" },
        { label: "Check-ins today", value: "213" },
        { label: "Past-due rate", value: "4.8%" },
      ],
      lineChart: "Check-ins in the last 30 days",
      donut: { title: "Members by plan", items: ["Monthly", "3-month", "6-month", "Annual"] },
      table: {
        title: "Recent sign-ups",
        columns: ["Member", "Plan", "Next billing", "Status"],
        statuses: ["Active", "Pending", "Past due"],
      },
      agenda: {
        title: "Today's classes",
        items: [
          "07:00 Indoor cycling · Coach Rodrigo",
          "10:00 Fitness assessment · Bianca",
          "18:30 Functional training · Coach Aline",
          "19:30 Muay Thai · Coach Diego",
        ],
      },
      form: {
        title: "New membership",
        fields: ["Full name", "Date of birth", "Phone", "Email", "Plan", "Payment method", "Fitness goal"],
        primaryAction: "Create membership",
      },
      pos: {
        title: "Front desk",
        products: [
          "Monthly plan $49.00",
          "Day pass $15.00",
          "Fitness assessment $35.00",
          "Whey protein 2 lb $39.90",
          "Protein bar $3.50",
          "Water bottle $14.90",
        ],
        total: "$88.90",
      },
      reports: {
        title: "Reports",
        charts: ["New sign-ups by month", "Attendance by hour", "Cancellations by month"],
      },
      userName: "Bruno",
      mobileTabs: ["Home", "Members", "Classes", "Workouts", "More"],
    },
  },
};

const PET_SHOP: SegmentPreset = {
  id: "pet-shop",
  label: { "pt-BR": "Pet Shop / Veterinária", en: "Pet Shop / Vet" },
  business: "pet shop and veterinary clinic",
  logoHint: "paw print",
  brand: "Latido & Ronrom",
  accent: "#65A30D",
  content: {
    "pt-BR": {
      nav: ["Painel", "Agenda", "Tutores", "Pets", "Banho/Tosa", "Veterinária", "Produtos", "Financeiro"],
      kpis: [
        { label: "Atendimentos hoje", value: "38" },
        { label: "Faturamento do mês", value: "R$ 31.640" },
        { label: "Banhos hoje", value: "24" },
        { label: "Vacinas a vencer", value: "15" },
      ],
      lineChart: "Faturamento dos últimos 30 dias",
      donut: { title: "Faturamento por categoria", items: ["Ração", "Banho e tosa", "Consultas", "Acessórios"] },
      table: {
        title: "Atendimentos de hoje",
        columns: ["Pet", "Tutor", "Serviço", "Status"],
        statuses: ["Aguardando", "Em atendimento", "Pronto"],
      },
      agenda: {
        title: "Agenda de hoje",
        items: [
          "08:30 Banho e tosa · Mel",
          "10:00 Consulta · Pipoca",
          "11:30 Vacina V10 · Max",
          "15:00 Tosa higiênica · Luna",
        ],
      },
      form: {
        title: "Cadastro de pet",
        fields: ["Nome do pet", "Espécie", "Raça", "Porte", "Data de nascimento", "Tutor", "Telefone", "Observações"],
        primaryAction: "Cadastrar pet",
      },
      pos: {
        title: "Caixa",
        products: [
          "Ração 15 kg R$ 189,90",
          "Banho R$ 55,00",
          "Tosa R$ 70,00",
          "Consulta R$ 150,00",
          "Antipulgas R$ 89,90",
          "Petisco R$ 14,90",
        ],
        total: "R$ 259,80",
      },
      reports: {
        title: "Relatórios",
        charts: ["Faturamento por mês", "Banhos por porte", "Vacinas aplicadas por mês"],
      },
      userName: "Camila",
      mobileTabs: ["Painel", "Agenda", "Pets", "Caixa", "Mais"],
    },
    en: {
      nav: ["Dashboard", "Calendar", "Owners", "Pets", "Grooming", "Vet clinic", "Products", "Finance"],
      kpis: [
        { label: "Appointments today", value: "38" },
        { label: "Monthly revenue", value: "$31,640" },
        { label: "Grooming today", value: "24" },
        { label: "Vaccines due", value: "15" },
      ],
      lineChart: "Revenue in the last 30 days",
      donut: { title: "Revenue by category", items: ["Pet food", "Grooming", "Vet visits", "Accessories"] },
      table: {
        title: "Today's appointments",
        columns: ["Pet", "Owner", "Service", "Status"],
        statuses: ["Checked in", "In progress", "Ready for pickup"],
      },
      agenda: {
        title: "Today's schedule",
        items: [
          "08:30 Full groom · Bella",
          "10:00 Vet exam · Charlie",
          "11:30 Vaccine booster · Max",
          "15:00 Sanitary trim · Luna",
        ],
      },
      form: {
        title: "New pet profile",
        fields: ["Pet name", "Species", "Breed", "Size", "Date of birth", "Owner", "Phone", "Notes"],
        primaryAction: "Save pet",
      },
      pos: {
        title: "Checkout",
        products: [
          "Dog food 30 lb $54.90",
          "Bath $35.00",
          "Full groom $65.00",
          "Vet exam $65.00",
          "Flea treatment $39.90",
          "Dog treats $8.90",
        ],
        total: "$98.80",
      },
      reports: {
        title: "Reports",
        charts: ["Revenue by month", "Grooming by pet size", "Vaccines given per month"],
      },
      userName: "Camila",
      mobileTabs: ["Home", "Calendar", "Pets", "Checkout", "More"],
    },
  },
};

const RESTAURANT: SegmentPreset = {
  id: "restaurant",
  label: { "pt-BR": "Restaurante / Delivery", en: "Restaurant / Delivery" },
  business: "restaurant with delivery",
  logoHint: "chef hat",
  brand: "Coentro & Limão",
  accent: "#16A34A",
  content: {
    "pt-BR": {
      nav: ["Painel", "Pedidos", "Delivery", "Mesas", "Cardápio", "Estoque", "Clientes", "Financeiro"],
      kpis: [
        { label: "Pedidos hoje", value: "94" },
        { label: "Faturamento do mês", value: "R$ 142.380" },
        { label: "Tempo médio de entrega", value: "32 min" },
        { label: "Mesas ocupadas", value: "14/20" },
      ],
      lineChart: "Pedidos dos últimos 30 dias",
      donut: { title: "Pratos mais vendidos", items: ["Parmegiana", "Feijoada", "Picanha na chapa", "Strogonoff"] },
      table: {
        title: "Pedidos em andamento",
        columns: ["Pedido", "Cliente", "Valor", "Status"],
        statuses: ["Em preparo", "Saiu para entrega", "Entregue"],
      },
      agenda: {
        title: "Agenda do dia",
        items: [
          "09:00 Recebimento de hortifrúti · 12 caixas",
          "12:30 Reserva 8 pessoas · Família Souza",
          "16:00 Entrega de bebidas · Distribuidora",
          "20:00 Reserva 4 pessoas · Ricardo",
        ],
      },
      form: {
        title: "Novo pedido",
        fields: ["Cliente", "Telefone", "Endereço de entrega", "Itens do pedido", "Forma de pagamento", "Troco para", "Observações"],
        primaryAction: "Confirmar pedido",
      },
      pos: {
        title: "Caixa",
        products: [
          "Parmegiana de frango R$ 42,90",
          "Feijoada completa R$ 49,90",
          "Picanha na chapa R$ 79,90",
          "Strogonoff de carne R$ 39,90",
          "Suco natural R$ 9,90",
          "Refrigerante lata R$ 6,50",
        ],
        total: "R$ 139,20",
      },
      reports: {
        title: "Relatórios",
        charts: ["Faturamento por canal", "Pedidos por horário", "Custo de insumos por mês"],
      },
      userName: "Marcos",
      mobileTabs: ["Painel", "Pedidos", "Mesas", "Cardápio", "Mais"],
    },
    en: {
      nav: ["Dashboard", "Orders", "Delivery", "Tables", "Menu", "Inventory", "Customers", "Finance"],
      kpis: [
        { label: "Orders today", value: "94" },
        { label: "Monthly revenue", value: "$98,650" },
        { label: "Avg. delivery time", value: "32 min" },
        { label: "Tables occupied", value: "14/20" },
      ],
      lineChart: "Orders in the last 30 days",
      donut: { title: "Top dishes", items: ["Chicken parmesan", "Feijoada", "Picanha steak", "Beef stroganoff"] },
      table: {
        title: "Active orders",
        columns: ["Order", "Customer", "Total", "Status"],
        statuses: ["Preparing", "Out for delivery", "Delivered"],
      },
      agenda: {
        title: "Today's schedule",
        items: [
          "09:00 Produce delivery · 12 cases",
          "12:30 Reservation for 8 · Souza family",
          "16:00 Beverage delivery · Distributor",
          "20:00 Reservation for 4 · Ricardo",
        ],
      },
      form: {
        title: "New order",
        fields: ["Customer", "Phone", "Delivery address", "Order items", "Payment method", "Tip", "Notes"],
        primaryAction: "Place order",
      },
      pos: {
        title: "Checkout",
        products: [
          "Chicken parmesan $18.90",
          "Feijoada $21.90",
          "Picanha steak $29.90",
          "Beef stroganoff $17.90",
          "Fresh juice $4.90",
          "Soda $2.50",
        ],
        total: "$56.20",
      },
      reports: {
        title: "Reports",
        charts: ["Revenue by channel", "Orders by hour", "Food cost by month"],
      },
      userName: "Marcos",
      mobileTabs: ["Home", "Orders", "Tables", "Menu", "More"],
    },
  },
};

const AUTO_REPAIR: SegmentPreset = {
  id: "auto-repair",
  label: { "pt-BR": "Oficina Mecânica", en: "Auto Repair Shop" },
  business: "auto repair shop",
  logoHint: "car and wrench",
  brand: "Oficina Torque Certo",
  accent: "#2563EB",
  content: {
    "pt-BR": {
      nav: ["Painel", "Agenda", "Orçamentos", "Serviços", "Clientes", "Veículos", "Peças", "Financeiro"],
      kpis: [
        { label: "Carros na oficina", value: "14" },
        { label: "Faturamento do mês", value: "R$ 72.450" },
        { label: "Orçamentos pendentes", value: "9" },
        { label: "Ticket médio", value: "R$ 980" },
      ],
      lineChart: "Serviços dos últimos 30 dias",
      donut: { title: "Serviços mais realizados", items: ["Troca de óleo", "Freios", "Suspensão", "Alinhamento"] },
      table: {
        title: "Veículos na oficina",
        columns: ["Veículo", "Placa", "Serviço", "Status"],
        statuses: ["Aguardando peça", "Em andamento", "Pronto"],
      },
      agenda: {
        title: "Agenda da oficina",
        items: [
          "08:00 Revisão 40 mil km · Eduardo",
          "09:30 Troca de pastilhas · Simone",
          "11:00 Diagnóstico eletrônico · Renato",
          "14:00 Troca de óleo · Vera",
        ],
      },
      form: {
        title: "Nova ordem de serviço",
        fields: ["Cliente", "Telefone", "Placa", "Modelo", "Quilometragem", "Problema relatado", "Previsão de entrega"],
        primaryAction: "Abrir OS",
      },
      pos: {
        title: "Caixa",
        products: [
          "Troca de óleo R$ 189,90",
          "Pastilha de freio R$ 210,00",
          "Filtro de ar R$ 45,00",
          "Alinhamento R$ 90,00",
          "Balanceamento R$ 80,00",
          "Mão de obra R$ 150,00",
        ],
        total: "R$ 404,90",
      },
      reports: {
        title: "Relatórios",
        charts: ["Faturamento por tipo de serviço", "Peças mais vendidas", "Tempo médio por serviço"],
      },
      userName: "Paulo",
      mobileTabs: ["Painel", "Agenda", "Serviços", "Veículos", "Mais"],
    },
    en: {
      nav: ["Dashboard", "Schedule", "Estimates", "Work orders", "Customers", "Vehicles", "Parts", "Finance"],
      kpis: [
        { label: "Cars in the shop", value: "14" },
        { label: "Monthly revenue", value: "$34,630" },
        { label: "Pending estimates", value: "9" },
        { label: "Avg. repair order", value: "$468" },
      ],
      lineChart: "Repairs in the last 30 days",
      donut: { title: "Top services", items: ["Oil change", "Brakes", "Suspension", "Wheel alignment"] },
      table: {
        title: "Vehicles in the shop",
        columns: ["Vehicle", "Plate", "Service", "Status"],
        statuses: ["Waiting on parts", "In progress", "Ready"],
      },
      agenda: {
        title: "Shop schedule",
        items: [
          "08:00 30k-mile service · Eduardo",
          "09:30 Brake pad replacement · Simone",
          "11:00 Engine diagnostics · Renato",
          "14:00 Oil change · Vera",
        ],
      },
      form: {
        title: "New work order",
        fields: ["Customer", "Phone", "License plate", "Make & model", "Mileage", "Reported issue", "Estimated completion"],
        primaryAction: "Create work order",
      },
      pos: {
        title: "Checkout",
        products: [
          "Oil change $69.90",
          "Brake pads $149.00",
          "Air filter $29.90",
          "Wheel alignment $99.00",
          "Tire balancing $49.00",
          "Labor $120.00",
        ],
        total: "$247.80",
      },
      reports: {
        title: "Reports",
        charts: ["Revenue by service type", "Top-selling parts", "Average time per job"],
      },
      userName: "Paulo",
      mobileTabs: ["Home", "Schedule", "Jobs", "Vehicles", "More"],
    },
  },
};

const REAL_ESTATE: SegmentPreset = {
  id: "real-estate",
  label: { "pt-BR": "Imobiliária", en: "Real Estate Agency" },
  business: "real estate agency",
  logoHint: "house with a key",
  brand: "Soleira Imóveis",
  accent: "#0284C7",
  content: {
    "pt-BR": {
      nav: ["Painel", "Imóveis", "Clientes", "Visitas", "Propostas", "Contratos", "Corretores", "Financeiro"],
      kpis: [
        { label: "Imóveis ativos", value: "248" },
        { label: "Visitas agendadas", value: "36" },
        { label: "Propostas em análise", value: "12" },
        { label: "Comissões do mês", value: "R$ 96.400" },
      ],
      lineChart: "Leads dos últimos 30 dias",
      donut: { title: "Imóveis por tipo", items: ["Apartamento", "Casa", "Terreno", "Sala comercial"] },
      table: {
        title: "Carteira de imóveis",
        columns: ["Imóvel", "Bairro", "Valor", "Status"],
        statuses: ["Disponível", "Em negociação", "Vendido"],
      },
      agenda: {
        title: "Compromissos de hoje",
        items: [
          "09:00 Visita apto 2 quartos · Luciana",
          "11:00 Assinatura de contrato · Família Lima",
          "14:00 Visita casa 3 quartos · Henrique",
          "16:30 Avaliação de imóvel · Rua das Flores",
        ],
      },
      form: {
        title: "Cadastro de imóvel",
        fields: ["Tipo de imóvel", "Endereço", "Bairro", "Área (m²)", "Quartos", "Vagas", "Valor de venda", "Proprietário"],
        primaryAction: "Cadastrar imóvel",
      },
      pos: {
        title: "Cobrança de aluguel",
        products: [
          "Aluguel R$ 2.300,00",
          "Condomínio R$ 680,00",
          "IPTU R$ 185,00",
          "Seguro incêndio R$ 32,00",
          "Taxa de vistoria R$ 250,00",
          "Taxa de contrato R$ 400,00",
        ],
        total: "R$ 3.197,00",
      },
      reports: {
        title: "Relatórios",
        charts: ["Vendas e locações por mês", "Visitas por corretor", "Conversão de leads"],
      },
      userName: "Beatriz",
      mobileTabs: ["Painel", "Imóveis", "Visitas", "Clientes", "Mais"],
    },
    en: {
      nav: ["Dashboard", "Listings", "Clients", "Showings", "Offers", "Contracts", "Agents", "Finance"],
      kpis: [
        { label: "Active listings", value: "248" },
        { label: "Scheduled showings", value: "36" },
        { label: "Offers under review", value: "12" },
        { label: "Monthly commissions", value: "$96,400" },
      ],
      lineChart: "Leads in the last 30 days",
      donut: { title: "Listings by type", items: ["Condo", "House", "Land", "Commercial"] },
      table: {
        title: "Current listings",
        columns: ["Property", "Neighborhood", "Price", "Status"],
        statuses: ["Active", "Pending", "Sold"],
      },
      agenda: {
        title: "Today's appointments",
        items: [
          "09:00 2BR condo showing · Luciana",
          "11:00 Contract signing · Lima family",
          "14:00 3BR house showing · Henrique",
          "16:30 Home valuation · Maple Ave",
        ],
      },
      form: {
        title: "New listing",
        fields: ["Property type", "Address", "Neighborhood", "Square feet", "Bedrooms", "Parking", "Asking price", "Owner"],
        primaryAction: "Save listing",
      },
      pos: {
        title: "Rent collection",
        products: [
          "Rent $1,850.00",
          "Parking $75.00",
          "Pet rent $35.00",
          "Utilities $120.00",
          "Late fee $50.00",
          "Lease fee $250.00",
        ],
        total: "$2,080.00",
      },
      reports: {
        title: "Reports",
        charts: ["Sales & rentals by month", "Showings by agent", "Lead conversion rate"],
      },
      userName: "Beatriz",
      mobileTabs: ["Home", "Listings", "Showings", "Clients", "More"],
    },
  },
};

const SCHOOL: SegmentPreset = {
  id: "school",
  label: { "pt-BR": "Escola / Cursos", en: "School / Courses" },
  business: "school and course center",
  logoHint: "open book",
  brand: "Instituto Nova Página",
  accent: "#4F46E5",
  content: {
    "pt-BR": {
      nav: ["Painel", "Alunos", "Turmas", "Matrículas", "Professores", "Frequência", "Notas", "Financeiro"],
      kpis: [
        { label: "Alunos matriculados", value: "612" },
        { label: "Mensalidades recebidas", value: "R$ 186.400" },
        { label: "Frequência média", value: "92%" },
        { label: "Vagas disponíveis", value: "38" },
      ],
      lineChart: "Matrículas nos últimos 12 meses",
      donut: { title: "Alunos por curso", items: ["Inglês", "Espanhol", "Programação", "Robótica"] },
      table: {
        title: "Matrículas recentes",
        columns: ["Aluno", "Curso", "Turma", "Status"],
        statuses: ["Ativa", "Pendente", "Trancada"],
      },
      agenda: {
        title: "Agenda de aulas",
        items: [
          "08:00 Inglês intermediário · Sala 4",
          "10:00 Robótica · Prof. Daniel",
          "14:00 Lógica de programação · Lab 2",
          "19:00 Espanhol básico · Prof. Marta",
        ],
      },
      form: {
        title: "Nova matrícula",
        fields: ["Nome do aluno", "Data de nascimento", "CPF", "Responsável", "Telefone", "Curso", "Turma", "Forma de pagamento"],
        primaryAction: "Matricular aluno",
      },
      pos: {
        title: "Caixa",
        products: [
          "Mensalidade R$ 389,00",
          "Taxa de matrícula R$ 150,00",
          "Material didático R$ 290,00",
          "Kit de robótica R$ 420,00",
          "Uniforme R$ 89,90",
          "Apostila R$ 75,00",
        ],
        total: "R$ 829,00",
      },
      reports: {
        title: "Relatórios",
        charts: ["Matrículas por curso", "Frequência por turma", "Inadimplência por mês"],
      },
      userName: "Renata",
      mobileTabs: ["Painel", "Turmas", "Alunos", "Agenda", "Mais"],
    },
    en: {
      nav: ["Dashboard", "Students", "Classes", "Enrollments", "Teachers", "Attendance", "Grades", "Billing"],
      kpis: [
        { label: "Enrolled students", value: "612" },
        { label: "Tuition collected", value: "$97,850" },
        { label: "Avg. attendance", value: "92%" },
        { label: "Open seats", value: "38" },
      ],
      lineChart: "Enrollments in the last 12 months",
      donut: { title: "Students by course", items: ["ESL", "Spanish", "Coding", "Robotics"] },
      table: {
        title: "Recent enrollments",
        columns: ["Student", "Course", "Class", "Status"],
        statuses: ["Active", "Pending", "On hold"],
      },
      agenda: {
        title: "Class schedule",
        items: [
          "08:00 ESL Intermediate · Room 4",
          "10:00 Robotics · Lab 1",
          "14:00 Intro to Coding · Lab 2",
          "19:00 Spanish I · Room 6",
        ],
      },
      form: {
        title: "New enrollment",
        fields: ["Student name", "Date of birth", "Parent/guardian", "Phone", "Email", "Course", "Class", "Payment method"],
        primaryAction: "Enroll student",
      },
      pos: {
        title: "Front office",
        products: [
          "Monthly tuition $160.00",
          "Registration fee $50.00",
          "Course materials $85.00",
          "Robotics kit $129.00",
          "School T-shirt $18.00",
          "Workbook $24.90",
        ],
        total: "$295.00",
      },
      reports: {
        title: "Reports",
        charts: ["Enrollments by course", "Attendance by class", "Late payments by month"],
      },
      userName: "Renata",
      mobileTabs: ["Home", "Classes", "Students", "Schedule", "More"],
    },
  },
};

const RETAIL_STORE: SegmentPreset = {
  id: "retail-store",
  label: { "pt-BR": "Loja / E-commerce", en: "Retail Store / E-commerce" },
  business: "clothing store and e-commerce",
  logoHint: "shopping bag",
  brand: "Linho & Cetim",
  accent: "#C026D3",
  content: {
    "pt-BR": {
      nav: ["Painel", "Vendas", "Pedidos online", "Produtos", "Estoque", "Clientes", "Promoções", "Financeiro"],
      kpis: [
        { label: "Faturamento do mês", value: "R$ 148.600" },
        { label: "Pedidos online hoje", value: "14" },
        { label: "Ticket médio", value: "R$ 186,90" },
        { label: "Estoque baixo", value: "12" },
      ],
      lineChart: "Vendas dos últimos 30 dias",
      donut: { title: "Vendas por categoria", items: ["Vestidos", "Calças", "Blusas", "Acessórios"] },
      table: {
        title: "Pedidos online",
        columns: ["Pedido", "Cliente", "Valor", "Status"],
        statuses: ["Em separação", "Enviado", "Entregue"],
      },
      agenda: {
        title: "Agenda do dia",
        items: [
          "09:00 Chegada da nova coleção · 6 caixas",
          "11:00 Retirada na loja · Pedido 2048",
          "14:00 Troca de tamanho · Priscila",
          "17:00 Coleta de envios · 18 pacotes",
        ],
      },
      form: {
        title: "Novo produto",
        fields: ["Nome do produto", "Código (SKU)", "Categoria", "Tamanhos", "Cores", "Preço", "Estoque"],
        primaryAction: "Salvar produto",
      },
      pos: {
        title: "Caixa",
        products: [
          "Camiseta básica R$ 59,90",
          "Calça jeans R$ 179,90",
          "Vestido midi R$ 219,90",
          "Blusa de linho R$ 149,90",
          "Tênis casual R$ 249,90",
          "Bolsa transversal R$ 139,90",
        ],
        total: "R$ 359,80",
      },
      reports: {
        title: "Relatórios",
        charts: ["Faturamento por canal", "Produtos mais vendidos", "Giro de estoque por categoria"],
      },
      userName: "Larissa",
      mobileTabs: ["Painel", "Vendas", "Pedidos", "Produtos", "Mais"],
    },
    en: {
      nav: ["Dashboard", "Sales", "Online orders", "Products", "Inventory", "Customers", "Promotions", "Finance"],
      kpis: [
        { label: "Monthly revenue", value: "$63,540" },
        { label: "Online orders today", value: "14" },
        { label: "Avg. order value", value: "$79.90" },
        { label: "Low-stock items", value: "12" },
      ],
      lineChart: "Sales in the last 30 days",
      donut: { title: "Sales by category", items: ["Dresses", "Pants", "Tops", "Accessories"] },
      table: {
        title: "Online orders",
        columns: ["Order", "Customer", "Total", "Status"],
        statuses: ["Processing", "Shipped", "Delivered"],
      },
      agenda: {
        title: "Today's schedule",
        items: [
          "09:00 New collection arrival · 6 boxes",
          "11:00 In-store pickup · Order 2048",
          "14:00 Size exchange · Priscila",
          "17:00 Carrier pickup · 18 packages",
        ],
      },
      form: {
        title: "New product",
        fields: ["Product name", "SKU", "Category", "Sizes", "Colors", "Price", "Stock"],
        primaryAction: "Save product",
      },
      pos: {
        title: "Checkout",
        products: [
          "Basic tee $19.90",
          "Denim jeans $59.90",
          "Midi dress $69.90",
          "Linen blouse $44.90",
          "Casual sneakers $79.90",
          "Crossbody bag $49.90",
        ],
        total: "$119.80",
      },
      reports: {
        title: "Reports",
        charts: ["Revenue by channel", "Best-selling products", "Inventory turnover by category"],
      },
      userName: "Larissa",
      mobileTabs: ["Home", "Sales", "Orders", "Products", "More"],
    },
  },
};

export const EXTRA_SEGMENTS: SegmentPreset[] = [
  TOOL_INVENTORY,
  BEAUTY_SALON,
  BARBERSHOP,
  CLINIC,
  GYM,
  PET_SHOP,
  RESTAURANT,
  AUTO_REPAIR,
  REAL_ESTATE,
  SCHOOL,
  RETAIL_STORE,
];
