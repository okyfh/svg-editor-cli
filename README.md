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

阶段 1：项目配置、严格类型检查、CLI 启动骨架及架构方案。
目前只显示 `svg>` 提示符、忽略空行和注释；所有非空命令均明确报告尚未实现。
图形、命令、SVG 文件读写和撤销重做均待后续阶段实现。

- [架构方案与过程记录](doc/README.md)
- [原始作业要求](doc/assignment.md)

后续按图形模型 → 命令解析与显示 → 编辑与撤销重做 → SVG IO → 验证与报告逐步推进。
每阶段 review 后分步提交；全部验收后才创建 `final` 标签。
