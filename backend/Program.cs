// Program.cs
// アプリの「起動設定ファイル」
// Laravelの bootstrap/app.php + config/app.php をまとめたイメージ
// ここに書いた順番通りにアプリが起動する

using Microsoft.EntityFrameworkCore;
using InventoryApi.Data;
// 「InventoryApi国のData県」から AppDbContext を呼び寄せる

var builder = WebApplication.CreateBuilder(args);
// ↑ アプリの「設計図」を作る
//   ここに機能を追加していくイメージ



// ══════════════════════════════════════
// サービス登録ゾーン（使う機能を登録する）
// ══════════════════════════════════════

builder.Services.AddControllers();
// ↑ 「コントローラーを使いますよ」という登録
//   これがないとAPIのエンドポイントが動かない
//   LaravelのRoute登録が有効になる処理に相当

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
// ↑ Swaggerの登録
//   起動後に http://localhost:5001/swagger でAPI一覧が見られる！
//   開発中はここでAPIのテストができる（Postman不要）

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")
        // ↑ 環境変数の ConnectionStrings__DefaultConnection を取得
        //   docker-compose.yml で設定した接続文字列がここに入ってくる
        //   LaravelのDB_HOSTなどをconfig/database.phpで読むのと同じ仕組み
    )
);
// ↑ 「PostgreSQLを AppDbContext 経由で使いますよ」という登録
//   AddDbContext = DBを使えるようにする設定


builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy
            .WithOrigins("http://localhost:3000")
            // ↑ Next.js（3000番）からのリクエストだけ許可
            //   他のURLからは拒否される（セキュリティ）
            .AllowAnyMethod()
            // ↑ GET, POST, PUT, DELETE 全て許可
            .AllowAnyHeader()
            // ↑ どんなHTTPヘッダーでも許可
    );
});
// ↑ CORS = 「別のURL（ポート）からのリクエストを許可する設定」
//   フロント(3000)からバックエンド(5001)を叩くには必須！
//   Laravelの config/cors.php と全く同じ役割
// CORS（コーズ）の設定.フロントエンド（Next.jsの3000番）とバックエンド（C#の5001番）のように、「港（ポート番号）が違うアプリ同士でお喋り（通信）できるようにする」ための、実務で絶対に外せない超重要なお守りコード


// ══════════════════════════════════════
// アプリ組み立てゾーン
// ══════════════════════════════════════
var app = builder.Build();
// ↑ 上で設定した「設計図」をもとにアプリを「組み立てる」
//   ここを境に builder → app に変わる

// DBのテーブルを自動作成
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    // ↑ AppDbContext のインスタンスを取得
    //   new AppDbContext() とほぼ同じだが、DIコンテナ経由で取得する

    db.Database.EnsureCreated();
    // ↑ テーブルが存在しない場合に自動作成
    //   php artisan migrate に相当
    //   Modelを見てテーブルを自動生成してくれる
}


// ══════════════════════════════════════
// ミドルウェアゾーン（リクエスト処理の順番）
// ══════════════════════════════════════


// Swagger（スワッガー）とは、バックエンドがどんなURL（エンドポイント）を持っているかをブラウザで綺麗に見られる便利な「仕様書ツール」です。本番環境でこれが見えてしまうとセキュリティ上危険なので、if 文を使って開発環境だけで動くようにロックをかける
// app.Environment 「いま起動しているアプリの『現在の実行環境（モード）』を調べなさい！」
// IsDevelopment() 「その環境は『開発（Development）モード』ですか？」
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    // ↑ 開発環境のみ Swagger を有効化
    //   本番では API仕様を外部に見せないためOFFにする
}

// ⬇️　ここからは、環境に関係なく「アプリ全体」に適用する共通のルール

app.UseCors("AllowFrontend");
// ↑ 上で登録したCORSポリシーを適用
//   これを書く位置が重要！UseRouting より前に書く

app.MapControllers();
// ↑ コントローラーのルーティングを有効化
//   Controllers フォルダの全コントローラーが自動で登録される
//   Laravelの routes/api.php に相当

// ヘルスチェック用エンドポイント
app.MapGet("/health", () => "OK");
// ↑ docker-compose.yml の healthcheck が叩くURL
//   GET /health → 「OK」と返すだけのシンプルなエンドポイント
//   これがないと healthcheck が失敗してコンテナが起動しない！

app.Run();
// ↑ サーバーを起動！
//   php artisan serve に相当
//   ここに来たらサーバーが止まるまでずっとリクエストを待ち続ける


