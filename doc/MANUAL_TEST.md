# 主要功能手动验证

请按顺序验证。bash 代码在终端执行，text 代码在出现 svg> 后逐行输入；不要把 svg> 提示符本身输入进去。第 5 组会新建画布，前四组内容会被清空。

## 启动

```bash
cd "/Users/yangfuhui/Documents/课程文件/高级软件开发技术/lab1_proj/svg-editor-cli"
export PATH="/opt/homebrew/opt/node@24/bin:$PATH"
npm run cli
```

## 1. 画布与帮助

```text
tree
help
init
canvas
canvas 400 300
canvas
```

预期：首次 tree 提示尚无文档；help 列出全部命令；init 默认 800×600；最后 canvas 显示 400×300。

## 2. 六类图形、父容器及信息显示

```text
init 800 600
create g scene
create rect r1 10 20 100 50 red in scene
create circle c1 200 100 20 blue in scene
create ellipse e1 300 100 30 15 green in scene
create line l1 110 45 180 100 black in scene
create text t1 20 80 "Hello SVG" in scene
tree
tree scene
show c1
```

预期：scene 下有 rect/circle/ellipse/line/text 五个子元素，树内显示几何属性；show c1 显示 parent=g#scene、cx=200、cy=100、r=20、fill=blue。文字包含空格且内容完整。

## 3. 编辑、删除与撤销重做

```text
move r1 30 -10
show r1
undo
show r1
redo
scale r1 2
show r1
set t1 text "修改后的标题"
show t1
undo
redo
undo
set r1 fill orange
redo
delete e1
show e1
undo
show e1
```

预期：

- 第一次移动后 r1 为 x=40、y=10；undo 恢复 x=10、y=20，redo 恢复移动。
- scale 后 r1 为 x=80、y=20、width=200、height=100，位置和尺寸都乘 2。
- set 可修改中文文字；undo/redo 能还原修改。
- 撤销文字修改后再 set r1 是新编辑，此时 redo 应报 nothing to redo。
- delete 后 show e1 报 no such shape；undo 后 e1 完整恢复。

## 4. 分组、容器整体变换、归属与解组

```text
group node r1 t1
tree scene
move node 0 100
show r1
show t1
undo
scale node 0.5
show r1
undo
addto node c1
tree node
ungroup node
tree scene
undo
tree node
```

预期：

- node 是 scene 内的嵌套容器，最初包含 r1 和 t1。
- move node 后 r1 的 y=120、t1 的 y=180；undo 同时还原两者。
- scale node 后 r1 为 x=40、y=10、width=100、height=50；undo 还原整组。
- addto 后 c1 进入 node，成为最后一个子节点。
- ungroup 后 node 消失，三个子图形提升到 scene，保持顺序；undo 一次恢复整个 node。

## 5. 前后顺序（z-order）

```text
init 200 200
create rect red 10 10 120 120 red
create rect blue 50 50 120 120 blue
tree
front red
tree
back red
tree
```

预期：默认顺序 red、blue；front red 后顺序 blue、red；back red 后恢复 red、blue。SVG 后面的同级元素后绘制，显示在上层。

## 6. 保存、读取、默认路径和 IO 撤销限制

```text
save manual-check.svg
undo
read manual-check.svg
tree
move blue 10 0
save
read manual-check.svg
show blue
move blue 1 0
undo
show blue
```

预期：

- 仓库根目录生成 manual-check.svg；save 后 undo 报 undo not allowed after io command。
- 读回后两个矩形和层次一致；移动后无参数 save 保存回同一文件。
- 再读回，blue 的 x=60、y=50。
- read 后执行一次成功编辑即可重新 undo；最后 blue 的 x 仍为 60。
- 把 manual-check.svg 拖入浏览器，蓝色矩形应覆盖两个矩形的重叠区域。

## 7. 外部 SVG、补 id 和嵌套 transform

```text
read examples/other.svg
tree
read examples/assignment-transform.svg
show text1
save manual-transform.svg
```

预期：

- other.svg 导入 7 个元素，警告为缺 id 的矩形分配 rect1。
- transform 示例导入 6 个元素，为缺 id 的矩形和文字分配 rect1/text1。
- show text1 的 x=308、y=70.4、font-size=12.8、text-anchor=middle、内容 End。
- 把根目录 manual-transform.svg 拖入浏览器，与 examples/assignment-transform.svg 对比，矩形、连线和白色居中文字应一致。

## 8. 错误处理与失败不改状态

```text
tree
create g a
move missing 1 1
scale a 0
set a mystery 1
create g x in missing
group bad diagram a
ungroup diagram
create box n1 0 0 10 10 "box"
tree
```

预期：所有编辑都失败，依次为重复 id、找不到图形、缩放因子非正、未知属性、找不到容器、祖孙同时分组、顶层容器禁止解组、未知图形类型。每条错误都以 error: 开头，末尾 tree 应与开头完全相同。box 是后续插件阶段内容，此处报错符合本阶段要求。

验证结束按 Ctrl+D 退出。


## 实际执行反馈（2026-10-30 确认）

学生本人已确认完成基础功能手动验收，并在基础验证之外，使用 [complex-demo.svg](../complex-demo.svg) 完成较复杂图形结构的综合验证。

复杂样例为 1280×860 的系统架构图，包含 15 个分组、30 个矩形、16 个圆、2 个椭圆、20 条线和 30 个文字元素，共 113 个图形与容器（不计 svg 根节点）。三级 g 嵌套、业务节点、数据层和统计卡片构成了比单个命令示例更完整的验证场景。

本项结果依据学生本人的完成反馈；AI 对文件作了结构统计核对。AI 此前对验证命令的自动回放与本人此次手动验收是分别记录的工作。详细过程和质量证据见 [README.md](README.md) 与 [ACCEPTANCE.md](ACCEPTANCE.md)。
