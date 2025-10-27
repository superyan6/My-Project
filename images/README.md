生成 WebP / AVIF 参考（Windows）

推荐工具：
- ImageMagick (magick)
- ffmpeg (for AVIF via libaom/libsvt)
- Squoosh-cli 或 sharp (Node.js)

1) 用 ImageMagick 生成 WebP：
magick convert playlist1.svg -quality 80 images/playlist1.webp

2) 用 Squoosh (Node) 生成 AVIF（需安装 @squoosh/cli）：
npx @squoosh/cli --output-dir=./ images/playlist1.svg --avif  "effort=6" "quality=80"

3) 使用 sharp (Node.js)：
node -e "const sharp=require('sharp'); sharp('images/playlist1.svg').resize(300,200).toFile('images/playlist1.avif')"

快速开始（使用仓库内的生成脚本）:

1) 打开 PowerShell，进入项目目录：
```powershell
cd "F:\Web-Project\My-Project"
```

2) 安装依赖（只需一次）：
```powershell
npm install
```

3) 运行生成脚本：
```powershell
npm run generate-images
```

运行后会在 `images/` 目录生成对应的 `.avif` 与 `.webp` 文件（基于现有 `.svg`）。

注意：在 Windows 上请确保在 PowerShell 使用正确路径，且已安装对应工具。生成后可在 HTML 中按以下优先顺序使用：
<picture>
  <source type="image/avif" srcset="./images/playlist1.avif">
  <source type="image/webp" srcset="./images/playlist1.webp">
  <img src="./images/playlist1.svg" alt="...">
</picture>

如果遇到 sharp 安装问题，可参考官方文档安装对应的本机依赖或使用 `--arch`/`--platform` 选项。
