# SVG Editor CLI

高级软件开发技术 Lab 1：与 AI 协作实现 TypeScript 命令行 SVG 编辑器。

## 环境与启动

需要 Node.js 24.x（自带 npm）。macOS 使用 Homebrew 时：

```bash
brew install node@24
export PATH="$(brew --prefix node@24)/bin:$PATH"
```

使用 nvm 时可运行 `nvm install`、`nvm use`，版本由 `.nvmrc` 指定。

在仓库根目录执行：

```bash
npm ci
npm run check
npm run cli
```

`npm run cli` 直接运行 TypeScript；`npm run build` 编译后可用 `npm start` 启动。Ctrl+D（EOF）或 Ctrl+C 结束。

## 当前进度

阶段 6：已完成要求对照、架构自查与验收文档整理；全部规定命令、原文 SVG 示例和完整会话均已通过功能验证。

| 已支持 | 说明 |
|---|---|
| `init [w] [h]` | 新建画布，默认 800×600 |
| `read <file.svg>` | 读取 SVG，缺失 id 自动补齐并警告 |
| `save [file.svg]` | 保存当前文档，支持省略已有默认路径 |
| `canvas [w] [h]` | 查看尺寸；修改时必须同时提供宽和高 |
| `create` | 支持 rect / circle / ellipse / line / text / g，及尾缀 `in <containerId>` |
| `tree [id]` / `show <id>` | 显示结构树、内联几何属性、父容器与属性明细 |
| `delete` / `move` / `scale` / `set` | 删除、平移、等比缩放与属性修改 |
| `group` / `ungroup` / `addto` | 分组、解组与归属调整 |
| `front` / `back` | 调整同级图形绘制顺序 |
| `undo` / `redo` | 每条编辑命令为一个撤销单元 |
| `help` | 列出全部命令语法 |

文本使用双引号，支持空文本及引号内的 `\"`、`\\` 转义。只有整行第一个非空字符为 `#` 才是注释，颜色参数不会被截断。
带空格的文件路径同样使用双引号。文件使用 UTF-8 编码。

每条成功编辑（含 create）进入撤销历史。undo 后的新编辑清空 redo；失败命令及 tree/show/help/只读 canvas 不影响历史。
成功执行 init/read/save 或修改画布尺寸后，undo/redo 报 `error: undo not allowed after io command`，直到下一条成功编辑。
撤销重做采用精确快照，反馈以 `undone:` / `redone:` 标明对应编辑。

`npm test` 执行领域、CLI、撤销历史与 SVG IO 行为测试，`npm run check` 检查源码及测试类型、编译并运行测试。

可运行作业中的两节点流程图示例：

```bash
npm run cli < examples/flowchart.txt
```

该脚本只创建节点和连接线并显示信息；下面的读写示例还会保存 SVG。

体验编辑与撤销重做：

```bash
npm run cli < examples/edit-history.txt
```

该脚本演示分组、移动、缩放、修改文字、排序、归属调整、解组与删除，以及撤销重做和画布尺寸修改后的历史重置。

## SVG 文件读写

```bash
npm run cli < examples/save-read.txt
```

在仓库根目录运行，会生成或更新 `examples/flowchart.svg`，读回确认结构，再导入 `examples/other.svg` 演示缺 id 补全。
将 `examples/flowchart.svg` 拖进浏览器即可预览。

- `read` 成功后记住读入路径，无参数 `save` 保存回该路径。
- 新建文档首次保存须指定路径，该路径成为默认路径；另存到其他文件不会改变默认路径；`init` 清除默认路径。
- 缺 id（包括空 id）按标签名加序号补齐，避开全文档已有 id；重复的显式 id 拒绝读入。
- 读取先构建临时文档并校验，成功后才替换当前文档；失败保留原文档、路径及 undo/redo。
- 保存先序列化，再使用同目录临时文件原子替换目标。父目录必须存在；目录、符号链接和只读文件会报错。

## SVG 导入范围

支持 rect/circle/ellipse/line/text/g、各自几何属性及 fill/stroke/stroke-width，保留嵌套顺序、文字内容和样式缺省值。支持 XML 实体、CDATA、注释和 SVG 命名空间前缀。导入还支持 font-size、text-anchor 等展示属性、根级样式与行内 style；这些导入属性不扩大 CLI set 的白名单。

支持数字或 px 长度，保留合法 viewBox 及其坐标映射；canvas 修改尺寸后重设为 `0 0 width height`。缺少画布尺寸时取 viewBox 的宽高，否则默认 800×600。缺少图形几何参数时按 0 导入。

支持作业示例的 translate、正数等比 scale、变换列表和嵌套组合。导入时按 SVG 变换顺序折算为画布坐标，并同步保留变换后的文字字号、居中方式和线宽；之后可正常编辑、撤销重做和保存读回。

```bash
npm run cli < examples/transform-roundtrip.txt
```

`examples/assignment-transform.svg` 是原始作业示例，脚本将其读入并保存为 `examples/assignment-transform-roundtrip.svg`。两者已经浏览器目视对照，截图一致。

path 不属于本作业规定的六类图形，box 属后续插件阶段。旋转/斜切/非等比变换、完整 CSS 样式表/选择器、百分比长度、tspan、DOCTYPE 与外部样式指令也不在当前导入能力内，遇到它们会明确报错。作业中全部实际 SVG 示例（含预览样式）均已作为回归用例通过。

- [主要功能手动验证](doc/MANUAL_TEST.md)
- [最终验收记录与交付清单](doc/ACCEPTANCE.md)
- [架构方案与过程记录](doc/README.md)
- [原始作业要求](doc/assignment.md)

`npm run check` 包括源码、测试和验收工具的类型检查、架构检查、生产构建及 51 个测试，其中包含原作业完整会话、全部 SVG 示例及错误约定的回归验收。
单独运行 `npm run check:architecture` 可检查 62 个源码文件的依赖方向、一类一文件和循环依赖。

架构图、设计取舍、真实迭代过程和实现一致性自查统一见 `doc/README.md`。
每阶段 review 后分步提交；全部验收后才创建 `final` 标签。
