# UI Forge

> **Não tem chave da Higgsfield API?** Crie a sua aqui: `{{LINK_DE_INDICACAO}}`

Gere telas de sistema (dashboard, agenda, lista, cadastro, caixa, relatórios, login) em **vários estilos de design ao mesmo tempo** e compare **vários modelos de IA lado a lado**, com o custo de cada imagem na tela.

Escolha o negócio (doceria, salão, oficina, clínica…), marque os estilos (glassmorfismo, neumorfismo, claymorfismo, soft UI, flat e mais sete) e os modelos. O UI Forge monta os prompts, dispara tudo em paralelo e organiza o resultado numa grade **estilo × modelo**. Você marca a melhor de cada estilo e exporta.

*English summary below.*

---

## Como usar

1. **Baixe** o instalador em [Releases](../../releases) (Windows 10/11).
2. **Crie sua chave** em [console.higgsfield.ai](https://console.higgsfield.ai) → *API Keys*. Anote o **Key ID** e o **Key Secret** (o secret só aparece uma vez).
3. Abra o UI Forge → **Configurações** → cole o Key ID e o Key Secret → **Testar**.
4. Na barra lateral, escolha segmento, tela, estilos e modelos. A estimativa de custo aparece no topo. Clique em **Gerar**.

> O app funciona melhor numa tela grande: a grade compara muitas imagens de uma vez.

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

Pré-requisitos: [Node 20+](https://nodejs.org), [pnpm](https://pnpm.io), [Rust](https://rustup.rs) e os [pré-requisitos do Tauri](https://tauri.app/start/prerequisites/).

```bash
pnpm install
pnpm tauri dev        # abre o app em modo desenvolvimento
pnpm test             # testes do gerador de prompts (Vitest)
cd src-tauri && cargo test   # testes do backend (Rust)
pnpm tauri build      # gera o instalador
```

Para desenvolver sem gastar nada, use o modo **Simulação** nas configurações. Para usar a API sem o cofre do sistema, defina `HF_API_KEY_ID` e `HF_API_KEY_SECRET` no ambiente.

Estrutura:

```
src/                 React + TypeScript (interface, presets, gerador de prompts)
  presets/           segmentos, estilos, telas
  prompt/build.ts    montagem dos prompts
  registry/models.ts modelos, parâmetros e endpoints
src-tauri/src/       Rust (fila de jobs, providers CLI/API/simulação, histórico)
```

---

## English

UI Forge generates business-software screens (dashboard, schedule, list, form, checkout, reports, login) in **many design styles at once** and compares **several AI image models side by side**, showing the cost of each image.

1. Download the installer from [Releases](../../releases).
2. Create an API key at [console.higgsfield.ai](https://console.higgsfield.ai) → *API Keys*.
3. Open UI Forge → **Settings** → paste your Key ID and Key Secret → **Test**.
4. Pick a business, a screen, styles and models, then click **Generate**.

The interface is available in Portuguese and English (Settings → Interface language). The API key is stored in the OS credential vault and never reaches the UI; the log masks the authorization header.

## Licença / License

[MIT](LICENSE)
