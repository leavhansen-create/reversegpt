with open('app/chat/page.tsx', 'r') as f:
    content = f.read()

old = '''  if (imgFailed) {
    return (
      <div
        className="rounded-full flex items-center justify-center font-bold flex-shrink-0 border select-none"
        style={{
          width: dims,
          height: dims,
          fontSize,
          background: professor.avatarBg,
          borderColor: professor.avatarBorder,
          color: professor.avatarText,
          letterSpacing: '0.01em',
        }}
      >
        {professor.initials}
      </div>
    )
  }'''

new = '''  if (imgFailed) {
    const fallbackDims = size === 'sm' ? 36 : size === 'lg' ? 52 : 44
    const fallbackFont = size === 'sm' ? 13 : size === 'lg' ? 20 : 16
    return (
      <div
        className="rounded-full flex items-center justify-center font-bold flex-shrink-0 border select-none"
        style={{
          width: fallbackDims,
          height: fallbackDims,
          fontSize: fallbackFont,
          background: professor.avatarBg,
          borderColor: professor.avatarBorder,
          color: professor.avatarText,
          letterSpacing: '0.01em',
        }}
      >
        {professor.initials}
      </div>
    )
  }'''

content = content.replace(old, new)

with open('app/chat/page.tsx', 'w') as f:
    f.write(content)

print('Done!')
