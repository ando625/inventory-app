# 📦 在庫管理アプリ

**C# × ASP.NET Core × Next.js × PostgreSQL × Docker で作った、在庫管理アプリ**

---

## アプリの概要

このアプリを一言で言うと、**「在庫アイテムを追加・編集・削除・カテゴリ別フィルタリングできる、Webアプリ」** です。

画面（Next.js）・サーバー（ASP.NET Core）・データベース（PostgreSQL）の3層構成で作られており、再起動してもデータが消えない本格的な構成になっています。

---

## 開発の背景

### なぜこのアプリを作ったのか

これまでPHPやLaravelを使ってWebアプリを開発してきましたが、「**C#でも同じようにWebアプリが作れるのか？**」という興味を持ったのが始まりです。

LaravelとNext.jsで培った知識をC#に応用しながら、バックエンドをC# / ASP.NET Core で構築する方法を学ぶために、シンプルな在庫管理アプリに挑戦しました。

### 学びたかったこと

- C# と ASP.NET Core での **Web API の作り方**
- **Entity Framework Core**（C#からデータベースを操作する仕組み）の使い方
- LaravelとNext.jsで培った知識を、**別の言語に応用する力**
- Dockerを使った **本格的な開発環境の構築**
- `namespace` や `DbContext` など **C# 独自の概念の理解**

---

## 苦労した点・問題と解決

### 問題1：コメント内の `<>` 記号がC#のコンパイルエラーになった

**何が起きたか**

`dotnet watch run` でビルドしたとき、`Syntax error, '>' expected` というエラーが出てアプリが起動しなかった。

**原因**

C#のコメント（`//`）の中に `ActionResult<Item>` のような `<>` を書いていたため、C#のコンパイラが「型の記号では？」と誤認識してしまった。

**解決方法**

コメント内の `<Item>` を `（Item）` や `Item` に書き換えた。

```csharp
// ❌ エラーになる書き方
// ActionResult<Item> の型を返します

// ✅ 正しい書き方
// ActionResult（Item）の型を返します
```

**次に活かせること**

C#のコメントに `<>` を書くときは全角または別の表現に変える。

---

### 問題2：ポート5000がすでに使われていてアプリが起動しなかった

**何が起きたか**

`docker compose up` でコンテナを起動しようとしたら、バックエンドが立ち上がらなかった。

**原因**

Macの中の別のアプリが、ポート5000番をすでに使っていた。ポートは「建物の入り口の番号」のようなもので、同じ番号は2つのアプリが同時に使えない。

**解決方法**

`docker-compose.yml` のポート番号を `5000` から `5001` に変えた。

```yaml
# 変更前
- "5000:8080"
# 変更後
- "5001:8080"
```

**次に活かせること**

ポートが使われているときは番号を変えるだけで解決できる。`lsof -i :5000` でどのアプリが使っているか確認できる。

---

### 問題3：`/app/node_modules` の防護壁を設定しないとエラーになった

**何が起きたか**

`volumes` でローカルの `frontend/` をコンテナに同期したとき、`node_modules` 関連のエラーが出てNext.jsが起動しなかった。

**原因**

`volumes: - ./frontend:/app` はローカルのファイルをコンテナに丸ごと同期する。しかしローカルの `node_modules` はMac用にビルドされており、コンテナ（Linux）用とは異なる。上書きされることで壊れてしまった。

**解決方法**

`docker-compose.yml` に匿名ボリュームの防護壁を追加した。

```yaml
volumes:
  - ./frontend:/app         # ローカルと同期
  - /app/node_modules       # ← これがnode_modulesを上書きから守る防護壁
  - /app/.next              # ビルドキャッシュも保護
```

**次に活かせること**

Dockerでnode.jsアプリを動かすときは `node_modules` の防護壁は必須。

---

### 問題4：healthcheck で `curl` が使えなかった

**何が起きたか**

C#コンテナの healthcheck（DBの準備完了を確認するため起動に時間がかかりDBができてないのに他を起動すると親と子の関係でエラーが出るため） で `curl` を使ったところ、healthcheck が永遠に失敗してフロントエンドが起動しなかった。

**原因**

ASP.NET Core の公式Dockerイメージには `curl` がインストールされていない。

**解決方法**

`curl` の代わりに `wget` を使い、`start_period` で起動猶予時間を設けた。

```yaml
healthcheck:
  test: ["CMD-SHELL", "wget -qO- http://localhost:8080/health || exit 1"]
  interval: 10s
  timeout: 5s
  retries: 10
  start_period: 30s   # dotnet watch の起動が遅いので猶予時間を設ける
```

また `Program.cs` にヘルスチェック用エンドポイントを追加した。

```csharp
app.MapGet("/health", () => "OK");
```

**次に活かせること**

.NETイメージでは `curl` の代わりに `wget` を使う。`dotnet watch` は起動が遅いので `start_period` を長めに設定する。
RUN apt-get update && apt-get install -y curl このコードを入れることで `curl`が使える

