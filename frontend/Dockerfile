# frontend/Dockerfile
# Next.js を Docker で動かす設定

FROM node:20-alpine
# ↑ Node.js 20 の軽量版Linux
#   Next.js は Node.js で動くので Node イメージを使う

WORKDIR /app
# ↑ 作業場所を /app に設定
#   docker-compose.yml の volumes: ./frontend:/app と合わせる！

COPY package*.json ./
# ↑ package.json と package-lock.json だけ先にコピー
#   次の npm install をキャッシュするため
#   （package.jsonが変わらない限り毎回インストールしなくて済む）

RUN npm install
# ↑ 必要なパッケージをインストール
#   composer install と全く同じ意味

COPY . .
# ↑ 残りのファイルを全部コピー
#   volumes でリアルタイム同期されるので実質上書きされるが
#   初回ビルド用に一応コピー

EXPOSE 3000
# ↑ 3000番ポートを使うと宣言

CMD ["npm", "run", "dev"]
# ↑ 開発サーバーを起動
#   docker-compose up したら自動でこれが動く