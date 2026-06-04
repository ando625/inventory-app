// Models/Item.cs
// 「在庫アイテム」のデータ構造を定義するファイル
// Laravelの app/Models/Item.php と同じ役割
// このクラス1つ = DBのitemsテーブル1行分の設計図

namespace InventoryApi.Models;
// ↑ namespace = このファイルの「住所・グループ名」
//   PHPの namespace App\Models と全く同じ概念
//   他のファイルから using InventoryApi.Models; で呼び出せる

public class Item
// ↑ public = どこからでも使えるクラス
//   class = PHPのclassと同じ
{
    public int Id { get; set; }
    // ↑ Id = 主キー（DBのid列）
    //   int = 整数型（1, 2, 3...）
    //   { get; set; } = 「取得もセットも両方できる」という意味
    //   PHPでいう public $id; に相当するがC#はこの書き方が標準

    public string Name { get; set; } = string.Empty;
    // ↑ string = 文字列型（PHPのstringと同じ）
    //   = string.Empty = デフォルト値は「空文字 ""」
    //   C#はnullに厳しいので初期値が必要！書かないと警告が出る

    public int Quantity { get; set; }
    // ↑ 在庫数量（個数なので整数でOK）

    public decimal Price { get; set; }
    // ↑ 価格
    //   decimal = お金の計算専用の数値型
    //   floatやdoubleは計算誤差が出ることがある（0.1+0.2が0.30000000000000004になる問題）
    //   金額には必ずdecimalを使う！

    public string Category { get; set; } = string.Empty;
    // ↑ カテゴリ名

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    // ↑ 作成日時
    //   DateTime = 日時を扱う型（PHPのCarbonに相当）
    //   DateTime.UtcNow = 今この瞬間のUTC時刻（世界標準時）
    //   LaravelのTimestampと同じ役割
}