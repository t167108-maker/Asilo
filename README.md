# Asilo João Kuhl Filho — Android (Capacitor)

Este pacote prepara os arquivos web enviados (`index.html`, `style.css`, `script.js`) para serem empacotados como aplicativo Android com Capacitor.

## Importante: o que este pacote é e não é

- É o projeto-fonte para gerar o aplicativo Android.
- **Ainda não é um APK compilado.** A pasta `android/` será criada pelo Capacitor no seu computador.
- O aplicativo mantém o comportamento atual da interface. Os dados do protótipo são guardados em `localStorage` no próprio dispositivo.
- Este protótipo ainda não usa o backend/autenticação real que discutimos. Não use dados pessoais reais ou dados de saúde dos residentes até implementar e auditar a autenticação e o banco de dados seguros.
- Os registros de demonstração já existentes no JavaScript são fictícios; substitua-os antes de qualquer demonstração externa se necessário.

## Requisitos

1. Node.js LTS (versão compatível com Capacitor 8).
2. Android Studio atualizado.
3. Android SDK e ferramentas de build instalados pelo Android Studio.
4. Conexão à internet na primeira instalação das dependências.

## Gerar o projeto Android

Abra um terminal na pasta extraída deste pacote.

### 1. Instalar as dependências

```bash
npm install
```

### 2. Criar a pasta nativa Android

```bash
npm run android:add
```

Isso cria a pasta `android/` com o projeto Gradle nativo.

### 3. Abrir no Android Studio

```bash
npm run android:open
```

No Android Studio, aguarde a sincronização do Gradle. Se ele solicitar a instalação de SDKs ou ferramentas, aceite os componentes recomendados.

### 4. Testar no celular

- Ative as Opções do desenvolvedor e a Depuração USB no aparelho Android.
- Conecte o celular ao computador e aceite a autorização USB.
- No Android Studio, selecione o dispositivo e pressione **Run ▶**.

Também é possível usar:

```bash
npm run android:run
```

### 5. Gerar o APK de teste

No Android Studio:

1. Abra **Build**.
2. Selecione **Build Bundle(s) / APK(s) > Build APK(s)**.
3. Ao terminar, clique no link para localizar o APK.

Normalmente o APK de debug fica em:

`android/app/build/outputs/apk/debug/app-debug.apk`

### 6. Gerar APK assinado para distribuição

Para distribuir fora do ambiente de desenvolvimento, use **Build > Generate Signed Bundle / APK** no Android Studio. Crie e guarde a chave de assinatura em local seguro; não a envie por e-mail nem a inclua no projeto. Para publicação na Play Store, normalmente é recomendado gerar um Android App Bundle (AAB), conforme os requisitos atuais da loja.

## Atualizar a interface depois de alterar os arquivos web

Depois de editar qualquer arquivo em `www/`, execute:

```bash
npm run android:sync
```

Depois, recompile ou execute o app pelo Android Studio.

## Observações

- O nome exibido e o identificador Android estão em `capacitor.config.json`.
- Para trocar ícone e tela de abertura, use o gerenciador de assets do Android Studio ou as ferramentas de assets do Capacitor e depois sincronize o projeto.
- Os dados salvos no `localStorage` pertencem à instalação/dispositivo e não sincronizam automaticamente com outros aparelhos.
- O aplicativo ainda precisa de revisão de usabilidade, segurança, privacidade, backup e acessibilidade antes de uso institucional real.

## Autenticação e perfis (protótipo local)

O aplicativo agora apresenta uma tela de autenticação com Login, Sign in e ADM.
Os cadastros comuns são armazenados localmente no navegador/dispositivo, com senha derivada por PBKDF2 e salt individual. O mesmo e-mail não pode ser cadastrado duas vezes no mesmo armazenamento local. O acesso comum é somente leitura; a interface e os manipuladores de ações de alteração são restritos ao administrador.

**Credenciais administrativas iniciais do protótipo:**
- E-mail: `admin@ajkf.local`
- Senha: `AJKF@Admin2026`

As credenciais podem ser alteradas no objeto `ADMIN_CREDENTIALS`, no arquivo `www/script.js`, antes de executar o aplicativo.

