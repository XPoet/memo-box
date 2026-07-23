import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const elementPlusStylePath = resolve(process.cwd(), 'src/styles/_element-plus.scss')
const elementPlusStyles = readFileSync(elementPlusStylePath, 'utf8')
const entryPath = resolve(process.cwd(), 'src/main.ts')
const entrySource = readFileSync(entryPath, 'utf8')

describe('Element Plus 编程式服务样式', () => {
  it('加载确认框和提示消息的按需样式，并提供可见的遮罩与输入框样式', () => {
    expect(entrySource).toContain("import 'element-plus/es/components/message-box/style/css'")
    expect(entrySource).toContain("import 'element-plus/es/components/message/style/css'")
    expect(elementPlusStyles).toContain('.el-overlay-message-box')
    expect(elementPlusStyles).toContain('.el-message-box__input .el-input__wrapper')
  })
})
