# Lab 1 Phase 1 最终验收记录

自动化及既有浏览器验收记录日期：2026-10-28。学生本人手动验收确认日期：2026-10-30。验收对象为本地实现；文档后续更新经用户 review 后提交并 push，本文不表示 final 标签已经更新。

## 验收参与与证据说明

本项目同时保留学生本人验收与 AI 自动验证的证据。学生本人负责提出验收要求、质疑完成范围、要求浏览器重试、审查设计模式说明，并已完成基础功能和复杂图形样例的手动验收；AI 负责执行自动化测试、脚本回放和既有浏览器验证。具体讨论见 [过程记录](README.md)。

学生于 2026-10-30 确认已完成 [基础功能手动验收](MANUAL_TEST.md)，并额外使用 [complex-demo.svg](../complex-demo.svg) 验证复杂图形结构。样例画布为 1280×860，包含 113 个元素与容器（不计 svg 根节点）、15 个 g 分组，并覆盖全部六种内置类型。该文件保留为本人综合验证的样例；文件结构统计由 AI 核对，不混同为 AI 代替本人执行了手动验收。

## 功能与证据

| 要求 | 结果 | 证据 |
|---|---|---|
| 学生本人基础功能手动验收 | 已完成 | 学生 2026-10-30 确认；步骤见 MANUAL_TEST.md |
| 学生本人复杂图形结构验证 | 已完成 | complex-demo.svg；113 个元素与容器、三级 g 嵌套，覆盖六种内置类型 |
| 六类图形、唯一 id、容器与叶子统一操作 | 通过 | domain.test.ts、cli.test.ts |
| init/read/save/canvas、默认路径与失败原子性 | 通过 | io.test.ts |
| 全部十类编辑操作及每条命令一个 undo 单元 | 通过 | history.test.ts |
| group/ungroup/addto 的层级、顺序和循环拒绝 | 通过 | domain.test.ts、history.test.ts、requirements.test.ts |
| front/back 仅调整同级绘制顺序 | 通过 | domain.test.ts、history.test.ts |
| undo 后新编辑清空 redo；显示与失败不消耗历史 | 通过 | history.test.ts |
| 成功 init/read/save/canvas 写操作关闭撤销，下一编辑解除 | 通过 | history.test.ts、io.test.ts |
| 空行、注释、双引号、颜色参数与持续 REPL | 通过 | cli.test.ts 的分词与真实子进程用例 |
| tree 内联几何、局部子树；show 属性及父容器；help 全语法 | 通过 | cli.test.ts |
| 缺 id 补全、全文档冲突避让、警告仅在读取成功后输出 | 通过 | io.test.ts |
| 原文全部实际 SVG（含嵌套变换和预览样式） | 通过 | requirements.test.ts 从 doc/assignment.md 抽取并往返读写 |
| 原文第 6 节完整命令会话 | 通过 | requirements.test.ts；只有原文预期的两条错误 |
| XML 特殊字符、文字子内容、空文字与样式缺省 | 通过 | io.test.ts |
| 浏览器可预览输出 | 通过 | doc/images/flowchart-preview.jpg、transform-original.jpg、transform-roundtrip.jpg |
| TypeScript 严格检查、生产编译 | 通过 | npm run check |
| 模块职责、依赖方向、一类一文件、循环依赖 | 通过 | npm run check:architecture；62 个源码文件 |

原始 transform 示例与保存结果的截图 SHA-256 相同：
`db6935498d62f86f80629a9609405c4a987c10b91e2bbf4393a279bf23551e84`。

## 本地可复核命令

从仓库根目录执行：

```bash
npm ci
npm run check
npm run cli < examples/flowchart.txt
npm run cli < examples/edit-history.txt
npm run cli < examples/save-read.txt
npm run cli < examples/transform-roundtrip.txt
```

`check` 包含源码、测试和工具的严格类型检查、架构规则、生产构建及 51 个行为测试。
生产构建不包含 test/ 或 scripts/；构建后可运行 `npm start`。后两份示例会更新 examples/ 下的输出 SVG。

## 干净目录复现结果

已将当前待交付文件复制到独立临时目录，不带原 node_modules/、dist/ 或 .git/，按正常开发流程验证：

| 检查 | 实际结果 |
|---|---|
| npm ci | 成功，从锁文件安装 9 个包，audit 报告 0 个漏洞 |
| 严格类型检查 | src、test 和 scripts 全部通过 |
| 架构检查 | 62 个源码文件通过，无违规方向、循环依赖或类名/文件名不一致 |
| 生产构建 | 成功生成 dist/ |
| 行为测试 | 51 个通过，0 失败 |
| 编译产物回放四份示例 | flowchart、edit-history、save-read、transform-roundtrip 全部退出码 0，无 error 输出 |
| 文档与截图链接 | 两份 README 和本文本地链接均有效 |
| 架构图目视 | 浏览器实际渲染通过，模块文字、箭头与图例可读 |

npm 对 esbuild/fsevents 的安装脚本策略有提示，未影响本次安装、启动、编译或测试。此次不需要另外批准或运行安装脚本。

## 实现范围与已知取舍

- 本阶段要求六类图形；path 不在该列表，box/动态插件属于后续阶段，不纳入本次必做验收。
- 支持作业的 translate/正数等比 scale、列表与嵌套；导入归一到画布坐标并保持字号、居中与线宽。保存保证该支持范围内的语义等价，原始 transform 字符串、注释和排版不保证逐字保留。
- 导入支持展示属性与行内 style；完整 CSS 样式表/选择器、旋转/斜切/非等比变换、百分比长度与 tspan 不属于当前导入能力，会明确拒绝。
- CLI set 的白名单严格按原文，导入更多展示属性不使它们自动成为可 set 属性。
- tree/show 和撤销反馈保留要求的信息与语义；空格对齐、坐标排版及成功提示不逐字复制原文示例。
- 完整文档快照让撤销精确，但每条历史记录占 O(N) 时间与空间，暂未限制历史长度。当前面向课程规模的文档，不声称经过大文档性能验收。
- 架构脚本针对本项目使用的静态 import 和导出声明作检查，不能代替对全部运行时依赖和多态设计的人工判断。

## 提交要求

当前仓库已有阶段 1 至 4 的分步提交；第五、六阶段后来合并为 `183a586`，原因和补救过程见 doc/README.md 的过程记录。后续文档完善仍经用户 review 后提交并 push。

最终交付时须确认远程包含代码、doc/README.md、架构图、过程记录与验收证据；最后在最终提交上创建并推送 final 标签。原始文件没有给出具体截止日期，需以课程通知为准。

在用户确认前不自动创建 final 标签，不以本地测试通过冒充已经完成远程交付。