**Limitação importante:** este projeto não contém backend nem banco de dados centralizado. Contas e dados ficam no armazenamento local de cada navegador/dispositivo e não são compartilhados entre aparelhos. A autenticação e as permissões em JavaScript podem ser contornadas por alguém com acesso técnico ao dispositivo. Não utilize este protótipo com dados reais/sensíveis de residentes. Para implantação institucional, implemente API/backend, banco de dados central, autenticação segura e autorização validada no servidor.

## Atualização funcional (v3)

- Administradores podem adicionar, editar e remover atividades diárias dos residentes pela ação **Atividades** na lista de residentes.
- O cadastro de residentes possui uma aba separada de **Informações pessoais** (CPF, RG, idade, sexo e local de nascimento), acessível somente no fluxo administrativo.
- Administradores podem remover comunicados publicados.
- Usuários comuns podem excluir notificações individualmente ou limpar todas as suas notificações.
- Usuários comuns podem solicitar visitas a residentes ou reuniões por cargo; solicitações ficam pendentes para aprovação/recusa administrativa e o resultado aparece em **Meus agendamentos**.
- Cargo/função e setor do perfil são campos bloqueados; o usuário pode editar apenas seus dados pessoais permitidos.

**Limitação importante:** os dados continuam armazenados localmente no dispositivo/navegador. As solicitações e aprovações só são compartilhadas entre perfis que utilizam a mesma instalação/armazenamento local. Para uso real em vários aparelhos, é obrigatório implementar backend, banco centralizado, autenticação e autorização no servidor. CPF e RG são dados pessoais sensíveis e não devem ser inseridos em um protótipo local sem controles de segurança adequados.

## Atualizações desta revisão

- Usuários padrão podem consultar, em modo somente leitura, CPF, RG, idade, sexo e local de nascimento do residente após informar o código exato.
- O campo de idade no cadastro administrativo aceita valores de 0 a 140 anos.
- A sessão permanece ativa ao atualizar a página na mesma aba; o botão **Sair** encerra a sessão.
- Notificações, residentes, comunicados, eventos e solicitações são sincronizados entre abas/janelas abertas no mesmo navegador e na mesma origem, usando eventos de armazenamento e BroadcastChannel.

**Limitação de sincronização:** o projeto ainda usa `localStorage` no dispositivo. A sincronização em tempo real implementada funciona entre abas/janelas do mesmo navegador e perfil. Ela não sincroniza aparelhos diferentes, navegadores/perfis separados nem computadores pela rede. Para isso, é necessário um backend com banco de dados centralizado e canal de atualização em tempo real (por exemplo, WebSocket ou serviço equivalente).

## Iniciar no Windows sem abrir o VS Code

1. Extraia todo o arquivo ZIP para uma pasta do computador.
2. Dê dois cliques em **Iniciar Asilo.bat**.
3. O Windows PowerShell, que já acompanha o Windows 10/11, inicia um servidor HTTP local usando recursos integrados do sistema.
4. O inicializador abre o navegador automaticamente e mantém o servidor ativo enquanto a janela estiver aberta. Não é necessário instalar Python, Node.js ou abrir o VS Code.
5. Para encerrar, feche a janela do inicializador.

O inicializador utiliza uma porta local livre entre 8765 e 8790 e vincula o servidor somente a `127.0.0.1` (este PC). O servidor estático é executado pelo Windows PowerShell/.NET integrado ao Windows, sem dependências externas. Não é necessário abrir o VS Code.

### Credenciais administrativas atualizadas
- E-mail: `adm@email.com`
- Senha: `123adm`

### Mostrar/ocultar senha
Os campos de senha no Login e no cadastro agora possuem um botão de olho para alternar entre senha oculta e visível.

**Nota sobre EXE:** este pacote inclui um inicializador Windows de duplo clique (`Iniciar Asilo.bat`) que executa o site automaticamente. Não inclui um binário `.exe` nativo compilado; a geração de um `.exe` Windows assinado/compilado exige uma ferramenta de build Windows. O inicializador fornecido evita o uso do VS Code e não requer Python nem Node.js; utiliza o Windows PowerShell integrado ao Windows.
