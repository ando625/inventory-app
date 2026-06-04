// app/page.tsx
// 在庫管理アプリのトップページ（一覧・追加・削除）

"use client";
// ↑ 「このファイルはブラウザで動かす」という宣言
//   Next.jsはデフォルトでサーバー側で動く
//   useState などブラウザの機能を使うときはこれが必須！

import { useEffect, useState } from "react";

// ── 型定義 ────────────────────────────────────────
// TypeScriptの特徴：データの「形」を事前に定義する
// これがあると間違った使い方をしたとき即エラーで教えてくれる
type Item = {
  id: number; // 数値
  name: string; // 文字列
  quantity: number | null; // 数値
  price: number | null; // 数値
  category: string; // 文字列
};

// ── API のURL ─────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";
// ↑ 環境変数からURLを取得
//   ?? = 「左がnull/undefinedなら右を使う」（PHPの ?? と同じ！）
//   docker-compose.yml の NEXT_PUBLIC_API_URL=http://localhost:5001 が入る

// ── コンポーネント本体 ────────────────────────────
export default function Home() {
  // ↑ export default = このファイルのメインの部品
  //   Next.js が自動でページとして認識する

  // ── State（状態管理）──────────────────────────
  const [items, setItems] = useState<Item[]>([]);
  // ↑ items = 在庫リスト（最初は空配列）
  //   setItems = items を更新する関数
  //   useState = 「この変数が変わったら画面を再描画してね」という仕組み
  //   <Item[]> = 「Item型の配列ですよ」という型指定

  const [form, setForm] = useState({
    name: "",
    quantity: null,
    price: null,
    category: "",
  });
  // ↑ フォームの入力値を管理するState
  //   フォームに文字を打つたびにここが更新される

  const [loading, setLoading] = useState(true);
  // ↑ データ取得中かどうかのフラグ
  //   true = ローディング中、false = 完了

  const [error, setError] = useState("");
  // ↑ エラーメッセージを管理

  const [editingId, setEditingId] = useState<number | null>(null);
  // ↑ 「今どのIDの行を編集中か」を管理する
  //   null = 編集中なし、5 = ID:5の行を編集中

  const [editForm, setEditForm] = useState<Partial<Item>>({});
  // ↑ 編集中の一時的なデータを保存する
  //   Partial<Item> = 「Itemの全プロパティが省略可能」という型

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  // ↑ 今どのカテゴリを選んでいるか
  //   null = 「全て」を選んでいる状態
  //   "食品" = 「食品」ボタンを押している状態

  // ── データ取得（GET /api/items）────────────────
  const fetchItems = async () => {
    // ↑ async = 「この関数は非同期処理を含む」という宣言
    //   非同期 = 「待ってる間に他の処理をしていい」という意味
    try {
      const res = await fetch(`${API_URL}/api/items`);
      // ↑ await = 「レスポンスが来るまで待つ」
      //   fetch = HTTPリクエストを送る（LaravelのHTTP::get()と同じ）

      if (!res.ok) throw new Error("データ取得に失敗しました");
      // ↑ res.ok = HTTPステータスが200系かどうか
      //   失敗したら Error を投げる（PHPの throw new Exception と同じ）

      const data: Item[] = await res.json();
      // ↑ レスンポンスのJSON文字列をJavaScriptオブジェクトに変換
      //   : Item[] = 「Item型の配列として扱う」という型指定

      setItems(data);
      // ↑ 取得したデータで items を更新 → 画面が再描画される
    } catch (e) {
      setError(
        "APIに接続できません。バックエンドが起動しているか確認してください。",
      );
    } finally {
      setLoading(false);
      // ↑ 成功でも失敗でもローディングを終了
    }
  };

  // ── 画面表示時に1回だけデータ取得 ──────────────
  useEffect(() => {
    fetchItems();
  }, []);
  // ↑ useEffect = 「画面が表示されたときに実行する処理」
  //   [] = 「最初の1回だけ実行」という意味（依存配列が空）
  //   Laravelのコントローラーのindex()メソッドに相当

  // ── アイテム追加（POST /api/items）────────────
  const addItem = async () => {
    if (!form.name) {
      alert("商品名を入力してください");
      return;
    }
    // ↑ 簡単なバリデーション

    try {
      const res = await fetch(`${API_URL}/api/items`, {
        method: "POST",
        // ↑ HTTP メソッドを POST に指定

        headers: { "Content-Type": "application/json" },
        // ↑ 「JSONを送りますよ」というヘッダー
        //   これがないとC#側でデータを受け取れない！

        body: JSON.stringify({
          ...form,
          // ↑ ...form = formの中身を展開（スプレッド構文）
          id: 0,
          // ↑ C#側でDBが自動採番するので0でOK
          createdAt: new Date().toISOString(),
          // ↑ 現在時刻をISO形式の文字列に変換
        }),
      });

      if (!res.ok) throw new Error("追加に失敗しました");

      // フォームをリセット
      setForm({ name: "", quantity: null, price: null, category: "" });

      // 一覧を再取得
      await fetchItems();
    } catch (e) {
      alert("追加に失敗しました");
    }
  };

  // ── 編集開始：「編集」ボタンを押したとき ─────────
  const startEdit = (item: Item) => {
    // ↑ ① seartEdit → startEdit に修正！タイポ（スペルミス）だった
    setEditingId(item.id);
    // ↑ 「このIDの行を編集モードにする」

    setEditForm({
      quantity: item.quantity,
      price: item.price,
      name: item.name,
      category: item.category,
    });
    // ↑ 今の値をeditFormにコピーしておく
    //   これがないと入力欄が空になってしまう
  };

  // ── 編集キャンセル ────────────────────────────
  const cancelEdit = () => {
    setEditingId(null);
    // ↑ 編集モードを解除するだけ
    setEditForm({});
  };

  // ── 編集保存：PUT /api/items/:id を呼ぶ ────────
  const saveEdit = async (item: Item) => {
    const updatedItem: Item = {
      ...item,
      // ↑ まず元のitemを全部コピー（id, name, category など）

      quantity: editForm.quantity ?? item.quantity,
      // ↑ editFormに quantity があればそれを使う、なければ元の値
      //   ?? = 「左がnull/undefinedなら右を使う」

      price: editForm.price ?? item.price,
      name: editForm.name ?? item.name,
      category: editForm.category ?? item.category,
    };

    try {
      const res = await fetch(`${API_URL}/api/items/${item.id}`, {
        method: "PUT",
        // ↑ PUTメソッド = 更新（CRUD의 Update）
        //   LaravelのRoute::put()と同じ

        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedItem),
        // ↑ 更新後の全データをJSONで送る
        //   C#のUpdateItem(int id, Item item)で受け取る
      });

      if (!res.ok) throw new Error("更新に失敗しました");

      setEditingId(null);
      // ↑ 成功したら編集モードを終了

      setEditForm({});
      await fetchItems();
      // ↑ 最新データを再取得して画面を更新
    } catch (e) {
      alert("更新に失敗しました");
    }
  };

  // ── アイテム削除（DELETE /api/items/:id）───────
  const deleteItem = async (id: number) => {
    if (!confirm("削除しますか？")) return;
    // ↑ confirm = ブラウザの確認ダイアログ
    //   OKを押さなければ処理しない

    try {
      const res = await fetch(`${API_URL}/api/items/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("削除に失敗しました");

      await fetchItems();
      // ↑ 削除後に一覧を再取得して画面を更新
    } catch (e) {
      alert("削除に失敗しました");
    }
  };

  // ── カテゴリ一覧を自動生成 ────────────────────────
  const categories = Array.from(
    new Set(items.map((item) => item.category).filter(Boolean)),
  );
  // ↑ 順番に読むと：
  //   items.map((item) => item.category)
  //   → ["食品", "電子機器", "食品", "文具"] のように全カテゴリを取り出す
  //
  //   .filter(Boolean)
  //   → 空文字やnullを除外する（カテゴリ未入力のものを無視）
  //
  //   new Set(...)
  //   → Set = 重複を自動で消してくれるデータ構造
  //   → ["食品", "電子機器", "食品"] → ["食品", "電子機器"] になる
  //
  //   Array.from(...)
  //   → SetをただのArrayに戻す（mapやfilterが使えるようにするため）
  //
  //   結果：["食品", "電子機器", "文具"] のような重複なし配列

  // ── 表示するアイテムをフィルタリング ──────────────
  const filteredItems = selectedCategory
    ? items.filter((item) => item.category === selectedCategory)
    : items;
  // ↑ selectedCategory が null（全て）なら items をそのまま使う
  //   selectedCategory が "食品" なら food だけに絞る
  //   PHPの array_filter($items, fn($i) => $i->category === $selected) と同じ

  // ── 画面の描画 ────────────────────────────────
  return (
    <main className="p-8 max-w-5xl mx-auto">
      {/* ↑ Tailwind CSSのクラス */}
      {/* p-8 = padding 2rem、max-w-5xl = 最大幅、mx-auto = 中央揃え */}

      <h1 className="text-2xl font-bold mb-6">📦 在庫管理アプリ</h1>

      {/* ── 追加フォーム ── */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h2 className="font-bold mb-3">新規追加</h2>
        <div className="flex gap-2 flex-wrap">
          <input
            className="border rounded px-2 py-1"
            placeholder="商品名"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            // ↑ onChange = 文字を打つたびに発火
            //   e.target.value = 入力された文字
            //   { ...form, name: e.target.value } = formの他の値はそのまま、nameだけ更新
          />

          <input
            className="border rounded px-2 py-1 w-24"
            placeholder="数量"
            type="number"
            value={form.quantity ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                quantity: e.target.value === "" ? null : Number(e.target.value),
              })
            }
            // ↑ Number() = 文字列を数値に変換（inputの値は常に文字列なので変換が必要）
          />

          <input
            className="border rounded px-2 py-1 w-28"
            placeholder="価格"
            type="number"
            value={form.price ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                price: e.target.value === "" ? null : Number(e.target.value),
              })
            }
          />

          <input
            className="border rounded px-2 py-1"
            placeholder="カテゴリ"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />

          <button
            className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
            onClick={addItem}
            // ↑ onClick = ボタンを押したときに addItem 関数を実行
          >
            追加
          </button>
        </div>
      </div>

      {/* ── ローディング・エラー表示 ── */}
      {loading && <p className="text-gray-500">読み込み中...</p>}
      {/* ↑ loading が true のときだけ表示（PHPの if($loading) に相当） */}

      {error && <p className="text-red-500">{error}</p>}
      {/* ↑ error が空文字以外のときだけ表示 */}

      {/* ── カテゴリフィルターボタン ── */}
      {!loading && !error && (
        <div className="flex gap-2 flex-wrap mb-4">
          {/* 「全て」ボタン */}
          <button
            className={`px-3 py-1 rounded text-sm border ${
              selectedCategory === null
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
            // ↑ selectedCategory が null（全て選択中）なら青く、それ以外は白に
            //   テンプレートリテラル（バッククォート）の中で条件分岐している
            onClick={() => setSelectedCategory(null)}
            // ↑ 押したら selectedCategory を null にリセット → 全件表示
          >
            全て（{items.length}）{/* ↑ 全件数を表示 */}
          </button>

          {/* カテゴリボタンを自動生成 */}
          {categories.map((category) => (
            <button
              key={category}
              // ↑ key は map で必須！重複しないcategoryをkeyにする
              className={`px-3 py-1 rounded text-sm border ${
                selectedCategory === category
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
              // ↑ このボタンのcategoryが選択中なら青く、それ以外は白
              onClick={() => setSelectedCategory(category)}
              // ↑ 押したら selectedCategory をこのカテゴリに更新
            >
              {category}（{items.filter((i) => i.category === category).length}
              ）{/* ↑ カテゴリ名と、そのカテゴリの件数を表示 */}
              {/* items.filter(...).length = そのカテゴリのアイテム数 */}
            </button>
          ))}
        </div>
      )}

      {/* ── 在庫一覧テーブル ── */}
      {!loading && !error && (
        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-3 py-2">ID</th>
              <th className="border border-gray-300 px-3 py-2">商品名</th>
              <th className="border border-gray-300 px-3 py-2">数量</th>
              <th className="border border-gray-300 px-3 py-2">価格</th>
              <th className="border border-gray-300 px-3 py-2">カテゴリ</th>
              <th className="border border-gray-300 px-3 py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              // ↑ items から filteredItems に変更！絞り込んだ結果が0件の時の表示用
              <tr>
                <td colSpan={6} className="text-center py-4 text-gray-400">
                  データがありません
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                // ↑ items.map から filteredItems.map に変更！選択したカテゴリのデータだけをループ処理する
                <tr key={item.id} className="hover:bg-gray-50">
                  {/* ↑ key = ReactがどのDOM要素か識別するために必須！ */}

                  {/* ID列は常に表示 */}
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    {item.id}
                  </td>

                  {/* ── 編集中かどうかで表示を切り替える ── */}
                  {editingId === item.id ? (
                    // ↑ 「このidの行が編集中なら入力欄を表示」
                    //   PHPの if($editingId === $item->id) と同じ
                    <>
                      {/* 編集中：商品名 */}
                      <td className="border border-gray-300 px-2 py-1">
                        <input
                          className="border rounded px-2 py-1 w-full"
                          value={editForm.name ?? ""}
                          onChange={(e) =>
                            setEditForm({ ...editForm, name: e.target.value })
                          }
                        />
                      </td>

                      {/* 編集中：数量 ← 在庫が増減するのはここ！ */}
                      <td className="border border-gray-300 px-2 py-1">
                        <input
                          className="border rounded px-2 py-1 w-20"
                          type="number"
                          value={editForm.quantity ?? ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              quantity:
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                            })
                          }
                          // ↑ ここで数量を変更できる！
                          //   在庫が入荷したら増やす、出荷したら減らす
                        />
                      </td>

                      {/* 編集中：価格 */}
                      <td className="border border-gray-300 px-2 py-1">
                        <input
                          className="border rounded px-2 py-1 w-24"
                          type="number"
                          value={editForm.price ?? ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              price:
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                            })
                          }
                        />
                      </td>

                      {/* 編集中：カテゴリ */}
                      <td className="border border-gray-300 px-2 py-1">
                        <input
                          className="border rounded px-2 py-1 w-full"
                          value={editForm.category ?? ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              category: e.target.value,
                            })
                          }
                        />
                      </td>

                      {/* 編集中：保存・キャンセルボタン */}
                      <td className="border border-gray-300 px-2 py-1 text-center">
                        <div className="flex gap-1 justify-center">
                          <button
                            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm"
                            onClick={() => saveEdit(item)}
                            // ↑ 押したら saveEdit(item) を実行 → PUT送信
                          >
                            保存
                          </button>
                          <button
                            className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500 text-sm"
                            onClick={cancelEdit}
                            // ↑ 押したら cancelEdit() → 編集モード解除
                          >
                            戻る
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    // ↑ 編集中でない行は通常の表示
                    <>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        {item.name}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        {item.quantity}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        ¥{(item.price ?? 0).toLocaleString()}
                        {/* ↑ toLocaleString() = 1000→1,000 のようにカンマ区切りにする */}
                        {/* ↑ (item.price ?? 0) = priceがnullなら0として表示 */}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        {item.category}
                      </td>
                      {/* ② 編集ボタンを追加！元のコードに抜けていた */}
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        <div className="flex gap-1 justify-center">
                          <button
                            className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500 text-sm"
                            onClick={() => startEdit(item)}
                            // ↑ 押したら startEdit(item) → 編集モード開始
                          >
                            編集
                          </button>
                          <button
                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                            onClick={() => deleteItem(item.id)}
                            // ↑ () => deleteItem(item.id) = 「押したときにdeleteItem(このidで)実行」
                            //   直接 onClick={deleteItem(item.id)} と書くと即実行されてしまうので注意！
                          >
                            削除
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                  {/* ③ </tr>をここに移動！ズレていたのを修正 */}
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </main>
  );
}
