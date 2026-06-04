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
  quantity: number; // 数値
  price: number; // 数値
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
    quantity: 0,
    price: 0,
    category: "",
  });
  // ↑ フォームの入力値を管理するState
  //   フォームに文字を打つたびにここが更新される

  const [loading, setLoading] = useState(true);
  // ↑ データ取得中かどうかのフラグ
  //   true = ローディング中、false = 完了

  const [error, setError] = useState("");
  // ↑ エラーメッセージを管理

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
      // ↑ レスポンスのJSON文字列をJavaScriptオブジェクトに変換
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
          //   { name: '', quantity: 0, price: 0, category: '' } が展開される
          id: 0,
          // ↑ C#側でDBが自動採番するので0でOK
          createdAt: new Date().toISOString(),
          // ↑ 現在時刻をISO形式の文字列に変換
        }),
      });

      if (!res.ok) throw new Error("追加に失敗しました");

      // フォームをリセット
      setForm({ name: "", quantity: 0, price: 0, category: "" });

      // 一覧を再取得
      await fetchItems();
    } catch (e) {
      alert("追加に失敗しました");
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

  // ── 画面の描画 ────────────────────────────────
  return (
    <main className="p-8 max-w-4xl mx-auto">
      {/* ↑ Tailwind CSSのクラス */}
      {/* p-8 = padding 2rem、max-w-4xl = 最大幅、mx-auto = 中央揃え */}

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
            value={form.quantity}
            onChange={(e) =>
              setForm({ ...form, quantity: Number(e.target.value) })
            }
            // ↑ Number() = 文字列を数値に変換（inputの値は常に文字列なので変換が必要）
          />

          <input
            className="border rounded px-2 py-1 w-28"
            placeholder="価格"
            type="number"
            value={form.price}
            onChange={(e) =>
              setForm({ ...form, price: Number(e.target.value) })
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
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-4 text-gray-400">
                  データがありません
                </td>
              </tr>
            ) : (
              items.map((item) => (
                // ↑ map = 配列を1つずつ処理して画面を作る（PHPのforeachと同じ）
                <tr key={item.id} className="hover:bg-gray-50">
                  {/* ↑ key = ReactがどのDOM要素か識別するために必須！ */}
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    {item.id}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    {item.name}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    {item.quantity}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right">
                    ¥{item.price.toLocaleString()}
                    {/* ↑ toLocaleString() = 1000→1,000 のようにカンマ区切りにする */}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    {item.category}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                      onClick={() => deleteItem(item.id)}
                      // ↑ () => deleteItem(item.id) = 「押したときにdeleteItem(このidで)実行」
                      //   直接 onClick={deleteItem(item.id)} と書くと即実行されてしまうので注意！
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </main>
  );
}
