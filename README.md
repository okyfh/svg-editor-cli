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

阶段 4：已完成全部图形编辑命令与撤销重做，SVG 文件读写待阶段 5 实现。

| 已支持 | 说明 |
|---|---|
| `init [w] [h]` | 新建画布，默认 800×600 |
| `canvas [w] [h]` | 查看尺寸；修改时必须同时提供宽和高 |
| `create` | 支持 rect / circle / ellipse / line / text / g，及尾缀 `in <containerId>` |
| `tree [id]` / `show <id>` | 显示结构树、内联几何属性、父容器与属性明细 |
| `delete` / `move` / `scale` / `set` | 删除、平移、等比缩放与属性修改 |
| `group` / `ungroup` / `addto` | 分组、解组与归属调整 |
| `front` / `back` | 调整同级图形绘制顺序 |
| `undo` / `redo` | 每条编辑命令为一个撤销单元 |
| `help` | 列出全部命令语法，并标明后续阶段的命令 |

文本使用双引号，支持空文本及引号内的 `\"`、`\\` 转义。只有整行第一个非空字符为 `#` 才是注释，颜色参数不会被截断。
read/save 在阶段 5 接入；当前调用会明确提示待实现阶段。

每条成功编辑（含 create）进入撤销历史。undo 后的新编辑清空 redo；失败命令及 tree/show/help/只读 canvas 不影响历史。
init 或修改画布尺寸后，undo/redo 报 `error: undo not allowed after io command`，直到下一条成功编辑。
撤销重做采用精确快照，反馈以 `undone:` / `redone:` 标明对应编辑。

`npm test` 执行领域、CLI 与撤销历史行为测试，`npm run check` 检查源码及测试类型、编译并运行测试。

可运行作业中的两节点流程图示例：

```bash
npm run cli < examples/flowchart.txt
```

脚本会创建节点和连接线，输出整棵树、文字属性及局部子树。当前尚不保存 SVG。

体验编辑与撤销重做：

```bash
npm run cli < examples/edit-history.txt
```

该脚本演示分组、移动、缩放、修改文字、排序、归属调整、解组与删除，以及撤销重做和画布尺寸修改后的历史重置。

- [架构方案与过程记录](doc/README.md)
- [原始作业要求](doc/assignment.md)

后续按图形模型 → 命令解析与显示 → 编辑与撤销重做 → SVG IO → 验证与报告逐步推进。
每阶段 review 后分步提交；全部验收后才创建 `final` 标签。
