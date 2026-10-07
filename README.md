# GESTÃO CAR — Controle Financeiro para Motoristas de Aplicativo

Aplicação web profissional (SPA) desenvolvida em **React, TypeScript, Tailwind CSS e Firebase (Authentication + Cloud Firestore)** para motoristas de Uber, 99 e InDrive controlarem corridas, despesas, lucro líquido, quilometragem e metas financeiras em tempo real.

---

## 1. Configuração do Firebase

1. Acesse o [Firebase Console](https://console.firebase.google.com/).
2. Em **Authentication > Sign-in method**, clique em **E-mail/senha (Email/Password)**, habilite a opção **Ativar (Enable)** e clique em **Salvar**. *(Não habilite login social caso deseje manter exclusivamente E-mail/Senha).*
3. Em **Firestore Database**, certifique-se de que o banco de dados esteja criado.
4. Para implantar as regras de segurança (`firestore.rules`) e os índices compostos (`firestore.indexes.json`) via Firebase CLI:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase deploy --only firestore:rules,firestore:indexes
   ```

---

## 2. Variáveis de Ambiente (`.env`)

Copie o arquivo `.env.example` para `.env` e preencha com as chaves públicas do seu aplicativo web do Firebase:

```env
VITE_FIREBASE_API_KEY="SUA_API_KEY"
VITE_FIREBASE_AUTH_DOMAIN="SEU_PROJETO.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="SEU_PROJECT_ID"
VITE_FIREBASE_STORAGE_BUCKET="SEU_PROJETO.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="SEU_SENDER_ID"
VITE_FIREBASE_APP_ID="SEU_APP_ID"
VITE_FIREBASE_DATABASE_ID="(default)"
```

---

## 3. Implantação na Vercel

1. Suba o repositório para o seu GitHub / GitLab / Bitbucket.
2. No painel da [Vercel](https://vercel.com/), clique em **Add New > Project** e importe o repositório.
3. Framework Preset: **Vite** (`npm run build`, diretório de saída `dist`).
4. Em **Environment Variables**, adicione todas as variáveis `VITE_FIREBASE_*` listadas acima.
5. Clique em **Deploy**. O arquivo `vercel.json` na raiz já configura o redirecionamento SPA.
6. No Firebase Console (`Authentication > Settings > Authorized domains`), adicione o domínio gerado pela Vercel (ex: `seu-projeto.vercel.app`).