---

### 問題5：編集ボタンを押しても何も起きなかった

**何が起きたか**

編集ボタンを押しても入力欄が表示されなかった。

**原因**

関数名を `startEdit` と書くべきところを `seartEdit` とタイポ（スペルミス）していた。また編集モードでない行に「編集」ボタン自体が抜けていた。さらに `</tr>` タグの位置が `</>` の外にズレていた。

**解決方法**

3箇所を修正した。

```tsx
// ❌ 修正前
const seartEdit = (item: Item) => {

// ✅ 修正後
const startEdit = (item: Item) => {
```

**次に活かせること**

TypeScriptは関数名のタイポをエラーで教えてくれる。`onClick={() => startEdit(item)}` の `startEdit` が赤線になっていたら関数名を確認する。

---

### 問題6：カテゴリフィルター機能をDBを触らずに実装した

**何が起きたか**

カテゴリ別にボタンを作って絞り込み表示したかったが、どこに処理を書けばいいか迷った。

**原因（設計の悩み）**

「DBに新しいAPIを作るべきか」「フロントだけで完結できるか」の判断が難しかった。

**解決方法**

フロントエンドだけで完結させた。`items` から `category` を取り出して重複を除いたボタンを自動生成し、`filter()` で表示を絞るだけで実装できた。

```tsx
// カテゴリ一覧を自動生成（DBアクセスなし）
const categories = Array.from(
  new Set(items.map((item) => item.category).filter(Boolean))
);

// 選択中のカテゴリで絞り込む
const filteredItems = selectedCategory
  ? items.filter((item) => item.category === selectedCategory)
  : items;
```

**次に活かせること**

「読み取り専用の絞り込み・並び替え」はフロントだけで完結できる。DBやAPIを増やす必要はない。新しいカテゴリが登録されるたびにボタンが自動で増える設計にすると追加コードが不要になる。

---

## ✅ 作れた機能一覧

| 機能 | 内容 |
|------|------|
| アイテム追加 | 商品名・数量・価格・カテゴリを設定して追加 |
| 一覧表示 | 登録済みの在庫を一覧でテーブル表示 |
| アイテム編集 | 編集ボタンでその行だけ入力欄に切り替え・保存 |
| 在庫数変更 | 編集モードで数量を増減して保存 |
| アイテム削除 | 確認ダイアログ付きで1件ずつ削除 |
| カテゴリフィルター | 登録されたカテゴリのボタンが自動生成・押すと絞り込み表示 |
| 件数表示 | 全て・各カテゴリの件数をボタンに表示 |
| ローディング表示 | データ取得中にメッセージ表示 |
| エラー表示 | API接続失敗時にエラーメッセージを表示 |
| データ永続化 | 再起動してもデータが消えない（PostgreSQL保存） |

---

## 🛠️ 使用技術

| カテゴリ | 技術 | 用途 |
|----------|------|------|
| フロントエンド | Next.js 15 / React | 画面の表示・操作 |
| | TypeScript | 型安全なコーディング |
| | Tailwind CSS | デザイン |
| バックエンド | C# / ASP.NET Core 8 | Web API サーバー |
| | Entity Framework Core 8 | データベース操作（ORM） |
| | Npgsql（PostgreSQL対応） | PostgreSQLとの接続 |
| | Swashbuckle（Swagger） | API ドキュメント自動生成 |
| データベース | PostgreSQL 15 | データ永続保存 |
| インフラ | Docker / Docker Compose | 開発環境のコンテナ管理 |
| 開発ツール | GitHub | バージョン管理 |

---

## 🌐 アプリの構成図

```
ブラウザ（あなた）
    ↓ 画面を見る・ボタンを押す
Next.js（localhost:3000）
    ↓ データを取得・送信（REST API）
ASP.NET Core API（localhost:5001）
    ↓ SQLで操作（Entity Framework Core）
PostgreSQL（localhost:5432）
    データを永続保存 ✅
```

---

## 🐳 Docker コンテナ構成

```
コンテナ名                    役割                       アクセス先
──────────────────────────────────────────────────────────────
inventory-app-backend-1      ASP.NET Core API          localhost:5001
inventory-app-frontend-1     Next.js フロントエンド     localhost:3000
inventory-app-db-1           PostgreSQL データベース    localhost:5432
```

---

## 📁 ファイル構成

```
inventory-app/
├── docker-compose.yml              ← 全コンテナをまとめる設定
├── backend/
│   ├── Dockerfile.dev              ← 開発用コンテナの設定（dotnet watch対応）
│   ├── InventoryApi.csproj         ← プロジェクト設定（composer.jsonと同じ役割）
│   ├── Program.cs                  ← アプリ起動・DB接続・CORS・Swagger設定
│   ├── Data/
│   │   └── AppDbContext.cs         ← PostgreSQLへの接続窓口（Entity Framework）
│   ├── Models/
│   │   └── Item.cs                 ← 在庫データの型定義
│   └── Controllers/
│       └── ItemsController.cs      ← APIエンドポイント（GET/POST/PUT/DELETE）
└── frontend/
    ├── Dockerfile                  ← フロントエンドコンテナの設定
    ├── app/
    │   └── page.tsx                ← 在庫管理画面のメインファイル
    └── package.json
```

