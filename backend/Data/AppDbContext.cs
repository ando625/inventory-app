// Data/AppDbContext.cs
// データベースとの接続窓口
// LaravelのEloquentがDBと繋がる仕組みを、C#では明示的に書く

using Microsoft.EntityFrameworkCore;
// ↑ Entity Framework Core のライブラリを読み込む
//   PHPの use App\Models\Item; と同じ意味

using InventoryApi.Models;
// ↑ さっき作った Item クラスを読み込む

namespace InventoryApi.Data;

public class AppDbContext : DbContext
// ↑ AppDbContext は DbContext を「継承（extends）」している
//   DbContext = EFCoreが提供する「DBとお話できる親クラス」
//   PHPの class Item extends Model と全く同じ構造！

{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    // ↑ コンストラクタ = new AppDbContext() したときに最初に動く処理
    //   options = DB接続情報（接続文字列など）が入ってくる
    //   : base(options) = 親クラス(DbContext)のコンストラクタに options を渡す
    //   PHPでいう parent::__construct() と同じ
    { }

    public DbSet<Item> Items { get; set; }
    // ↑ DbSet<Item> = 「Itemテーブルを操作するためのプロパティ」
    //   これを書くだけで items テーブルが自動で作られる！
    //   _context.Items.ToList()    → SELECT * FROM items
    //   _context.Items.Find(1)     → SELECT * FROM items WHERE id = 1
    //   _context.Items.Add(item)   → INSERT INTO items ...
    //   LaravelのItem::all() / Item::find() に相当
}