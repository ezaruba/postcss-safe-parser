let { eachTest, jsonify } = require('postcss-parser-tests')

let parse = require('../lib/safe-parse')

eachTest((name, css, json) => {
  if (name !== 'apply.css' && name !== 'custom-properties.css') {
    it('parses ' + name, () => {
      let parsed = jsonify(parse(css, { from: name }))
      expect(parsed).toEqual(json)
    })
  }
})

it('fixes unclosed blocks in safe mode', () => {
  expect(parse('@media (screen) { a {\n').toString()).toEqual(
    '@media (screen) { a {\n}}'
  )
  expect(parse('a { color').toString()).toEqual('a { color}')
  expect(parse('a { color: black').first.first.prop).toEqual('color')
})

it('fixes unnecessary block close in safe mode', () => {
  let root = parse('a {\n} }')
  expect(root.first.toString()).toEqual('a {\n}')
  expect(root.raws.after).toEqual(' }')
})

it('fixes unclosed comment in safe mode', () => {
  let root = parse('a { /* b ')
  expect(root.toString()).toEqual('a { /* b */}')
  expect(root.first.first.text).toEqual('b')
})

it('fixes column and semicolumn case', () => {
  expect(parse('a{:;}').toString()).toEqual('a{}')
})

it('fixes unclosed quote in safe mode', () => {
  expect(parse('a { content: "b').first.first.value).toEqual('"b')
})

it('fixes unclosed bracket', () => {
  expect(parse(':not(one() { }').toString()).toEqual(':not(one() { }')
})

it('fixes property without value in safe mode', () => {
  let root = parse('a { color: white; one }')
  expect(root.first.nodes).toHaveLength(1)
  expect(root.first.raws.semicolon).toBe(true)
  expect(root.first.raws.after).toEqual(' one ')
})

it('fixes 2 properties in safe mode', () => {
  let root = parse('a { color one: white; one }')
  expect(root.first.nodes).toHaveLength(1)
  expect(root.first.first.prop).toEqual('color')
  expect(root.first.first.raws.between).toEqual(' one: ')
})

it('fixes nameless at-rule in safe mode', () => {
  let root = parse('@')
  expect(root.first.type).toEqual('atrule')
  expect(root.first.name).toEqual('')
})

it('fixes property without semicolon in safe mode', () => {
  let root = parse('a { one: 1 two: 2 }')
  expect(root.first.nodes).toHaveLength(2)
  expect(root.toString()).toEqual('a { one: 1; two: 2 }')
})

it('does not fall on missed semicolon in IE filter', () => {
  expect(() => {
    parse("a { one: two: progid:DX(a='1', b='2'); }")
  }).not.toThrow()
})

it('fixes double colon in safe mode', () => {
  let root = parse('a { one:: 1 }')
  expect(root.first.first.value).toEqual(': 1')
})

it('fixes colon instead of semicolon', () => {
  let root = parse('a { one: 1: } b { one: 1 : }')
  expect(root.toString()).toEqual('a { one: 1: } b { one: 1 : }')
})
