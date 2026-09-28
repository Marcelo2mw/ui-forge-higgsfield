# UI Forge

> **Não tem chave da Higgsfield API?** Crie a sua aqui: `{{LINK_DE_INDICACAO}}`

Gere telas de sistema (dashboard, agenda, lista, cadastro, caixa, relatórios, login) em **vários estilos de design ao mesmo tempo** e compare **vários modelos de IA lado a lado**, com o custo de cada imagem na tela.

Escolha o negócio (doceria, salão, oficina, clínica…), marque os estilos (glassmorfismo, neumorfismo, claymorfismo, soft UI, flat e mais sete), a tipografia e os modelos. O UI Forge monta os prompts, dispara tudo em paralelo e organiza o resultado numa grade **estilo × modelo**. Você marca a melhor de cada estilo e exporta, ou leva direto para uma IA de código com o **texto para código**.

*English summary below.*

---

## Baixar e instalar (Windows 10/11)

**[⬇ Baixar o instalador (UI-Forge-Setup-x64.exe)](https://github.com/Marcelo2mw/ui-forge-higgsfield/releases/latest/download/UI-Forge-Setup-x64.exe)**

Ou veja todas as versões em [Releases](https://github.com/Marcelo2mw/ui-forge-higgsfield/releases).

1. Abra o arquivo baixado.
2. O Windows vai mostrar **"O Windows protegeu o computador"**. Clique em **Mais informações** → **Executar assim mesmo**. O aviso aparece porque o instalador não tem assinatura digital paga; o código está todo aqui, e você pode compilar o seu (veja [Desenvolvimento](#desenvolvimento)).
3. Siga o instalador. Ele instala só para o seu usuário (não pede senha de administrador) e cria um atalho no menu Iniciar. Se faltar o WebView2 no computador, ele é baixado automaticamente.

Também tem a versão **`.msi`** na página da release, para quem instala por política de TI.

- **Atualizar:** baixe a versão nova e instale por cima. Suas imagens e o histórico continuam lá.
- **Desinstalar:** Configurações do Windows → Aplicativos → UI Forge → Desinstalar. Para apagar também as imagens e o histórico, remova a pasta `%LOCALAPPDATA%\com.uiforge.app`.
- **macOS e Linux:** ainda não tem instalador pronto; dá para compilar a partir do código (veja [Desenvolvimento](#desenvolvimento)).

## Como usar

1. **Instale** o app (acima).
2. **Crie sua chave** em [console.higgsfield.ai](https://console.higgsfield.ai) → *API Keys*. Anote o **Key ID** e o **Key Secret** (o secret só aparece uma vez).
3. Abra o UI Forge → **Configurações** → cole o Key ID e o Key Secret → **Testar**.
4. Na barra lateral, escolha segmento, tela, estilos, tipografia e modelos. A estimativa de custo aparece no topo. Clique em **Gerar**.
5. Abra a imagem que você mais gostou e clique em **Texto para código** (veja abaixo).

> O app funciona melhor numa tela grande: a grade compara muitas imagens de uma vez.

## Da imagem ao código

A imagem gerada é a inspiração de design; o **texto para código** é o que transforma essa inspiração num projeto. Ele vai junto com a imagem para o Claude Code (ou outra IA de código) e descreve a intenção por trás dela:

- o estilo de design, com as regras de CSS de cada um (vidro fosco, relevo do neumorfismo, sombra dura do neubrutalismo…);
- os tokens: cor de destaque e paleta em hex, fontes do Google Fonts, espaçamento;
- a estrutura da tela com os textos reais (menu, KPIs, colunas, status);
- comportamento, responsividade, acessibilidade e a stack de entrega (**HTML, CSS e JS**, **React + Tailwind** ou **o seu projeto**).

Use **Copiar texto** e cole junto com a imagem, ou **Salvar pacote** para gravar `design-reference.png` + `design-prompt.md` numa pasta. Salve dentro do projeto e peça à IA: *"siga o design-prompt.md"*. O texto é montado a partir da configuração que gerou a imagem, sem chamar nenhum modelo e sem custo.

### Modos de geração

| Modo | Para quem | Cobrança |
|---|---|---|
| **Higgsfield API** | Qualquer pessoa com uma chave da API | Carteira pay-as-you-go em US$, por imagem |
| **Higgsfield CLI** | Quem já assina um plano da Higgsfield e tem o [CLI](https://www.npmjs.com/package/@higgsfield/cli) instalado e logado | Créditos do plano |
| **Simulação** | Testar a interface | Grátis (imagens de mentira) |

Falhas e imagens bloqueadas pela moderação **não são cobradas**.

## Estilos e modelos

Os prompts dos cinco primeiros estilos foram calibrados gerando o mesmo dashboard em vários modelos. O resultado do estudo de calibração (texto em português, 16:9):

| Modelo | Resultado para UI | Observação |
|---|---|---|
| GPT Image 2.5 | ótimo | melhor custo-benefício |
| Nano Banana Pro | ótimo | o melhor em claymorfismo/3D |
| Grok Image 2.0 | ótimo | layout limpo |
| Marketing Studio Image | ótimo | modelo da própria Higgsfield |
| Seedream 5.0 Pro | bom | alta resolução, às vezes erra datas e números |
| Recraft V4.1 | bom | texto correto, estilo menos consistente |
| FLUX.2, Kling O1, Soul 2 | fraco para UI | texto embaralhado (o Soul 2 é um modelo fotográfico) |

No modo API, só aparecem os modelos com endpoint confirmado no catálogo da API.

## Segurança

- A chave da API fica no **cofre do sistema** (Gerenciador de Credenciais do Windows / Keychain do macOS). Nunca é salva em arquivo e nunca é enviada para a interface.
- O **Log** mostra cada requisição e resposta com o header mascarado (`Authorization: Key ****:****`).
- Tudo fica no seu computador: imagens e histórico em `%LOCALAPPDATA%\com.uiforge.app\runs`.

## Desenvolvimento

Quer mudar alguma coisa, criar estilos novos ou compilar para macOS/Linux? Clone o repositório.

Pré-requisitos: [Node 20+](https://nodejs.org), [pnpm](https://pnpm.io), [Rust](https://rustup.rs) e os [pré-requisitos do Tauri](https://tauri.app/start/prerequisites/).

```bash
git clone https://github.com/Marcelo2mw/ui-forge-higgsfield.git
cd ui-forge-higgsfield
pnpm install
pnpm tauri dev        # abre o app em modo desenvolvimento
pnpm test             # testes do gerador de prompts e do texto para código (Vitest)
cd src-tauri && cargo test   # testes do backend (Rust)
pnpm tauri build      # gera o instalador em src-tauri/target/release/bundle/
```

Para desenvolver sem gastar nada, use o modo **Simulação** nas configurações. Para usar a API sem o cofre do sistema, defina `HF_API_KEY_ID` e `HF_API_KEY_SECRET` no ambiente.

Estrutura:

```
src/                 React + TypeScript (interface, presets, gerador de prompts)
  presets/           segmentos, estilos (com as regras de CSS), telas, tipografia
  prompt/build.ts    montagem dos prompts de imagem
  prompt/handoff.ts  texto para código (handoff para a IA de código)
  registry/models.ts modelos, parâmetros e endpoints
src-tauri/src/       Rust (fila de jobs, providers CLI/API/simulação, histórico)
```

---

## English

UI Forge generates business-software screens (dashboard, schedule, list, form, checkout, reports, login) in **many design styles at once** and compares **several AI image models side by side**, showing the cost of each image.

1. **[Download the Windows installer](https://github.com/Marcelo2mw/ui-forge-higgsfield/releases/latest/download/UI-Forge-Setup-x64.exe)** (or see all [Releases](https://github.com/Marcelo2mw/ui-forge-higgsfield/releases)). The installer is not code-signed, so Windows SmartScreen will warn you: click **More info** → **Run anyway**. It installs per user, without admin rights.
2. Create an API key at [console.higgsfield.ai](https://console.higgsfield.ai) → *API Keys*.
3. Open UI Forge → **Settings** → paste your Key ID and Key Secret → **Test**.
4. Pick a business, a screen, styles, typography and models, then click **Generate**.
5. Open your favorite image and click **Text for code**: it writes a handoff (design style with CSS rules, tokens, fonts, screen structure, behavior and delivery stack) to give Claude Code or any coding AI together with the image, so it can build a working HTML/CSS/JS or React prototype.

The interface is available in Portuguese and English (Settings → Interface language). The API key is stored in the OS credential vault and never reaches the UI; the log masks the authorization header. To change the code or build for macOS/Linux, clone the repo and see *Desenvolvimento* above.

## Licença / License

[MIT](LICENSE)
