# Painel de Vagas de Piracicaba 💼

Este é um painel independente e de código aberto desenvolvido para organizar, buscar, filtrar e ordenar as vagas de emprego divulgadas pelo CAT (Centro de Apoio ao Trabalhador) no portal oficial da Prefeitura de Piracicaba/SP.

O site original municipal não conta com filtros de busca, ordenação ou estatísticas. Este projeto automatiza a raspagem das informações públicas oficiais, estrutura os dados e entrega uma interface web moderna, rápida e 100% responsiva para os candidatos.

---

## ✨ Funcionalidades Principais

- **Pesquisa Instantânea**: Busca reativa por palavra-chave que procura no cargo, descrição, escolaridade, experiência e localidade simultaneamente.
- **Filtros Inteligentes**:
  - **Experiência**: Separação rápida entre vagas sem exigência (ideais para primeiro emprego) e vagas com experiência exigida.
  - **Escolaridade**: Dropdown alimentado dinamicamente com os níveis reais exigidos pelas vagas ativas.
  - **Cidade do Candidato**: Filtro que cruza a localidade de moradia do candidato com as restrições da vaga, mostrando apenas o que é elegível para ele.
- **Preenchimento Automático do Formulário (CAT)**: Ao selecionar a vaga e clicar para se candidatar, o link redireciona para o formulário oficial da prefeitura com a pergunta *"Qual vaga do seu interesse?"* **automaticamente preenchida** com o título correto da vaga, evitando erros de digitação e poupando tempo.
- **Ordenação**: Ordenação por ordem alfabética (A-Z / Z-A) ou por salário (do maior para o menor e vice-versa, com cálculo estimado para valores de salário-hora).
- **Indicadores Rápidos (Badges)**: Cards com sinalização visual intuitiva para vagas com experiência ou salários declarados.
- **Estatísticas em Tempo Real**: Painel superior indicando o total de vagas ativas no dia, vagas sem experiência e quantidade de cidades vizinhas atendidas.
- **Modo Escuro / Claro**: Design premium com visual moderno, sombras suaves, efeito de vidro (glassmorphism) e alternador de temas persistente (salva sua preferência no navegador).
- **Sem Erro de CORS**: Carregamento local via arquivo Javascript (`vagas.js`) que permite abrir o site dando um duplo clique em `index.html` (protocolo `file://`) sem precisar subir um servidor HTTP.
- **Carregamento Instantâneo (Cache)**: Lógica *Stale-While-Revalidate* que exibe instantaneamente (0ms) os dados salvos no `localStorage` do navegador e valida por dados mais novos em segundo plano.

---

## 🚀 Como Executar o Projeto Localmente

Você precisará do **Python 3** instalado em sua máquina.

### Passo 1: Instalar dependências de raspagem
Instale as bibliotecas necessárias para rodar o robô de raspagem:
```bash
pip install requests beautifulsoup4
```

### Passo 2: Executar o Scraper
Rode o script para coletar as vagas mais recentes da prefeitura e gerar a base de dados estruturada:
```bash
python scraper.py
```
> Isso gerará dois arquivos na raiz do projeto: `vagas.json` (banco de dados em JSON) e `vagas.js` (cópia dos dados estruturados em formato JS para contornar bloqueios de CORS do navegador).

### Passo 3: Abrir a Interface Web
Você tem duas opções para abrir a interface:
- **Opção A (Fácil)**: Dê um duplo clique no arquivo `index.html` diretamente da sua pasta local. A página carregará o `vagas.js` e funcionará imediatamente.
- **Opção B (Recomendada para Desenvolvimento)**: Inicie um servidor HTTP local com Python:
  ```bash
  python3 -m http.server 8000
  ```
  E acesse **[http://localhost:8000](http://localhost:8000)** no seu navegador.

---

## 🌐 Implantação e Atualização Automática Gratuita (GitHub Pages)

O projeto foi desenhado sob uma arquitetura **Serverless de custo zero**, aproveitando a infraestrutura gratuita do GitHub.

### ⚙️ Configurações Iniciais no seu Repositório:

#### 1. Liberar Permissão de Escrita para o Robô (Obrigatório)
O script do GitHub Actions precisa de autorização para commitar os arquivos de dados novos de volta no seu repositório.
1. No seu repositório do GitHub, vá em **Settings** (Configurações) no menu superior.
2. Na barra lateral esquerda, clique em **Actions** -> **General**.
3. Role até a seção **Workflow permissions**.
4. Selecione **"Read and write permissions"** (Permissões de leitura e escrita).
5. Clique em **Save** (Salvar).

#### 2. Ativar a Hospedagem do Site (GitHub Pages)
1. Nas configurações do repositório (**Settings**), clique em **Pages** na barra lateral esquerda.
2. Sob **Build and deployment** -> **Source**, garanta que esteja selecionado **"Deploy from a branch"**.
3. Em **Branch**, mude para a sua branch principal (ex: `main` ou `master`), deixe a pasta como `/ (root)` e clique em **Save**.
4. Em poucos minutos o GitHub Actions publicará o site sob o endereço oficial: `https://seu-usuario.github.io/nome-do-repositorio/`.

#### 3. Execução Automática (Cron)
A automação está configurada em `.github/workflows/scrape.yml` para rodar a cada **6 horas** de forma totalmente automática. Se quiser rodar manualmente:
1. Vá na aba **Actions** no topo do seu repositório.
2. Clique no workflow **"Atualizar Painel de Vagas"** à esquerda.
3. Clique em **Run workflow** -> **Run workflow** no botão cinza à direita.

---

## 🔒 Privacidade e Informações Sensíveis

Seguindo a premissa de manter o projeto 100% público e gratuito:
- **Sem Dados Sensíveis**: Toda a raspagem é feita na página web pública da prefeitura. Não são necessários cookies, e-mails, chaves de API secretas ou senhas.
- **Sem Rastreamento**: A aplicação roda inteiramente no navegador do usuário final e não utiliza serviços externos de rastreamento ou captura de dados de visitantes.
