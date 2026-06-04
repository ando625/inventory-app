// Controllers/ItemsController.cs
// APIのエンドポイントを定義するファイル
// LaravelのItemController.php と同じ役割

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using InventoryApi.Data;
using InventoryApi.Models;

namespace InventoryApi.Controllers;

[ApiController]
// ↑ 「これはAPIコントローラーです」とASP.NETに伝えるおまじない
//   バリデーションエラーを自動でJSON返却してくれるようになる

[Route("api/[controller]")]
// ↑ URLのパスを設定
//   [controller] = クラス名の「Controller」を除いた部分が自動で入る
//   ItemsController → 「Items」→ /api/items というURLになる
//   Laravelの Route::apiResource('items', ItemController::class) と同じ


// これはAPIの司令塔（Controller）が、データベース（AppDbContext）を使えるようにするための「準備と初期設定」のコード
public class ItemsController : ControllerBase
{
    private readonly AppDbContext _context;
    // ↑ private = このクラス内だけで使える 外のファイルからは絶対に見せないように(他のファイルから勝手に中身をいじれないように鍵をかけるセキュリティ)
    //   readonly = 一度セットしたら変更不可（安全のため）
    //   _context = アンダースコアから始めるのはC#のプライベート変数の慣習

    public ItemsController(AppDbContext context)
    // ↑ コンストラクタ
    //   ASP.NETが自動でAppDbContextを渡してくれる（依存性注入＝DI）
    // 「大工（ASP.NET）さん！この部屋を立ち上げる時に、倉庫から本物のデータベース管理機能（context）をここに持ってきて手渡し（注入）してください！」
    // 意味： これがDI（依存性注入）の正体です。C#のシステムが、倉庫から自動で本物のDB機能（インスタンス）をここに運んできてくれます。
    {
        _context = context;
        // ↑ 渡されたcontextをクラス変数に保存
    }

    // ────────────────────────────────────
    // GET /api/items　→　全件取得
    // ────────────────────────────────────
    [HttpGet]
    //「Next.jsから『GET（データをおねだりする）』という送り方でアクセスが来たときに、この関数を実行しなさい！」
    public async Task<ActionResult<IEnumerable<Item>>> GetItems()
    // ↑ async = 非同期処理（DBアクセスを待ってる間に他の処理ができる）
    //   Task<> = 「非同期処理の結果」を返す型（JSのPromiseと同じ）
    //   ActionResult = HTTPレスポンス（200 OKなど）を含められる型
    //   IEnumerable<Item> = Itemのリスト（PHPのItem[]と同じ）
    {
        return await _context.Items.ToListAsync();
        // ↑ await = 「終わるまで待つ」
        //   ToListAsync() = SELECT * FROM items
        //   Laravelの Item::all() に相当
    }

    // ────────────────────────────────────
    // GET /api/items/5　→　1件取得
    // ────────────────────────────────────
    [HttpGet("{id}")]
    // ↑ {id} = URLパラメータ。/api/items/5 の「5」が入る
    public async Task<ActionResult<Item>> GetItem(int id)
    {
        var item = await _context.Items.FindAsync(id);
        // ↑ var = 型推論（C#が自動で型を判断）PHPの $item = に相当
        //   FindAsync(id) = SELECT * FROM items WHERE id = ?
        //   Laravelの Item::find($id) に相当

        if (item == null)
            return NotFound();
        // ↑ 見つからなければ 404 Not Found を返す
        //   Laravelの abort(404) に相当

        return item;
        // ↑ 見つかれば 200 OK + JSONで返す
    }

    // ────────────────────────────────────
    // POST /api/items　→　新規作成
    // ────────────────────────────────────
    [HttpPost]


    // 登録が成功した証拠として、完成したデータを1件返してあげるための型設定
    //「関数の名前は CreateItem（アイテム作成）にするね！Next.jsから送られてきたJSONデータを、自動的に Item の形（型）に組み立て直して、この関数の中で使う item という箱に入れなさい！」
    public async Task<ActionResult<Item>> CreateItem(Item item)
    // ↑ Item item = リクエストのJSONを自動でItemオブジェクトに変換
    //   Laravelの $request->validated() に相当
    {
        _context.Items.Add(item);
        // ↑ INSERT の準備（まだDBには書かれていない）
        //「DB窓口担当者（_context）さん、在庫テーブル（.Items）に、いま届いた新しいデータ（item）を追加する『予約（下準備）』をしなさい！」

        await _context.SaveChangesAsync();
        //「担当者さん、さっき予約した追加データを、実際のデータベースにガチッと書き込んで保存（Save）しなさい！ 保存が終わるまでちょっと待つ（await）よ！」
        // この関数が実行された瞬間に、初めてPostgreSQLに向けて INSERT 文が走り、データが正式に保存されます。Laravelの $item->save() と同じ役割

        return CreatedAtAction(nameof(GetItem), new { id = item.Id }, item);
        // ↑ 201 Created を返す
        //   nameof(GetItem) = "GetItem"という文字列（タイポ防止のC#テクニック）
        //   Laravelの return response()->json($item, 201) に相当
    }

    // ────────────────────────────────────
    // PUT /api/items/5　→　更新
    // ────────────────────────────────────
    [HttpPut("{id}")]

    //今回の戻り値の型は、今までの ActionResult（Item）と違って Item がついていません。更新処理では、Next.jsにデータを送り返す必要がない（画面側はすでに最新のデータを知っているため）ので、「結果のステータスコードだけを返す」という意味の IActionResult になる
    public async Task<IActionResult> UpdateItem(int id, Item item)
    {
        //「もし（if）、URLで指定されたID（id）と、送られてきたデータの中身に書かれているID（item.Id）が、一致していない（!=）なら！」
        if (id != item.Id)
            return BadRequest();
        // ↑ URLのidとボディのidが違う場合は 400 Bad Request

        _context.Entry(item).State = EntityState.Modified;
        // ↑ 「このitemは変更済みですよ」とEFCoreに教える
        //   次のSaveChanges時にUPDATE文が発行される
        // C#（Entity Framework）の超重要な更新ロジックです。C#に対して「このデータは新しく作ったやつじゃなくて、すでにDBにあって、中身が書き換わったやつだよ！」と教えてあげています。このスタンプが押されることで、次の保存時に自動で UPDATE 文 が作られます。

        await _context.SaveChangesAsync();

        return NoContent();
        // ↑ 204 No Content（更新成功・返すデータなし）
        //   Laravelの return response()->noContent() に相当

    }

    // ────────────────────────────────────
    // DELETE /api/items/5　→　削除
    // ────────────────────────────────────
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteItem(int id)
    {
        var item = await _context.Items.FindAsync(id);

        if (item == null)
            return NotFound();

        _context.Items.Remove(item);
        // ↑ DELETE の準備

        await _context.SaveChangesAsync();
        // ↑ DELETE文が実行される

        return NoContent();
    }



}