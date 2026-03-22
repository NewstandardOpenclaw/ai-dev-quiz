# 環境構築手順書

## 必要なツール

- Node.js 18以上
- npm
- Homebrew（macOS）

---

## 1. リポジトリのクローンと依存パッケージのインストール

```bash
git clone <リポジトリURL>
cd ai-dev-quiz
npm install
```

---

## 2. Supabaseプロジェクトの作成

1. [supabase.com](https://supabase.com) にGitHubアカウントでログイン
2. **「New project」** をクリック
3. 以下を入力：
   - Name: `ai-dev-quiz`
   - Database Password: 任意のパスワード（メモしておく）
   - Region: `Northeast Asia (Tokyo)`
4. **「Create new project」** → 1〜2分待つ

---

## 3. 環境変数の設定

プロジェクトルートに `.env.local` を作成：

```
VITE_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...（JWT形式のanon key）
```

APIキーの取得場所：Supabaseダッシュボード → **Settings → API**

> `sb_publishable_` 形式ではなく `eyJ...` で始まるJWT形式のキーを使用すること

---

## 4. データベースのセットアップ

Supabaseダッシュボード → **SQL Editor** で以下を実行：

```sql
-- テーブル作成
create table quizzes (
  id uuid default gen_random_uuid() primary key,
  question text not null,
  options jsonb not null,
  correct_answer text not null,
  explanation text,
  category text not null,
  difficulty text check (difficulty in ('easy', 'medium', 'hard')) default 'medium',
  created_at timestamp with time zone default now()
);

-- 読み取りポリシー（RLS）
create policy "誰でも読める"
on quizzes
for select
to anon
using (true);
```

---

## 5. Supabase CLIのインストールとプロジェクトリンク

```bash
brew install supabase/tap/supabase
supabase login
supabase link --project-ref <プロジェクトID>
```

プロジェクトIDはSupabaseダッシュボードのURLから取得：
`https://supabase.com/dashboard/project/<プロジェクトID>`

---

## 6. Anthropic APIキーの取得と設定

1. [console.anthropic.com](https://console.anthropic.com) でAPIキーを作成
2. **Plans & Billing** でクレジットを購入（$5〜）
3. シークレットに設定：

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxxxxxxx
```

---

## 7. Edge Functionのデプロイ

```bash
supabase functions deploy generate-quiz
```

---

## 8. ローカル起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173` を開く。

---

## セキュリティ設定（推奨）

| 項目 | 設定内容 |
|------|----------|
| 開発場所 | iCloud同期対象外のディレクトリで作業 |
| macOS権限 | ターミナルに「フルディスクアクセス」を与えない |
| `.claudeignore` | `../` を記載して上位ディレクトリへのアクセスをブロック |
| コマンド承認 | `.claude/settings.json` で `"ask": ["Bash"]` を設定 |
