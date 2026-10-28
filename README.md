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

阶段 3：已完成命令解析、六种图形创建与信息显示。

| 已支持 | 说明 |
|---|---|
| `init [w] [h]` | 新建画布，默认 800×600 |
| `canvas [w] [h]` | 查看尺寸；修改时必须同时提供宽和高 |
| `create` | 支持 rect / circle / ellipse / line / text / g，及尾缀 `in <containerId>` |
| `tree [id]` / `show <id>` | 显示结构树、内联几何属性、父容器与属性明细 |
| `help` | 列出全部命令语法，并标明后续阶段的命令 |

文本使用双引号，支持空文本及引号内的 `\"`、`\\` 转义。只有整行第一个非空字符为 `#` 才是注释，颜色参数不会被截断。
图形编辑命令及 undo/redo 在阶段 4 接入，read/save 在阶段 5 接入；当前调用会明确提示待实现阶段。

`npm test` 执行领域与 CLI 行为测试，`npm run check` 检查源码及测试类型、编译并运行测试。

可运行作业中的两节点流程图示例：

```bash
npm run cli < examples/flowchart.txt
```

脚本会创建节点和连接线，输出整棵树、文字属性及局部子树。当前尚不保存 SVG。

- [架构方案与过程记录](doc/README.md)
- [原始作业要求](doc/assignment.md)

后续按图形模型 → 命令解析与显示 → 编辑与撤销重做 → SVG IO → 验证与报告逐步推进。
每阶段 review 后分步提交；全部验收后才创建 `final` 标签。