---

## 🔌 API エンドポイント一覧

| メソッド | URL | 内容 |
|----------|-----|------|
| GET | /api/items | 在庫一覧を取得 |
| GET | /api/items/{id} | 1件取得 |
| POST | /api/items | 新しいアイテムを追加 |
| PUT | /api/items/{id} | アイテムを更新 |
| DELETE | /api/items/{id} | アイテムを削除 |
| GET | /health | ヘルスチェック（Docker用） |

---

## 🚀 セットアップ方法

### 前提条件
- Docker / Docker Compose がインストール済みであること

---

### 手順1：リポジトリをクローン

```bash
git clone <リポジトリURL> inventory-app
cd inventory-app
```

---

### 手順2：Next.js の初期化（初回のみ）

```bash
docker run --rm \
  -v $(pwd)/frontend:/app \
  -w /app \
  node:20-alpine \
  npx create-next-app@latest . \
    --typescript \
    --tailwind \
    --app \
    --no-src-dir \
    --import-alias "@/*" \
    --no-eslint
```

---

### 手順3：Dockerコンテナを起動

```bash
docker-compose up --build
```

---

### 手順4：アクセス確認

| サービス | URL |
|----------|-----|
| 在庫管理画面（フロントエンド） | http://localhost:3000 |
| API | http://localhost:5001/api/items |
| Swagger（API ドキュメント） | http://localhost:5001/swagger |

---

### よく使うコマンド

```bash
# 起動（2回目以降）
docker-compose up

# 停止
docker-compose down

# ログを見る
docker-compose logs backend    # C#のログ
docker-compose logs frontend   # Next.jsのログ

# 全部消してやり直す
docker-compose down -v
docker-compose up --build
```

---

## 学んだこと・振り返り

### C# × ASP.NET Core で学んだこと

- `[HttpGet]` `[HttpPost]` `[HttpPut]` `[HttpDelete]` でAPIルートを定義する方法
- `namespace` = フォルダ構成がそのまま「住所」になる仕組み
- `DbContext` を使ってC#のコードからPostgreSQLを操作する方法
- `SaveChangesAsync()` を呼ぶまでDBに保存されないことを体験で学んだ
- `{ get; set; }` = C#のプロパティ（PHPの `public $name;` に相当）の書き方
- `async / await` = 非同期処理（JSのPromiseと同じ概念）の使い方
- 依存性注入（DI）= コンストラクタにDBコンテキストを自動で渡してもらう仕組み

### Next.js × TypeScript で学んだこと

- `useState` で画面のデータを管理する方法
- `useEffect` でページ表示時に自動でデータを取得する方法
- `fetch` でAPIと通信する方法（GET・POST・PUT・DELETE）
- TypeScriptの型定義（`type Item = {...}`）でデータの形を明確にする方法
- `??` 演算子 = PHPの `??` と同じ「nullなら右側を使う」書き方
- `Partial<Item>` = 「全プロパティが省略可能」という型（編集フォームで活用）
- `new Set()` = 重複を自動で除去するデータ構造（カテゴリ一覧の生成で活用）
- `Array.from()` = SetをArrayに戻す方法（mapやfilterを使えるようにするため）
- `.filter(Boolean)` = 空文字やnullを除外する書き方
- フィルタリングはDBを触らずフロントの `filter()` だけで完結できる

### Docker で学んだこと

- `healthcheck` で「PostgreSQLが起動してからC#を、C#が起動してからNext.jsを」と順番を制御できる
- `volumes` でDBのデータをコンテナを消しても残せる
- `node_modules` の防護壁（匿名ボリューム）でLinux/Mac間の依存関係のズレを防げる
- `.NETイメージには curl がない` → `wget` を使う
- `dotnet watch` = ファイルを保存するたびに自動で再ビルドしてくれる開発ツール

### LaravelとC#を比べて気づいたこと

| Laravel（PHP） | C#（ASP.NET Core） |
|---|---|
| `composer.json` | `.csproj` |
| `composer install` | `dotnet restore` |
| `php artisan serve` | `dotnet run` |
| `php artisan migrate` | `db.Database.EnsureCreated()` |
| `$item->save()` | `await _context.SaveChangesAsync()` |
| `Item::all()` | `await _context.Items.ToListAsync()` |
| `namespace App\Models` | `namespace InventoryApi.Models` |
| `use App\Models\Item` | `using InventoryApi.Models` |
| `.env` | `docker-compose.yml の environment` |